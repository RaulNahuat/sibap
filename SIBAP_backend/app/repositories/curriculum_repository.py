from typing import Optional
from sqlalchemy.orm import Session
from app.models.programa import Programa
from app.models.materia import Materia
from app.models.tema import Tema

class CurriculumRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_program_by_name(self, name: str) -> Optional[Programa]:
        return self.db.query(Programa).filter(Programa.nombre == name).first()

    def create_program(self, programa: Programa) -> Programa:
        self.db.add(programa)
        self.db.commit()
        self.db.refresh(programa)
        return programa

    def get_subject_by_name(self, name: str, program_id: int) -> Optional[Materia]:
        return self.db.query(Materia).filter(
            Materia.nombre == name,
            Materia.program_id == program_id
        ).first()

    def create_subject(self, materia: Materia) -> Materia:
        self.db.add(materia)
        self.db.commit()
        self.db.refresh(materia)
        return materia

    def get_topic_by_name(self, name: str, subject_id: int) -> Optional[Tema]:
        return self.db.query(Tema).filter(
            Tema.nombre == name,
            Tema.materia_id == subject_id
        ).first()

    def create_topic(self, tema: Tema) -> Tema:
        self.db.add(tema)
        self.db.commit()
        self.db.refresh(tema)
        return tema
