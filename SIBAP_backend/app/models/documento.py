import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class FileType(enum.Enum):
    PDF = "PDF"
    DOCX = "DOCX"
    TXT = "TXT"

class Documento(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[FileType] = mapped_column(Enum(FileType), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="documentos")
    configuraciones: Mapped[list["ConfiguracionGeneracion"]] = relationship(
        "ConfiguracionGeneracion", 
        back_populates="documento", 
        cascade="all, delete-orphan"
    )