import json
import logging
import asyncio
from typing import List
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.core.config import GOOGLE_API_KEY, GOOGLE_AI_MODEL
from app.models.documento import Documento
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.reactivo import Reactivo
from app.models.opcion import Opcion
from app.schemas.question import QuestionGenerationRequest
import re

logger = logging.getLogger(__name__)

def _extract_json(text: str):
    """
    Intenta extraer y parsear JSON de un texto que puede contener markdown.
    """
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    try:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            json_str = text[start:end+1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
        
    raise ValueError("No se pudo extraer un JSON válido de la respuesta de la IA.")

async def generate_questions(db: Session, request: QuestionGenerationRequest, user_id: int):
    documents = db.query(Documento).filter(Documento.id.in_(request.document_ids)).all()
    if not documents:
        raise ValueError("No se encontraron los documentos seleccionados.")
    
    full_text = "\n\n".join([doc.content_text for doc in documents if doc.content_text])
    if not full_text.strip():
        raise ValueError("Los documentos seleccionados no contienen texto procesable.")

    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY no configurada. Usando generación simulada.")
        return _simulate_generation(db, request, documents[0].id)

    client = genai.Client(api_key=GOOGLE_API_KEY)
    model_to_use = request.model_name or GOOGLE_AI_MODEL
    logger.info(f"Generando preguntas con el modelo: {model_to_use} (Async Batch)")
    
    BATCH_SIZE = 5
    total_questions = request.num_questions
    batches = []
    
    for i in range(0, total_questions, BATCH_SIZE):
        batch_count = min(BATCH_SIZE, total_questions - i)
        batches.append(batch_count)

    async def generate_batch(count: int, index: int):
        prompt = f"""
        Eres un experto pedagogo diseñando evaluaciones académicas de alta calidad.
        Basado en el siguiente contenido, genera exactamente {count} reactivos de tipo {request.question_type.value}.
        
        CONTEXTO ACADÉMICO:
        - Programa: {request.program}
        - Materia: {request.subject}
        - Tema: {request.topic}
        - Nivel de dificultad: {request.difficulty.value}
        
        RESTRICCIONES:
        - Generar exactamente {count} preguntas (Batch #{index+1}).
        - Tipo de reactivo: {request.question_type.value} (MCQ: Opción múltiple, TF: Verdadero/Falso, OPEN: Respuesta abierta).
        - Para MCQ: Generar 1 opción correcta y {request.wrong_option_count} distractores plausibles.
        - Para TF: Enunciado claro con una opción señalada como correcta.
        - Evitar ambigüedades.

        ESTÁNDARES TÉCNICOS Y PEDAGÓGICOS (CRÍTICO):
        1. Reducción de varianza irrelevante: El lenguaje debe ser gramaticalmente perfecto y claro.
        2. Equidad y sensibilidad: Eliminar cualquier sesgo o estereotipo.
        3. Calidad de las opciones: Distractores PLAUSIBLES pero INEQUÍVOCAMENTE INCORRECTAS.
        4. Validez de Contenido: Evaluar estrictamente el contenido proporcionado.
        
        CONTENIDO DE REFERENCIA:
        {full_text[:30000]} 
        
        DEVOLVER ÚNICAMENTE UN JSON CON LA SIGUIENTE ESTRUCTURA:
        {{
            "questions": [
                {{
                    "text": "Texto de la pregunta",
                    "options": [
                        {{ "text": "Opción 1", "is_correct": true }},
                        {{ "text": "Opción 2", "is_correct": false }}
                    ]
                }}
            ]
        }}
        """
        try:
            response = await client.aio.models.generate_content(
                model=model_to_use,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
            
        except Exception as e:
            logger.warning(f"Error en batch {index} con {model_to_use}: {e}")
            if "JSON" in str(e) or "400" in str(e):
                response = await client.aio.models.generate_content(
                    model=model_to_use,
                    contents=prompt + "\n\nIMPORTANTE: Responde ÚNICAMENTE con el JSON raw.",
                    config=types.GenerateContentConfig(response_mime_type="text/plain")
                )
                return _extract_json(response.text)
            raise e


    try:
        tasks = [generate_batch(count, idx) for idx, count in enumerate(batches)]
        results = await asyncio.gather(*tasks)
        
        all_questions_data = []
        
        for res in results:
            if "questions" in res:
                all_questions_data.extend(res["questions"])
            elif isinstance(res, list):
                 all_questions_data.extend(res)

        config = ConfiguracionGeneracion(
            document_id=documents[0].id,
            program=request.program,
            semester=request.semester,
            subject=request.subject,
            topic=request.topic,
            subtopic=request.subtopic,
            question_type=request.question_type,
            difficulty=request.difficulty,
            num_questions=request.num_questions
        )
        db.add(config)
        db.commit()
        db.refresh(config)

        generated_reactivos = []
        for q_data in all_questions_data:
            reactivo = Reactivo(
                config_id=config.id,
                question_text=q_data["text"],
                item_type=request.question_type.value,
                difficulty=request.difficulty.value,
                is_validated=False
            )
            db.add(reactivo)
            db.commit()
            db.refresh(reactivo)
            
            for opt_data in q_data.get("options", []):
                opcion = Opcion(
                    item_id=reactivo.id,
                    option_text=opt_data["text"],
                    is_correct=opt_data["is_correct"]
                )
                db.add(opcion)
            
            db.commit()
            db.refresh(reactivo)
            generated_reactivos.append(reactivo)
            
        return config, generated_reactivos

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error llamando a Gemini: {error_msg}")
        
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            raise ValueError("Límite de cuota excedido. Intenta reducir el número de preguntas o usar un modelo Flash.")
        raise ValueError(f"Error en la generación con IA: {error_msg}")

def _simulate_generation(db: Session, request: QuestionGenerationRequest, doc_id: int):
    config = ConfiguracionGeneracion(
        document_id=doc_id,
        program=request.program,
        semester=request.semester,
        subject=request.subject,
        topic=request.topic,
        subtopic=request.subtopic,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    generated_questions = []
    for i in range(request.num_questions):
        reactivo = Reactivo(
            config_id=config.id,
            question_text=f"[SIMULADO] Pregunta #{i+1} sobre {request.topic}",
            item_type=request.question_type.value,
            difficulty=request.difficulty.value,
            is_validated=False
        )
        db.add(reactivo)
        db.commit()
        db.refresh(reactivo)
        
        db.add(Opcion(item_id=reactivo.id, option_text="Opción correcta simulada", is_correct=True))
        for j in range(request.wrong_option_count):
            db.add(Opcion(item_id=reactivo.id, option_text=f"Distractor simulado {j+1}", is_correct=False))
        
        db.commit()
        db.refresh(reactivo)
        generated_questions.append(reactivo)

    return config, generated_questions

async def regenerate_question(db: Session, question_id: int, user_id: int, model_name: str = None):
    reactivo = db.query(Reactivo).filter(Reactivo.id == question_id).first()
    if not reactivo:
        raise ValueError("El reactivo no existe.")
    config = reactivo.configuracion
    if not config:
        raise ValueError("Configuración de generación no encontrada.")
        
    document = db.query(Documento).filter(Documento.id == config.document_id).first()
    if not document:
         raise ValueError("Documento original no encontrado.")
         
    if document.user_id != user_id:
        raise ValueError("No tienes permiso para modificar este reactivo.")

    if not GOOGLE_API_KEY:
        reactivo.question_text = f"[REGENERADO] {reactivo.question_text} (v2)"
        reactivo.is_validated = False
        
        db.query(Opcion).filter(Opcion.item_id == reactivo.id).delete()
        
        db.add(Opcion(item_id=reactivo.id, option_text="Opción correcta regenerada", is_correct=True))
        for j in range(3):
            db.add(Opcion(item_id=reactivo.id, option_text=f"Distractor regenerado {j+1}", is_correct=False))
            
        db.commit()
        db.refresh(reactivo)
        return reactivo

    client = genai.Client(api_key=GOOGLE_API_KEY)
    model_to_use = model_name or GOOGLE_AI_MODEL
    
    existing_questions = db.query(Reactivo.question_text).filter(
        Reactivo.config_id == config.id,
        Reactivo.id != question_id
    ).all()
    
    existing_texts = [q.question_text for q in existing_questions]
    existing_context = "\n".join([f"- {text}" for text in existing_texts[:50]])

    prompt = f"""
    Eres un experto pedagogo. Necesito REGENERAR una pregunta específica para una evaluación.
    La pregunta anterior no fue satisfactoria. Genera una NUEVA pregunta sobre el mismo tema.
    
    CONTEXTO:
    - Materia: {config.subject}
    - Tema: {config.topic}
    - Dificultad: {config.difficulty.value}
    
    RESTRICCIONES:
    - Generar EXACTAMENTE 1 pregunta.
    - Tipo: {config.question_type.value}.
    - Opciones: 1 correcta y 3 distractores (si aplica).

    ESTÁNDARES TÉCNICOS (AERA et al., 2014):
    - Reducción de varianza irrelevante: Claridad léxica absoluta.
    - Equidad: Sin sesgos ni estereotipos.
    - Opciones: Distractores plausibles, sin pistas gramaticales.

    EVITAR DUPLICADOS (CRÍTICO):
    La nueva pregunta DEBE evaluar un aspecto diferente o tener un enfoque distinto a las siguientes preguntas ya existentes:
    {existing_context}
    
    CONTENIDO DE REFERENCIA:
    {document.content_text[:15000] if document.content_text else "Sin texto"}
    
    DEVOLVER ÚNICAMENTE UN JSON CON ESTA ESTRUCTURA:
    {{
        "text": "Texto de la pregunta",
        "options": [
            {{ "text": "Opción 1", "is_correct": true }},
            {{ "text": "Opción 2", "is_correct": false }}
        ]
    }}
    """

    try:
        try:
            response = await client.aio.models.generate_content(
                model=model_to_use,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            q_data = json.loads(response.text)
            
        except Exception as e:
            error_str = str(e)
            if "JSON mode is not enabled" in error_str or "400" in error_str:
                response = await client.aio.models.generate_content(
                    model=model_to_use,
                    contents=prompt + "\n\nIMPORTANTE: Responde ÚNICAMENTE con el JSON raw.",
                    config=types.GenerateContentConfig(
                        response_mime_type="text/plain",
                    )
                )
                q_data = _extract_json(response.text)
            else:
                raise e

        if isinstance(q_data, list):
            q_data = q_data[0]
        elif "questions" in q_data:
             q_data = q_data["questions"][0]

        reactivo.question_text = q_data["text"]
        reactivo.is_validated = False
        
        db.query(Opcion).filter(Opcion.item_id == reactivo.id).delete()
        
        for opt in q_data.get("options", []):
            opcion = Opcion(
                item_id=reactivo.id,
                option_text=opt["text"],
                is_correct=opt["is_correct"]
            )
            db.add(opcion)
        
        db.commit()
        db.refresh(reactivo)
        return reactivo

    except Exception as e:
        logger.error(f"Error regenerando pregunta: {e}")
        db.rollback()
        raise ValueError(f"Error al regenerar la pregunta: {str(e)}")

def update_questions_batch(db: Session, updates: List[dict], user_id: int):
    """
    Actualiza múltiples reactivos de una sola vez (texto, opciones, estado).
    """
    results = []
    
    for update_data in updates:
        q_id = update_data.get("id")
        if not q_id:
            continue
            
        reactivo = db.query(Reactivo).filter(Reactivo.id == q_id).first()
        if not reactivo:
            continue
            
        if "questionText" in update_data:
            reactivo.question_text = update_data["questionText"]
        
        if "validationStatus" in update_data:
            is_val = update_data["validationStatus"] == "validated"
            reactivo.is_validated = is_val

        if "answers" in update_data:
            db.query(Opcion).filter(Opcion.item_id == reactivo.id).delete()
            
            for ans in update_data["answers"]:
                db.add(Opcion(
                    item_id=reactivo.id,
                    option_text=ans["text"],
                    is_correct=ans.get("isCorrect", False)
                ))
        
        db.add(reactivo)
        results.append(reactivo)
    
    db.commit()
    for r in results:
        db.refresh(r)
        
    return results
