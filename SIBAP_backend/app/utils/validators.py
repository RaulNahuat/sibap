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
    if len(password) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    
    if not re.search(r"[A-Z]", password):
        raise ValueError("La contraseña debe contener al menos una letra mayúscula")
    
    if not re.search(r"[a-z]", password):
        raise ValueError("La contraseña debe contener al menos una letra minúscula")
    
    if not re.search(r"\d", password):
        raise ValueError("La contraseña debe contener al menos un número")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?\":{}|<>)")
    
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
    
    if len(name) < 2:
        raise ValueError(f"El {field_name} debe tener al menos 2 caracteres")
    
    if len(name) > 150:
        raise ValueError(f"El {field_name} no puede exceder 150 caracteres")
    
    return name
