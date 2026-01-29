import enum
from datetime import datetime
from sqlalchemy import Enum, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ExportFormat(enum.Enum):
    GIFT = "GIFT"
    XML = "XML"

class Exportacion(Base):
    __tablename__ = "exports"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    format: Mapped[ExportFormat] = mapped_column(Enum(ExportFormat), nullable=False)
    
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    exported_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="exportaciones")