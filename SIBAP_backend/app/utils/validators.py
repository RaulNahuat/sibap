import re
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.usuario import Usuario
import logging
from pathlib import Path


def validate_password_strength(password: str) -> str:
    rules = [
        (r".{8,}", "al menos 8 caracteres"),
        (r"[A-Z]", "al menos una letra mayúscula"),
        (r"[a-z]", "al menos una letra minúscula"),
        (r"\d", "al menos un número"),
        (r"[!@#$%^&*(),.?\":{}|<>]", "al menos un carácter especial")
    ]

    for pattern, message in rules:
        if not re.search(pattern, password):
            raise ValueError(f"La contraseña debe tener {message}")
    
    return password


def validate_email_not_exists(email: str, db: Session) -> str:
    existing_user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Este email ya está registrado"
        )
    
    return email


def validate_name_length(name: str, field_name: str = "nombre") -> str:
    name = name.strip()

    if not name:
        raise ValueError(f"El {field_name} no puede estar vacío")
    
    if len(name) < 2 or len(name) > 150:
        raise ValueError(f"El {field_name} debe tener entre 2 y 150 caracteres")

    pattern = r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
    
    if not re.match(pattern, name):
        raise ValueError(f"El {field_name} debe contener solo letras")

    return name


MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".pptx"}

def validate_file(filename: str, content: bytes) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Extensión {ext} no permitida.")
    if not content:
        raise ValueError("Archivo vacío.")
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("El archivo excede el límite de 10MB.")
    return ext