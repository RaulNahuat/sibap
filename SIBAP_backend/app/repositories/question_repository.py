from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.opcion import Opcion
from app.models.reactivo import Reactivo

class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_config_by_id(self, config_id: int) -> Optional[ConfiguracionGeneracion]:
        return self.db.query(ConfiguracionGeneracion).filter(ConfiguracionGeneracion.id == config_id).first()

    def get_question_by_id(self, question_id: int) -> Optional[Reactivo]:
        return self.db.query(Reactivo).filter(Reactivo.id == question_id).first()

    def create_config(self, config: ConfiguracionGeneracion) -> ConfiguracionGeneracion:
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def create_question(self, question: Reactivo) -> Reactivo:
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def create_option(self, option: Opcion) -> Opcion:
        self.db.add(option)
        self.db.commit()
        self.db.refresh(option)
        return option

    def delete_options_by_question_id(self, question_id: int) -> None:
        self.db.query(Opcion).filter(Opcion.item_id == question_id).delete()
        self.db.commit()

    def get_questions_by_config_id(self, config_id: int) -> List[Reactivo]:
        return self.db.query(Reactivo).filter(Reactivo.id == config_id).all()
    
    def get_reactivos_by_config(self, config_id: int) -> List[Reactivo]:
        return self.db.query(Reactivo).filter(Reactivo.config_id == config_id).all()

    def bulk_save_questions(self, questions: List[Reactivo]) -> List[Reactivo]:
        for q in questions:
            self.db.add(q)
        self.db.commit()
        for q in questions:
            self.db.refresh(q)
        return questions

    def delete_config(self, config: ConfiguracionGeneracion) -> None:
        self.db.delete(config)
        self.db.commit()

    def get_existing_question_texts(self, topic_id: int, document_id: int, limit: int = 20) -> List[str]:
        query = (
            self.db.query(Reactivo.question_text)
            .join(ConfiguracionGeneracion)
            .filter(
                (ConfiguracionGeneracion.topic_id == topic_id) | 
                (ConfiguracionGeneracion.document_id == document_id)
            )
            .order_by(Reactivo.created_at.desc())
            .limit(limit)
        )
        return [q[0] for q in query.all()]
