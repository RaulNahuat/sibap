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
from app.services import vector_service
from app.services.curriculum_service import CurriculumService
from app.services.ai_generation_service import AiGenerationService
from app.repositories.question_repository import QuestionRepository
from app.repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────────────────────────
# Per-type prompt builders
# ──────────────────────────────────────────────────────────────────────────────

_TYPE_LABELS = {
    QuestionType.MCQ: "Opción Múltiple (MCQ)",
    QuestionType.MATCHING: "Relacionar Columnas (MATCHING)",
    QuestionType.CALCULATED: "Calculada (CALCULATED)",
}

_TYPE_INSTRUCTIONS = {
    QuestionType.MCQ: """
        REGLAS PARA OPCIÓN MÚLTIPLE:
        - El enunciado plantea una pregunta o situación concreta.
        - Genera exactamente 1 opción correcta y 3 distractores plausibles.
        - Cada opción debe ser texto breve y claro.
        - "is_correct": true SOLO para la opción correcta.
    """,
    QuestionType.MATCHING: """
        REGLAS PARA RELACIONAR COLUMNAS:
        - El enunciado introduce el contexto y pide relacionar pares de conceptos.
        - Cada "opción" representa UN PAR con formato: "Término | Definición o concepto relacionado".
        - Genera entre 4 y 6 pares. Todos los pares son "correctos" (is_correct: true).
        - Los pares deben ser relaciones directas e inequívocas del contenido.
        - Ejemplo de opción: "Polimorfismo | Capacidad de un objeto de tomar múltiples formas"
    """,
    QuestionType.CALCULATED: """
        REGLAS PARA PREGUNTA CALCULADA:
        - El enunciado plantea un problema numérico o cuantitativo con valores concretos.
        - Genera 1 opción correcta con el resultado numérico correcto (is_correct: true).
        - Genera 3 distractores con resultados incorrectos pero plausibles.
        - Incluye la fórmula o procedimiento en el feedback de la opción correcta.
        - CRÍTICO FORMATO JSON: Usa ÚNICAMENTE $...$ para fórmulas (ej: $F = ma$).
          JAMÁS uses \\( \\) \\[ \\] pues rompen el JSON. Solo usar signo de dólar $...$.
    """,
}


def _build_prompt(
    count: int,
    batch_index: int,
    q_type: QuestionType,
    request: QuestionGenerationRequest,
    existing_formatted: str,
    context: str,
    custom_rules: str,
    distractor_rule: str,
    ambiguity_rule: str,
) -> str:
    type_label = _TYPE_LABELS[q_type]
    type_instructions = _TYPE_INSTRUCTIONS[q_type]

    return f"""
    Eres un experto pedagogo diseñando evaluaciones académicas de alta calidad.
    Basado en el siguiente contenido, genera exactamente {count} reactivos de tipo {type_label}.
    
    CONTEXTO ACADÉMICO:
    - Programa: {request.program or "No especificado"}
    - Materia: {request.subject or "No especificada"}
    - Tema: {request.topic or "No especificado"}
    - Nivel de dificultad: {request.difficulty.value}
    {f"- Objetivos de aprendizaje del tema: {request.learning_objectives}" if request.learning_objectives else ""}
    {custom_rules}
    PREGUNTAS EXISTENTES (ESTRICTAMENTE NO REPETIR NI COPIAR ESTILO):
    {existing_formatted}

    RESTRICCIONES:
    - Generar exactamente {count} preguntas (Batch #{batch_index+1}).
    - NO repetir conceptos ni enunciados de la lista de 'PREGUNTAS EXISTENTES'.
    - Variar el enfoque pedagógico (Batch #{batch_index+1} debe cubrir áreas distintas a los anteriores si aplica).
    {distractor_rule}
    {ambiguity_rule}

    {type_instructions}

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


# ──────────────────────────────────────────────────────────────────────────────
# Main generation function
# ──────────────────────────────────────────────────────────────────────────────

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

    # Determinar tipo de pregunta general para la config
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


async def process_question_generation_task(config_id: int, request_data: dict, user_id: int):
    """Tarea en segundo plano para generar preguntas de forma asíncrona."""
    # REGLA: Sesión independiente para tarea de fondo
    with SessionLocal() as db_session:
        q_repo = QuestionRepository(db_session)
        ai_service = AiGenerationService()
        
        config = q_repo.get_config_by_id(config_id)
        if not config:
            logger.error(f"Task: Config {config_id} no encontrada.")
            return

        try:
            # 1. Marcar como procesando
            config.status = GenerationStatus.PROCESSING
            db_session.commit()

            # Re-vincular request de data dict (para mayor seguridad en segundo plano)
            request = QuestionGenerationRequest(**request_data)
            
            from app.core.config import GOOGLE_AI_MODEL, EMBEDDING_MODEL, GOOGLE_API_KEY
            
            documents = db_session.query(Documento).filter(Documento.id.in_(request.document_ids)).all()
            full_text = "\n\n".join([doc.content_text for doc in documents if doc.content_text])
            
            rag_query = f"{request.topic or ''} {request.subtopic or ''}".strip()
            context = _get_rag_context(rag_query, request.document_ids, full_text)

            model_to_use = request.model_name or GOOGLE_AI_MODEL
            existing_texts = _get_existing_question_texts(db_session, config.topic_id, config.document_id)
            existing_formatted = "\n".join([f"- {t}" for t in existing_texts]) if existing_texts else "Ninguna aún."

            custom_rules = f"\n        INSTRUCCIONES ADICIONALES DEL USUARIO (PRIORIDAD ALTA):\n        {request.custom_instructions}\n" if request.custom_instructions else ""
            distractor_rule = "- Generar 1 opción correcta y distractores plausibles (evitar opciones obvias)." if request.plausible_distractors else "- Generar 1 opción correcta y distractores claramente incorrectos."
            ambiguity_rule = "- Evitar estrictamente ambigüedades en enunciados y opciones." if request.avoid_ambiguity else ""

            BATCH_SIZE = 5
            type_batches: List[tuple[QuestionType, int, int]] = []
            global_idx = 0
            for q_type, qty in [
                (QuestionType.MCQ, config.num_mcq),
                (QuestionType.MATCHING, config.num_matching),
                (QuestionType.CALCULATED, config.num_calculated),
            ]:
                if qty <= 0: continue
                splits = [min(BATCH_SIZE, qty - i) for i in range(0, qty, BATCH_SIZE)]
                for count in splits:
                    type_batches.append((q_type, count, global_idx))
                    global_idx += 1

            async def run_batch(qt: QuestionType, ct: int, idx: int):
                p = _build_prompt(ct, idx, qt, request, existing_formatted, context, custom_rules, distractor_rule, ambiguity_rule)
                res = await ai_service.generate_content_json(model_to_use, p)
                return qt, res

            tasks = [run_batch(qt, ct, i) for (qt, ct, i) in type_batches]
            results = await asyncio.gather(*tasks)

            # 3. Guardar resultados
            for q_type, res in results:
                if not res or not isinstance(res, dict): continue
                for q_data in res.get("questions", []):
                    if not q_data or "text" not in q_data: continue
                    
                    reactivo = q_repo.create_question(Reactivo(
                        config_id=config.id,
                        question_text=q_data["text"],
                        name=q_data.get("name"),
                        question_type=q_type,
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
            
            # 4. Éxito
            config.status = GenerationStatus.COMPLETED
            db_session.commit()
            logger.info(f"Task: Generación exitosa para config {config_id}")

        except Exception as e:
            logger.error(f"Task: Error generando preguntas para config {config_id}: {e}")
            db_session.rollback()
            config.status = GenerationStatus.FAILED
            config.error_message = str(e)
            db_session.commit()


async def generate_questions(db: Session, request: QuestionGenerationRequest, user_id: int):
    """Método original conservado por compatibilidad o simulación, pero ahora el flujo principal irá por BackgroundTasks."""
    # Nota: Este método ya no es el punto de entrada principal desde el router de generación asíncrona
    # pero lo mantenemos para no romper posibles tests existentes que lo llamen directamente.
    
    # ... (podríamos refactorizarlo para llamar a la nueva lógica, pero por ahora lo dejamos como está)
    # Sin embargo, para cumplir con el requerimiento de "Aislamiento de Sesión", es mejor que el 
    # router llame directamente a las nuevas funciones.
    pass


# ──────────────────────────────────────────────────────────────────────────────
# Regenerate / helpers
# ──────────────────────────────────────────────────────────────────────────────

async def regenerate_question(db: Session, question_id: int, user_id: int, model_name: str = None):
    q_repo = QuestionRepository(db)
    ai_service = AiGenerationService()
    
    reactivo = q_repo.get_question_by_id(question_id)
    if not reactivo or reactivo.configuracion.documento.user_id != user_id:
        raise ValueError("No autorizado o no encontrado.")

    siblings = [r.question_text for r in reactivo.configuracion.reactivos if r.id != question_id]
    siblings_formatted = "\n".join([f"- {s}" for s in siblings]) if siblings else "Ninguna."

    q_type = reactivo.question_type or QuestionType.MCQ
    type_label = _TYPE_LABELS.get(q_type, "Opción Múltiple (MCQ)")
    type_instructions = _TYPE_INSTRUCTIONS.get(q_type, _TYPE_INSTRUCTIONS[QuestionType.MCQ])

    prompt = f"""
    Regenera este reactivo de tipo {type_label} basándote en su contenido actual pero mejorando la claridad y precisión.
    
    PREGUNTA ACTUAL (A REGENERAR):
    {reactivo.question_text}

    OTRAS PREGUNTAS EN EL MISMO EXAMEN (NO TE PAREZCAS A ESTAS):
    {siblings_formatted}

    REQUISITOS:
    - El enunciado debe ser sustancialmente mejorado.
    - NO debe ser académicamente similar ni repetitiva respecto a las 'OTRAS PREGUNTAS'.
    - Formato Matemático (CRÍTICO): Usa `$` SOLO para aislar fórmulas matemáticas (ej: `$E=mc^2$`). Para referirte a montos de dinero usa la palabra escrita o escápalo (`\\$50,000`). NUNCA encierres oraciones enteras dentro de signos `$`.
    
    {type_instructions}
    
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