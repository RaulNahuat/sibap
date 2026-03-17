from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, distinct
from app.db.session import get_db
from app.models.materia import Materia
from app.models.programa import Programa

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/programs")
def get_programs(db: Session = Depends(get_db)):
    programas = db.execute(select(Programa).order_by(Programa.nombre)).scalars().all()
    return {"programs": [{"id": p.id, "nombre": p.nombre} for p in programas]}


@router.get("/semesters")
def get_semesters(
    program: str = Query(..., description="Nombre completo del programa educativo"),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(distinct(Materia.semestre))
        .join(Programa, Materia.program_id == Programa.id)
        .where(Programa.nombre == program)
        .order_by(Materia.semestre)
    ).scalars().all()
    return {"semesters": rows}


@router.get("/subjects")
def get_subjects(
    program: str = Query(..., description="Nombre completo del programa educativo"),
    semester: int = Query(..., description="Número de semestre"),
    db: Session = Depends(get_db),
):
    materias = db.execute(
        select(Materia)
        .join(Programa, Materia.program_id == Programa.id)
        .where(Programa.nombre == program, Materia.semestre == semester)
        .order_by(Materia.nombre)
    ).scalars().all()
    return {
        "subjects": [
            {"id": m.id, "clave": m.clave, "nombre": m.nombre}
            for m in materias
        ]
    }
