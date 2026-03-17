from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.tema import Tema


class Materia(Base):
    __tablename__ = "curriculum_subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False, index=True)
    semestre: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    clave: Mapped[str] = mapped_column(String(30), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)

    programa_rel: Mapped["Programa"] = relationship("Programa", back_populates="materias")
    temas: Mapped[List["Tema"]] = relationship("Tema", back_populates="materia_rel", cascade="all, delete-orphan")
