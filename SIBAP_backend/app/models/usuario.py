from typing import Optional
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base import Base

class Usuario(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    documentos: Mapped[list["Documento"]] = relationship(
        "Documento", back_populates="usuario", cascade="all, delete-orphan"
    )
    exportaciones: Mapped[list["Exportacion"]] = relationship("Exportacion", back_populates="usuario")
    logs: Mapped[list["Log"]] = relationship("Log", back_populates="usuario")