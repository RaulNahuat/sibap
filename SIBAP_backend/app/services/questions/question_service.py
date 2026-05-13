import logging
from typing import List
from sqlalchemy.orm import Session

from app.schemas.question import QuestionGenerationRequest
from app.models.configuracion_generacion import ConfiguracionGeneracion

from app.services.questions import question_generation_service
from app.services.questions import question_management_service

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------
# Generación de Preguntas (IA y RAG)

def create_generation_config(db: Session, request: QuestionGenerationRequest, user_id: int) -> ConfiguracionGeneracion:
    return question_generation_service.create_generation_config(db, request, user_id)

async def get_prompt_preview(db: Session, request: QuestionGenerationRequest, user_id: int) -> str:
    return await question_generation_service.get_prompt_preview(db, request, user_id)

async def process_question_generation_task(config_id: int, request_data: dict, user_id: int):
    return await question_generation_service.process_question_generation_task(config_id, request_data, user_id)

async def regenerate_question(db: Session, question_id: int, user_id: int, model_name: str = None):
    return await question_generation_service.regenerate_question(db, question_id, user_id, model_name)

def _simulate_generation(
    db: Session,
    request: QuestionGenerationRequest,
    doc_id: int,
    num_mcq: int = 0,
    num_matching: int = 0,
    num_calculated: int = 0,
    total: int = 0,
):
    return question_generation_service._simulate_generation(
        db, request, doc_id, num_mcq, num_matching, num_calculated, total
    )

# -----------------------------------------------------------------------
# Gestión de Preguntas (CRUD)

def get_questions_by_config(db: Session, config_id: int, user_id: int):
    return question_management_service.get_questions_by_config(db, config_id, user_id)

def add_manual_question(db: Session, config_id: int, user_id: int, question_text: str, options: list,
                        name: str = None, feedback_correct: str = None,
                        feedback_incorrect: str = None, question_type=None):
    return question_management_service.add_manual_question(
        db, config_id, user_id, question_text, options,
        name=name, feedback_correct=feedback_correct,
        feedback_incorrect=feedback_incorrect, question_type=question_type
    )

def delete_question(db: Session, question_id: int, user_id: int) -> bool:
    return question_management_service.delete_question(db, question_id, user_id)

def update_questions_batch(db: Session, updates: List[dict], user_id: int):
    return question_management_service.update_questions_batch(db, updates, user_id)