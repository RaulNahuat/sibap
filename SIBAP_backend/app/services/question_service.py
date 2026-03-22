import logging
import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import GOOGLE_API_KEY, GOOGLE_AI_MODEL, EMBEDDING_MODEL
from app.models.documento import Documento
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.reactivo import Reactivo
from app.models.opcion import Opcion
from app.schemas.question import QuestionGenerationRequest
from app.services import vector_service
from app.services.curriculum_service import CurriculumService
from app.services.ai_generation_service import AiGenerationService
from app.repositories.question_repository import QuestionRepository
from app.repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)

def _get_existing_question_texts(db: Session, topic_id: int, document_id: int, limit: int = 20) -> List[str]:
    query = (
        db.query(Reactivo.question_text)
        .join(ConfiguracionGeneracion)
        .filter(
            (ConfiguracionGeneracion.topic_id == topic_id) | 
            (ConfiguracionGeneracion.document_id == document_id)
        )
        .order_by(Reactivo.created_at.desc())
        .limit(limit)
    )
    return [q[0] for q in query.all()]


def _get_rag_context(query: str, document_ids: List[int], fallback_text: str, top_k: int = 5) -> str:
    try:
        context = vector_service.search_similar(
            query=query,
            document_ids=document_ids,
            top_k=top_k,
            model_name=EMBEDDING_MODEL,
        )
        if context:
            return context
    except Exception as e:
        logger.warning(f"RAG: búsqueda semántica falló: {e}")

    return fallback_text[:8000]


async def generate_questions(db: Session, request: QuestionGenerationRequest, user_id: int):
    doc_repo = DocumentRepository(db)
    q_repo = QuestionRepository(db)
    curr_service = CurriculumService(db)
    ai_service = AiGenerationService()

    documents = db.query(Documento).filter(Documento.id.in_(request.document_ids)).all()
    if not documents:
        raise ValueError("No se encontraron los documentos seleccionados.")

    full_text = "\n\n".join([doc.content_text for doc in documents if doc.content_text])
    
    prog_id, sub_id, top_id = curr_service.resolve_ids(
        request.program, request.subject, request.topic, 
        request.program_id, request.subject_id, request.topic_id
    )

    rag_query = f"{request.topic or ''} {request.subtopic or ''}".strip()
    context = _get_rag_context(rag_query, request.document_ids, full_text)

    if not GOOGLE_API_KEY:
        return _simulate_generation(db, request, documents[0].id)

    model_to_use = request.model_name or GOOGLE_AI_MODEL
    BATCH_SIZE = 5
    batches = [min(BATCH_SIZE, request.num_questions - i) for i in range(0, request.num_questions, BATCH_SIZE)]

    existing_texts = _get_existing_question_texts(db, top_id, documents[0].id)
    existing_formatted = "\n".join([f"- {t}" for t in existing_texts]) if existing_texts else "Ninguna aún."

    # Configuración de restricciones dinámicas del usuario
    custom_rules = f"\n        INSTRUCCIONES ADICIONALES DEL USUARIO (PRIORIDAD ALTA):\n        {request.custom_instructions}\n" if request.custom_instructions else ""
    
    distractor_rule = "- Generar 1 opción correcta y distractores plausibles (evitar opciones obvias)." if request.plausible_distractors else "- Generar 1 opción correcta y distractores claramente incorrectos."
    ambiguity_rule = "- Evitar estrictamente ambigüedades en enunciados y opciones." if request.avoid_ambiguity else ""

    async def generate_batch(count: int, index: int):
        prompt = f"""
        Eres un experto pedagogo diseñando evaluaciones académicas de alta calidad.
        Basado en el siguiente contenido, genera exactamente {count} reactivos de tipo {request.question_type.value}.
        
        CONTEXTO ACADÉMICO:
        - Programa: {request.program or "No especificado"}
        - Materia: {request.subject or "No especificada"}
        - Tema: {request.topic or "No especificado"}
        - Nivel de dificultad: {request.difficulty.value}
        {custom_rules}
        PREGUNTAS EXISTENTES (ESTRICTAMENTE NO REPETIR NI COPIAR ESTILO):
        {existing_formatted}

        RESTRICCIONES:
        - Generar exactamente {count} preguntas (Batch #{index+1}).
        - NO repetir conceptos ni enunciados de la lista de 'PREGUNTAS EXISTENTES'.
        - Variar el enfoque pedagógico (Batch #{index+1} debe cubrir áreas distintas a los anteriores si aplica).
        - Tipo de reactivo: {request.question_type.value} (MCQ: Opción múltiple, TF: Verdadero/Falso, OPEN: Respuesta abierta).
        {distractor_rule}
        {ambiguity_rule}

        ESTÁNDARES TÉCNICOS Y PEDAGÓGICOS (CRÍTICO):
        1. Reducción de varianza irrelevante: El lenguaje debe ser gramaticalmente perfecto y claro.
        2. Equidad y sensibilidad: Eliminar cualquier sesgo o estereotipo.
        3. Calidad de las opciones: Distractores PLAUSIBLES pero INEQUÍVOCAMENTE INCORRECTAS.
        4. Validez de Contenido: Evaluar estrictamente el contenido proporcionado.
        5. Formato Matemático (CRÍTICO): Usa el símbolo de dólar `$` ÚNICAMENTE para aislar fórmulas matemáticas (ej: `$E=mc^2$`). Para expresar dinero, usa la palabra escrita (ej: 50,000 pesos) o escapa el símbolo (`\\$50,000`). NUNCA envuelvas oraciones enteras ni texto normal dentro de signos `$`.

        CONTENIDO DE REFERENCIA:
        {context}
        
        DEVOLVER ÚNICAMENTE UN JSON CON LA SIGUIENTE ESTRUCTURA:
        {{
            "questions": [
                {{
                    "name": "Nombre corto y descriptivo de la pregunta (ej: tema_materia_px)",
                    "text": "Texto de la pregunta (puedes usar HTML básico)",
                    "feedback_correct": "Retroalimentación general para aciertos",
                    "feedback_incorrect": "Retroalimentación general para errores",
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
        return await ai_service.generate_content_json(model_to_use, prompt)

    tasks = [generate_batch(count, idx) for idx, count in enumerate(batches)]
    results = await asyncio.gather(*tasks)
    
    all_questions_data = []
    for res in results:
        if not res or not isinstance(res, dict):
            continue
        data = res.get("questions", [])
        all_questions_data.extend(data)

    config = q_repo.create_config(ConfiguracionGeneracion(
        document_id=documents[0].id,
        program_id=prog_id,
        subject_id=sub_id,
        topic_id=top_id,
        subtopic=request.subtopic,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    ))

    generated_reactivos = []
    for q_data in all_questions_data:
        if not q_data or "text" not in q_data:
            logger.warning(f"AI: salto un reactivo mal formado: {q_data}")
            continue

        reactivo = q_repo.create_question(Reactivo(
            config_id=config.id,
            question_text=q_data["text"],
            name=q_data.get("name"),
            feedback_correct=q_data.get("feedback_correct"),
            feedback_incorrect=q_data.get("feedback_incorrect")
        ))
        
        for opt_data in q_data.get("options", []):
            if "text" not in opt_data: continue
            q_repo.create_option(Opcion(
                item_id=reactivo.id,
                option_text=opt_data["text"],
                is_correct=opt_data.get("is_correct", False),
                feedback=opt_data.get("feedback")
            ))
        generated_reactivos.append(reactivo)
            
    return config, generated_reactivos


async def regenerate_question(db: Session, question_id: int, user_id: int, model_name: str = None):
    q_repo = QuestionRepository(db)
    ai_service = AiGenerationService()
    
    reactivo = q_repo.get_question_by_id(question_id)
    if not reactivo or reactivo.configuracion.documento.user_id != user_id:
        raise ValueError("No autorizado o no encontrado.")

    siblings = [r.question_text for r in reactivo.configuracion.reactivos if r.id != question_id]
    siblings_formatted = "\n".join([f"- {s}" for s in siblings]) if siblings else "Ninguna."

    prompt = f"""
    Regenera este reactivo basándote en su contenido actual pero mejorando la claridad y precisión.
    
    PREGUNTA ACTUAL (A REGENERAR):
    {reactivo.question_text}

    OTRAS PREGUNTAS EN EL MISMO EXAMEN (NO TE PAREZCAS A ESTAS):
    {siblings_formatted}

    REQUISITOS:
    - El enunciado debe ser sustancialmente mejorado.
    - NO debe ser académicamente similar ni repetitiva respecto a las 'OTRAS PREGUNTAS'.
    - Formato Matemático (CRÍTICO): Usa `$` SOLO para aislar fórmulas matemáticas (ej: `$E=mc^2$`). Para referirte a montos de dinero usa la palabra escrita o escápalo (`\\$50,000`). NUNCA encierres oraciones enteras dentro de signos `$`.
    
    DEVOLVER ÚNICAMENTE UN JSON CON ESTA ESTRUCTURA:
    {{
        "text": "nuevo enunciado",
        "options": [
            {{"text": "opcion 1", "is_correct": true, "feedback": "feedback"}},
            {{"text": "opcion 2", "is_correct": false, "feedback": "feedback"}}
        ],
        "feedback_correct": "feedback general acierto",
        "feedback_incorrect": "feedback general error"
    }}
    """
    q_data = await ai_service.generate_content_json(model_name or GOOGLE_AI_MODEL, prompt)
    
    reactivo.question_text = q_data["text"]
    reactivo.feedback_correct = q_data.get("feedback_correct")
    reactivo.feedback_incorrect = q_data.get("feedback_incorrect")
    
    q_repo.delete_options_by_question_id(question_id)
    for opt in q_data.get("options", []):
        nueva_opcion = Opcion(
            item_id=reactivo.id, 
            option_text=opt.get("text") or opt.get("option_text", ""), 
            is_correct=opt.get("is_correct") or opt.get("isCorrect", False),
            feedback=opt.get("feedback")
        )
        db.add(nueva_opcion)
    
    db.commit()
    return reactivo


def get_questions_by_config(db: Session, config_id: int, user_id: int):
    q_repo = QuestionRepository(db)
    config = q_repo.get_config_by_id(config_id)
    if not config or config.documento.user_id != user_id:
        return None
    return q_repo.get_reactivos_by_config(config_id)


def add_manual_question(db: Session, config_id: int, user_id: int, question_text: str, options: list):
    q_repo = QuestionRepository(db)
    config = q_repo.get_config_by_id(config_id)
    if not config or config.documento.user_id != user_id:
        return None

    reactivo = q_repo.create_question(Reactivo(
        config_id=config_id,
        question_text=question_text,
        is_validated=True
    ))

    for opt in options:
        nueva_opcion = Opcion(
            item_id=reactivo.id,
            option_text=getattr(opt, "text", getattr(opt, "option_text", "")),
            is_correct=getattr(opt, "is_correct", getattr(opt, "isCorrect", False)),
            feedback=getattr(opt, "feedback", None)
        )
        db.add(nueva_opcion)
    
    return reactivo


def update_questions_batch(db: Session, updates: List[dict], user_id: int):
    q_repo = QuestionRepository(db)
    results = []
    
    for update_data in updates:
        q_id = update_data.get("id")
        if not q_id:
            continue
            
        reactivo = q_repo.get_question_by_id(q_id)
        if not reactivo or reactivo.configuracion.documento.user_id != user_id:
            continue
            
        if "questionText" in update_data:
            reactivo.question_text = update_data["questionText"]
        
        if "name" in update_data:
            reactivo.name = update_data["name"]

        if "validationStatus" in update_data:
            reactivo.is_validated = (update_data["validationStatus"] == "validated")

        if "feedback_correct" in update_data:
            reactivo.feedback_correct = update_data["feedback_correct"]
        
        if "feedback_incorrect" in update_data:
            reactivo.feedback_incorrect = update_data["feedback_incorrect"]

        if "answers" in update_data and update_data["answers"]:
            q_repo.delete_options_by_question_id(reactivo.id)
            
            for ans in update_data["answers"]:
                is_correct = ans.get("is_correct")
                if is_correct is None:
                    is_correct = ans.get("isCorrect", False)
                
                feedback_val = ans.get("feedback")
                
                nueva_opcion = Opcion(
                    item_id=reactivo.id,
                    option_text=ans.get("text") or ans.get("option_text", ""),
                    is_correct=is_correct,
                    feedback=feedback_val
                )
                db.add(nueva_opcion)
        
        results.append(reactivo)
    
    db.commit()
    return results


def _simulate_generation(db: Session, request: QuestionGenerationRequest, doc_id: int):
    curr_service = CurriculumService(db)
    q_repo = QuestionRepository(db)
    
    prog_id, sub_id, top_id = curr_service.resolve_ids(
        request.program, request.subject, request.topic, 
        request.program_id, request.subject_id, request.topic_id
    )

    config = q_repo.create_config(ConfiguracionGeneracion(
        document_id=doc_id,
        program_id=prog_id,
        subject_id=sub_id,
        topic_id=top_id,
        subtopic=request.subtopic,
        question_type=request.question_type,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    ))

    generated = []
    for i in range(request.num_questions):
        reactivo = q_repo.create_question(Reactivo(config_id=config.id, question_text=f"Simulada {i+1}"))
        q_repo.create_option(Opcion(item_id=reactivo.id, option_text="Correcta", is_correct=True))
        generated.append(reactivo)

    return config, generated