from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Programa(Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)

    materias: Mapped[List["Materia"]] = relationship("Materia", back_populates="programa_rel")
