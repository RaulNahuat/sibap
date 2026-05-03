import logging
import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.documento import Documento
from app.models.configuracion_generacion import ConfiguracionGeneracion, QuestionType, GenerationStatus
from app.models.reactivo import Reactivo
from app.models.opcion import Opcion
from app.schemas.question import QuestionGenerationRequest
from app.services.rag import vector_service
from app.services.curriculum.curriculum_service import CurriculumService
from app.services.questions.ai_generation_service import AiGenerationService
from app.services.questions.prompt_builder_service import PromptBuilderService
from app.repositories.question_repository import QuestionRepository
from app.core.config import GOOGLE_AI_MODEL, EMBEDDING_MODEL

logger = logging.getLogger(__name__)


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
        console.log("RAG: búsqueda semántica falló: {e}")

    return fallback_text[:8000]


def create_generation_config(db: Session, request: QuestionGenerationRequest, user_id: int) -> ConfiguracionGeneracion:
    """Crea la configuración inicial en estado PENDING."""
    curr_service = CurriculumService(db)
    q_repo = QuestionRepository(db)
    
    prog_id, sub_id, top_id = curr_service.resolve_ids(
        request.program, request.subject, request.topic, 
        request.program_id, request.subject_id, request.topic_id
    )

    num_mcq = request.num_mcq
    num_matching = request.num_matching
    num_calculated = request.num_calculated
    total = num_mcq + num_matching + num_calculated
    if total == 0:
        num_mcq = request.num_questions
        total = num_mcq

    types_used = []
    if num_mcq > 0: types_used.append(QuestionType.MCQ)
    if num_matching > 0: types_used.append(QuestionType.MATCHING)
    if num_calculated > 0: types_used.append(QuestionType.CALCULATED)
    
    config_q_type = types_used[0] if len(types_used) == 1 else QuestionType.MIXED

    config = q_repo.create_config(ConfiguracionGeneracion(
        document_id=request.document_ids[0],
        program_id=prog_id,
        subject_id=sub_id,
        topic_id=top_id,
        subtopic=request.subtopic,
        question_type=config_q_type,
        difficulty=request.difficulty,
        num_questions=total,
        num_mcq=num_mcq,
        num_matching=num_matching,
        num_calculated=num_calculated,
        status=GenerationStatus.PENDING
    ))
    return config


async def get_prompt_preview(db: Session, request: QuestionGenerationRequest, user_id: int) -> str:
    curr_service = CurriculumService(db)
    prog_id, sub_id, top_id = curr_service.resolve_ids(
        request.program, request.subject, request.topic,
        request.program_id, request.subject_id, request.topic_id
    )

    documents = db.query(Documento).filter(Documento.id.in_(request.document_ids)).all()
    full_text = "\n\n".join([doc.content_text for doc in documents if doc.content_text])

    rag_query = f"{request.topic or ''} {request.subtopic or ''}".strip()
    context = _get_rag_context(rag_query, request.document_ids, full_text)

    q_repo = QuestionRepository(db)
    existing_texts = q_repo.get_existing_question_texts(top_id, request.document_ids[0] if request.document_ids else None) if top_id else []
    existing_formatted = "\n".join([f"- {t}" for t in existing_texts]) if existing_texts else "Ninguna aún."

    custom_rules = f"\n        INSTRUCCIONES ADICIONALES DEL USUARIO (PRIORIDAD ALTA):\n        {request.custom_instructions}\n" if request.custom_instructions else ""

    gen_feedback_rule = "Generar retroalimentación general (explicación global para la pregunta al atinar o fallar)." if request.generate_general_feedback else "IMPORTANTE: NO generes ninguna retroalimentación general (deja feedback_correct y feedback_incorrect en null o vacíos)."
    spec_feedback_rule = "Generar retroalimentación específica por opción (justificación detallada para cada opción/distractor)." if request.generate_specific_feedback else "IMPORTANTE: NO generes retroalimentación específica por opción (deja feedback en null o vacío dentro del arreglo options)."

    distractor_rule = "Generar 1 opción correcta y distractores plausibles (evitar opciones obvias)." if request.plausible_distractors else "Generar 1 opción correcta y distractores claramente incorrectos."
    ambiguity_rule = "Evitar estrictamente ambigüedades en enunciados y opciones." if request.avoid_ambiguity else ""

    return PromptBuilderService.build_unified_prompt(request, existing_formatted, context, custom_rules, distractor_rule, ambiguity_rule, gen_feedback_rule, spec_feedback_rule)


async def process_question_generation_task(config_id: int, request_data: dict, user_id: int):
    """Tarea en segundo plano para generar preguntas de forma asíncrona."""
    with SessionLocal() as db_session:
        q_repo = QuestionRepository(db_session)
        ai_service = AiGenerationService()
        
        config = q_repo.get_config_by_id(config_id)
        if not config:
            logger.error(f"Task: Config {config_id} no encontrada.")
            return

        try:
            config.status = GenerationStatus.PROCESSING
            db_session.commit()

            request = QuestionGenerationRequest(**request_data)
            documents = db_session.query(Documento).filter(Documento.id.in_(request.document_ids)).all()
            full_text = "\n\n".join([doc.content_text for doc in documents if doc.content_text])
            
            rag_query = f"{request.topic or ''} {request.subtopic or ''}".strip()
            context = _get_rag_context(rag_query, request.document_ids, full_text)

            model_to_use = request.model_name or GOOGLE_AI_MODEL
            existing_texts = q_repo.get_existing_question_texts(config.topic_id, config.document_id)
            existing_formatted = "\n".join([f"- {t}" for t in existing_texts]) if existing_texts else "Ninguna aún."

            custom_rules = f"\n        INSTRUCCIONES ADICIONALES DEL USUARIO (PRIORIDAD ALTA):\n        {request.custom_instructions}\n" if request.custom_instructions else ""
            
            gen_feedback_rule = "Generar retroalimentación general (explicación global para la pregunta al atinar o fallar)." if request.generate_general_feedback else "IMPORTANTE: NO generes ninguna retroalimentación general (deja feedback_correct y feedback_incorrect en null o vacíos)."
            spec_feedback_rule = "Generar retroalimentación específica por opción (justificación detallada para cada opción/distractor)." if request.generate_specific_feedback else "IMPORTANTE: NO generes retroalimentación específica por opción (deja feedback en null o vacío dentro del arreglo options)."

            distractor_rule = "Generar 1 opción correcta y distractores plausibles (evitar opciones obvias)." if request.plausible_distractors else "Generar 1 opción correcta y distractores claramente incorrectos."
            ambiguity_rule = "Evitar estrictamente ambigüedades en enunciados y opciones." if request.avoid_ambiguity else ""

            if request.custom_prompt:
                logger.info(f"Task: Usando prompt personalizado para config {config_id}")
                res = await ai_service.generate_content_json(model_to_use, request.custom_prompt)
                results = [(config.question_type, res)]
            else:
                total_q = config.num_mcq + config.num_matching + config.num_calculated
                types_used = sum(1 for qty in [config.num_mcq, config.num_matching, config.num_calculated] if qty > 0)
                logger.info(f"Task: Prompt unificado — {total_q} reactivos ({types_used} tipos) para config {config_id}")
                unified_p = PromptBuilderService.build_unified_prompt(request, existing_formatted, context, custom_rules, distractor_rule, ambiguity_rule, gen_feedback_rule, spec_feedback_rule)
                res = await ai_service.generate_content_json(model_to_use, unified_p)
                results = [(None, res)]

            for q_type, res in results:
                if not res or not isinstance(res, dict): continue
                for q_data in res.get("questions", []):
                    if not q_data or "text" not in q_data: continue

                    if q_type is None:
                        type_str = q_data.get("type", "mcq").lower()
                        effective_type = PromptBuilderService.get_type_from_str(type_str)
                    else:
                        effective_type = q_type

                    reactivo = q_repo.create_question(Reactivo(
                        config_id=config.id,
                        question_text=q_data["text"],
                        name=q_data.get("name"),
                        question_type=effective_type,
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
            
            # Éxito
            config.status = GenerationStatus.COMPLETED
            db_session.commit()
            logger.info(f"Task: Generación exitosa para config {config_id}")

        except Exception as e:
            logger.error(f"Task: Error generando preguntas para config {config_id}: {e}")
            db_session.rollback()
            config.status = GenerationStatus.FAILED
            config.error_message = str(e)
            db_session.commit()


async def regenerate_question(db: Session, question_id: int, user_id: int, model_name: str = None):
    q_repo = QuestionRepository(db)
    ai_service = AiGenerationService()
    
    reactivo = q_repo.get_question_by_id(question_id)
    if not reactivo or reactivo.configuracion.documento.user_id != user_id:
        raise ValueError("No autorizado o no encontrado.")

    siblings = [r.question_text for r in reactivo.configuracion.reactivos if r.id != question_id]
    siblings_formatted = "\n".join([f"- {s}" for s in siblings]) if siblings else "Ninguna."

    q_type = reactivo.question_type or QuestionType.MCQ
    prompt = PromptBuilderService.build_regeneration_prompt(q_type, reactivo.question_text, siblings_formatted)
    
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


def _simulate_generation(
    db: Session,
    request: QuestionGenerationRequest,
    doc_id: int,
    num_mcq: int = 0,
    num_matching: int = 0,
    num_calculated: int = 0,
    total: int = 0,
):
    curr_service = CurriculumService(db)
    q_repo = QuestionRepository(db)
    
    prog_id, sub_id, top_id = curr_service.resolve_ids(
        request.program, request.subject, request.topic, 
        request.program_id, request.subject_id, request.topic_id
    )

    types_used = [(QuestionType.MCQ, num_mcq), (QuestionType.MATCHING, num_matching), (QuestionType.CALCULATED, num_calculated)]
    active_types = [t for t, n in types_used if n > 0]
    config_q_type = active_types[0] if len(active_types) == 1 else QuestionType.MIXED

    config = q_repo.create_config(ConfiguracionGeneracion(
        document_id=doc_id,
        program_id=prog_id,
        subject_id=sub_id,
        topic_id=top_id,
        subtopic=request.subtopic,
        question_type=config_q_type,
        difficulty=request.difficulty,
        num_questions=total or request.num_questions,
        num_mcq=num_mcq,
        num_matching=num_matching,
        num_calculated=num_calculated,
    ))

    generated = []
    i = 0
    for q_type, qty in types_used:
        for _ in range(qty):
            reactivo = q_repo.create_question(Reactivo(
                config_id=config.id,
                question_text=f"Simulada {i+1} [{q_type.value}]",
                question_type=q_type
            ))
            q_repo.create_option(Opcion(item_id=reactivo.id, option_text="Correcta", is_correct=True))
            generated.append(reactivo)
            i += 1

    return config, generated
