from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.programa import Programa
from app.models.materia import Materia
from app.models.tema import Tema
from app.repositories.curriculum_repository import CurriculumRepository

class CurriculumService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CurriculumRepository(db)

    def resolve_ids(self, program_name: Optional[str], subject_name: Optional[str], topic_name: Optional[str], program_id: Optional[int] = None, subject_id: Optional[int] = None, topic_id: Optional[int] = None):

        prog_id = program_id
        if not prog_id and program_name:
            prog = self.repo.get_program_by_name(program_name)
            if not prog:
                prog = self.repo.create_program(Programa(nombre=program_name))
            prog_id = prog.id
        
        sub_id = subject_id
        if not sub_id and subject_name:
            if not prog_id:
                prog_id = self.resolve_ids("General", None, None)[0]
                
            materia = self.repo.get_subject_by_name(subject_name, prog_id)
            if not materia:
                materia = self.repo.create_subject(Materia(
                    nombre=subject_name,
                    program_id=prog_id,
                    semestre=0,
                    clave="MANUAL"
                ))
            sub_id = materia.id
            
        top_id = topic_id
        if not top_id and topic_name:
            if not sub_id:
                raise ValueError("No se puede resolver el tema sin una materia identificada.")
                
            tema = self.repo.get_topic_by_name(topic_name, sub_id)
            if not tema:
                tema = self.repo.create_topic(Tema(
                    nombre=topic_name,
                    materia_id=sub_id
                ))
            top_id = tema.id
            
        if not prog_id or not sub_id or not top_id:
            raise ValueError("Se requiere al menos el nombre del programa, materia y tema.")
            
        return prog_id, sub_id, top_id
