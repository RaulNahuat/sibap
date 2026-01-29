import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Enum, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class QuestionType(enum.Enum):
    MCQ = "MCQ"   
    TF = "TF"     
    OPEN = "OPEN" 

class DifficultyLevel(enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class ConfiguracionGeneracion(Base):
    __tablename__ = "generation_configs"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False)
    
    program: Mapped[str] = mapped_column(String(150), nullable=False)
    semester: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(150), nullable=False)
    topic: Mapped[str] = mapped_column(String(150), nullable=False)
    subtopic: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(Enum(DifficultyLevel), nullable=False)
    
    num_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    documento: Mapped["Documento"] = relationship("Documento", back_populates="configuraciones")
    reactivos: Mapped[List["Reactivo"]] = relationship(
        "Reactivo", 
        back_populates="configuracion", 
        cascade="all, delete-orphan"
    )