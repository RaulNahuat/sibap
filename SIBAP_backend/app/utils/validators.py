import re
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.usuario import Usuario

def validate_password_strength(password: str) -> str:
    """
    Valida que la contraseña cumpla con los requisitos de seguridad.
    
    Requisitos:
    - Mínimo 8 caracteres
    - Al menos una letra mayúscula
    - Al menos una letra minúscula
    - Al menos un número
    - Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)
    
    Args:
        password: La contraseña a validar
        
    Returns:
        str: La contraseña si es válida
        
    Raises:
        ValueError: Si la contraseña no cumple los requisitos
    """

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
    """
    Valida que el email no esté registrado en la base de datos.
    
    Args:
        email: El email a validar
        db: Sesión de base de datos
        
    Returns:
        str: El email si no existe
        
    Raises:
        HTTPException: Si el email ya está registrado
    """
    existing_user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Este email ya está registrado"
        )
    
    return email


def validate_name_length(name: str, field_name: str = "nombre") -> str:
    """
    Valida que el nombre tenga una longitud adecuada.
    
    Args:
        name: El nombre a validar
        field_name: Nombre del campo para mensajes de error
        
    Returns:
        str: El nombre si es válido
        
    Raises:
        ValueError: Si el nombre es muy corto o muy largo
    """
    name = name.strip()

    if not name:
        raise ValueError(f"El {field_name} no puede estar vacío")
    
    if len(name) < 2 or len(name) > 150:
        raise ValueError(f"El {field_name} debe tener entre 2 y 150 caracteres")

    pattern = r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$"
    
    if not re.match(pattern, name):
        raise ValueError(f"El {field_name} debe contener solo letras")

    return name