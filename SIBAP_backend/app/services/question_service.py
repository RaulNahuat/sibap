import json
import logging
import asyncio
from typing import List
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.core.config import GOOGLE_API_KEY, GOOGLE_AI_MODEL, EMBEDDING_MODEL
from app.models.documento import Documento
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.reactivo import Reactivo
from app.models.opcion import Opcion
from app.models.programa import Programa
from app.models.materia import Materia
from app.models.tema import Tema
from app.schemas.question import QuestionGenerationRequest
from app.services import vector_service
import re

logger = logging.getLogger(__name__)


def _get_rag_context(
    query: str,
    document_ids: List[int],
    fallback_text: str,
    top_k: int = 5,
) -> str:
    """
    Obtiene contexto semántico via RAG para una consulta dada.

    Flujo:
      1. Busca en ChromaDB los top_k chunks más relevantes para `query`.
      2. Si ChromaDB devuelve resultados, los usa como contexto.
      3. Si no hay chunks (documento pre-migración o error), usa `fallback_text`.

    Args:
        query:         Cadena de búsqueda semántica (tema + subtema).
        document_ids:  IDs de documentos sobre los que buscar.
        fallback_text: Texto de respaldo (truncado) si RAG no tiene chunks.
        top_k:         Número de chunks a recuperar.

    Returns:
        String de contexto listo para inyectar en el prompt del LLM.
    """
    try:
        context = vector_service.search_similar(
            query=query,
            document_ids=document_ids,
            top_k=top_k,
            model_name=EMBEDDING_MODEL,
        )
        if context:
            # Estimar tokens del contexto recuperado (~4 chars/token)
            estimated_tokens = len(context) // 4
            logger.info(
                f"RAG: contexto semántico recuperado (~{estimated_tokens} tokens) "
                f"para query: '{query[:60]}...'"
            )
            return context
    except Exception as e:
        logger.warning(f"RAG: búsqueda semántica falló, usando fallback: {e}")

    # Fallback: texto truncado (compatibilidad con documentos pre-migración)
    truncated = fallback_text[:8000]
    estimated_tokens = len(truncated) // 4
    logger.warning(
        f"RAG: usando fallback de texto truncado (~{estimated_tokens} tokens). "
        "Re-sube el documento para activar RAG completo."
    )
    return truncated

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

    # ── Resolución de IDs de Currículo (Normalización On-the-fly) ─────────────
    prog_id, sub_id, top_id = _resolve_curriculum_ids(db, request)
    # ──────────────────────────────────────────────────────────────────────────

    # ── Recuperación semántica RAG ─────────────────────────────────────────────
    rag_query = f"{request.topic or ''} {request.subtopic or ''}".strip()
    context = _get_rag_context(
        query=rag_query,
        document_ids=request.document_ids,
        fallback_text=full_text,
        top_k=5,
    )
    # ──────────────────────────────────────────────────────────────────────────

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
        - Programa: {request.program or "No especificado"}
        - Materia: {request.subject or "No especificada"}
        - Tema: {request.topic or "No especificado"}
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
        {context}
        
        DEVOLVER ÚNICAMENTE UN JSON CON LA SIGUIENTE ESTRUCTURA:
        {{
            "questions": [
                {{
                    "name": "Nombre corto y descriptivo de la pregunta (ej: Geometría_Analítica_P1)",
                    "text": "Texto de la pregunta (puedes usar HTML básico)",
                    "feedback_correct": "Mensaje general si el alumno acierta la pregunta",
                    "feedback_incorrect": "Mensaje general si el alumno falla la pregunta",
                    "options": [
                        {{ 
                            "text": "Opción 1", 
                            "is_correct": true,
                            "feedback": "Explicación de por qué esta respuesta es correcta o incorrecta"
                        }},
                        {{ 
                            "text": "Opción 2", 
                            "is_correct": false,
                            "feedback": "Explicación de por qué esta respuesta es incorrecta"
                        }}
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
            program_id=prog_id,
            subject_id=sub_id,
            topic_id=top_id,
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
                name=q_data.get("name"),
                feedback_correct=q_data.get("feedback_correct"),
                feedback_incorrect=q_data.get("feedback_incorrect"),
                is_validated=False
            )
            db.add(reactivo)
            db.commit()
            db.refresh(reactivo)
            
            for opt_data in q_data.get("options", []):
                opcion = Opcion(
                    item_id=reactivo.id,
                    option_text=opt_data["text"],
                    is_correct=opt_data["is_correct"],
                    feedback=opt_data.get("feedback")
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
    prog_id, sub_id, top_id = _resolve_curriculum_ids(db, request)
    config = ConfiguracionGeneracion(
        document_id=doc_id,
        program_id=prog_id,
        subject_id=sub_id,
        topic_id=top_id,
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
            question_text=f"[SIMULADO] Pregunta #{i+1} sobre {request.topic or 'tema'}",
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

def _resolve_curriculum_ids(db: Session, request: QuestionGenerationRequest):
    """
    Resuelve o crea los IDs de programa, materia y tema para asegurar 3NF.
    """
    # 1. Resolver Programa
    prog_id = request.program_id
    if not prog_id and request.program:
        prog = db.query(Programa).filter(Programa.nombre == request.program).first()
        if not prog:
            prog = Programa(nombre=request.program)
            db.add(prog)
            db.commit()
            db.refresh(prog)
        prog_id = prog.id
    
    # 2. Resolver Materia
    sub_id = request.subject_id
    if not sub_id and request.subject:
        # Se requiere programa para la materia
        if not prog_id:
            # Fallback a un programa genérico para evitar fallos si no hay nada
            prog_id = _resolve_curriculum_ids(db, QuestionGenerationRequest(program="General", document_ids=[], question_type=request.question_type, difficulty=request.difficulty))[0]
            
        materia = db.query(Materia).filter(
            Materia.nombre == request.subject,
            Materia.program_id == prog_id
        ).first()
        if not materia:
            materia = Materia(
                nombre=request.subject,
                program_id=prog_id,
                semestre=0, # Valor por defecto para materias manuales
                clave="MANUAL"
            )
            db.add(materia)
            db.commit()
            db.refresh(materia)
        sub_id = materia.id
        
    # 3. Resolver Tema
    top_id = request.topic_id
    if not top_id and request.topic:
        if not sub_id:
            # No se puede crear tema sin materia
            raise ValueError("No se puede resolver el tema sin una materia identificada.")
            
        tema = db.query(Tema).filter(
            Tema.nombre == request.topic,
            Tema.materia_id == sub_id
        ).first()
        if not tema:
            tema = Tema(
                nombre=request.topic,
                materia_id=sub_id
            )
            db.add(tema)
            db.commit()
            db.refresh(tema)
        top_id = tema.id
        
    if not prog_id or not sub_id or not top_id:
        raise ValueError("Se requiere al menos el nombre del programa, materia y tema para normalizar la configuración.")
        
    return prog_id, sub_id, top_id

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

    # ── Recuperación semántica RAG ─────────────────────────────────────────────
    sub_name = config.materia_obj.nombre if config.materia_obj else ""
    top_name = config.tema_obj.nombre if config.tema_obj else ""
    regen_query = f"{sub_name} {top_name} {getattr(config, 'subtopic', '') or ''}".strip()
    context = _get_rag_context(
        query=regen_query,
        document_ids=[config.document_id],
        fallback_text=document.content_text or "",
        top_k=5,
    )
    # ──────────────────────────────────────────────────────────────────────────

    prompt = f"""
    Eres un experto pedagogo. Necesito REGENERAR una pregunta específica para una evaluación.
    La pregunta anterior no fue satisfactoria. Genera una NUEVA pregunta sobre el mismo tema.
    
    CONTEXTO:
    - Materia: {config.materia_obj.nombre if config.materia_obj else "Desconocida"}
    - Tema: {config.tema_obj.nombre if config.tema_obj else "Desconocido"}
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
    {context}
    
    DEVOLVER ÚNICAMENTE UN JSON CON ESTA ESTRUCTURA:
    {{
        "name": "Nombre de la pregunta",
        "text": "Texto de la pregunta",
        "options": [
            {{ "text": "Opción 1", "is_correct": true, "feedback": "Retroalimentación" }},
            {{ "text": "Opción 2", "is_correct": false, "feedback": "Retroalimentación" }}
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
        reactivo.name = q_data.get("name")
        reactivo.feedback_correct = q_data.get("feedback_correct")
        reactivo.feedback_incorrect = q_data.get("feedback_incorrect")
        reactivo.is_validated = False
        
        db.query(Opcion).filter(Opcion.item_id == reactivo.id).delete()
        
        for opt in q_data.get("options", []):
            opcion = Opcion(
                item_id=reactivo.id,
                option_text=opt["text"],
                is_correct=opt["is_correct"],
                feedback=opt.get("feedback")
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
        
        if "name" in update_data:
            reactivo.name = update_data["name"]

        if "validationStatus" in update_data:
            is_val = update_data["validationStatus"] == "validated"
            reactivo.is_validated = is_val

        if "feedback_correct" in update_data:
            reactivo.feedback_correct = update_data["feedback_correct"]
        
        if "feedback_incorrect" in update_data:
            reactivo.feedback_incorrect = update_data["feedback_incorrect"]

        if "answers" in update_data:
            db.query(Opcion).filter(Opcion.item_id == reactivo.id).delete()
            
            for ans in update_data["answers"]:
                logger.info(f"Actualizando opción: {ans.get('text')} - Feedback: {ans.get('feedback')}")
                db.add(Opcion(
                    item_id=reactivo.id,
                    option_text=ans["text"],
                    is_correct=ans.get("isCorrect", False),
                    feedback=ans.get("feedback")
                ))
        
        db.add(reactivo)
        results.append(reactivo)
    
    db.commit()
    for r in results:
        db.refresh(r)
        
    return results
