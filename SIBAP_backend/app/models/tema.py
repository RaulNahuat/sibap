from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Tema(Base):
    __tablename__ = "curriculum_topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("curriculum_subjects.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)

    materia_rel: Mapped["Materia"] = relationship("Materia", back_populates="temas")
