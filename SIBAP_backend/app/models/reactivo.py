from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Text, Enum, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.configuracion_generacion import QuestionType

class Reactivo(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    config_id: Mapped[int] = mapped_column(ForeignKey("generation_configs.id"), nullable=False)
    
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    question_type: Mapped[Optional[QuestionType]] = mapped_column(Enum(QuestionType), nullable=True)
    
    is_validated: Mapped[bool] = mapped_column(Boolean, default=False)
    
    feedback_correct: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback_incorrect: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    configuracion: Mapped["ConfiguracionGeneracion"] = relationship(
        "ConfiguracionGeneracion", 
        back_populates="reactivos"
    )
    
    opciones: Mapped[List["Opcion"]] = relationship(
        "Opcion", 
        back_populates="reactivo", 
        cascade="all, delete-orphan"
    )