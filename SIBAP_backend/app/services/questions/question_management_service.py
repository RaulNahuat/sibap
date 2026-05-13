from typing import List
from sqlalchemy.orm import Session

from app.models.reactivo import Reactivo
from app.models.opcion import Opcion
from app.repositories.question_repository import QuestionRepository


def get_questions_by_config(db: Session, config_id: int, user_id: int):
    q_repo = QuestionRepository(db)
    config = q_repo.get_config_by_id(config_id)
    if not config or config.documento.user_id != user_id:
        return None
    return q_repo.get_reactivos_by_config(config_id)


def add_manual_question(db: Session, config_id: int, user_id: int, question_text: str, options: list,
                        name: str = None, feedback_correct: str = None,
                        feedback_incorrect: str = None, question_type=None):
    q_repo = QuestionRepository(db)
    config = q_repo.get_config_by_id(config_id)
    if not config or config.documento.user_id != user_id:
        return None

    reactivo = q_repo.create_question(Reactivo(
        config_id=config_id,
        question_text=question_text,
        name=name,
        feedback_correct=feedback_correct,
        feedback_incorrect=feedback_incorrect,
        question_type=question_type,
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

    db.commit()
    db.refresh(reactivo)
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
