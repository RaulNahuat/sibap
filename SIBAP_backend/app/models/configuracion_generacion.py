import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Enum, Integer, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.documento import Documento
    from app.models.reactivo import Reactivo
    from app.models.materia import Materia
    from app.models.programa import Programa
    from app.models.tema import Tema

class QuestionType(enum.Enum):
    MCQ = "MCQ"   
    TF = "TF"     
    OPEN = "OPEN" 
    MATCHING = "MATCHING"
    CALCULATED = "CALCULATED"
    MIXED = "MIXED"

class GenerationStatus(enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ConfiguracionGeneracion(Base):
    __tablename__ = "generation_configs"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False)

    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"), nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("curriculum_subjects.id"), nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("curriculum_topics.id"), nullable=False)

    subtopic: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    cognitive_level: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    
    num_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    num_mcq: Mapped[int] = mapped_column(Integer, default=0)
    num_matching: Mapped[int] = mapped_column(Integer, default=0)
    num_calculated: Mapped[int] = mapped_column(Integer, default=0)
    
    # New columns for async processing
    status: Mapped[GenerationStatus] = mapped_column(
        Enum(GenerationStatus, name="generationstatus"), 
        default=GenerationStatus.PENDING,
        server_default="PENDING",
        nullable=False
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    documento: Mapped["Documento"] = relationship("Documento", back_populates="configuraciones")
    
    # Relaciones de catálogos
    programa_obj: Mapped[Optional["Programa"]] = relationship("Programa")
    materia_obj: Mapped[Optional["Materia"]] = relationship("Materia")
    tema_obj: Mapped[Optional["Tema"]] = relationship("Tema")
    reactivos: Mapped[List["Reactivo"]] = relationship(
        "Reactivo", 
        back_populates="configuracion", 
        cascade="all, delete-orphan"
    )