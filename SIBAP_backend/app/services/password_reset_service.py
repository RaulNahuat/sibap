"""
Servicio para gestión de recuperación de contraseña.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from typing import Optional

from app.models.usuario import Usuario
from app.core.security import create_reset_token, verify_reset_token, hash_password
from app.core.config import RESET_TOKEN_EXPIRE_MINUTES
from app.services.email_service import send_password_reset_email


def request_password_reset(db: Session, email: str) -> bool:
    """
    Solicita un reset de contraseña para el usuario.
    Genera un token y envía un email con el enlace de recuperación.
    
    Por seguridad, siempre retorna True incluso si el email no existe,
    para no revelar qué emails están registrados en el sistema.
    
    Args:
        db: Sesión de base de datos
        email: Email del usuario
        
    Returns:
        bool: Siempre True por seguridad
    """
    # Buscar usuario por email
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    # Si el usuario no existe, retornar True sin hacer nada (por seguridad)
    if not user:
        return True
    
    # Si el usuario está inactivo, no enviar email
    if not user.is_active:
        return True
    
    # Generar token de reset
    reset_token = create_reset_token(email)
    
    # Guardar token y fecha de expiración en la base de datos
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    db.commit()
    
    # Enviar email con el enlace de reset
    send_password_reset_email(email, reset_token)
    
    return True


def verify_password_reset_token(db: Session, token: str) -> Optional[str]:
    """
    Verifica si un token de reset es válido.
    
    Args:
        db: Sesión de base de datos
        token: Token de reset a verificar
        
    Returns:
        str: Email del usuario si el token es válido
        None: Si el token es inválido o ha expirado
    """
    # Verificar el token JWT
    email = verify_reset_token(token)
    
    if not email:
        return None
    
    # Buscar usuario en la base de datos
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        return None
    
    # Verificar que el token coincida con el almacenado
    if user.reset_token != token:
        return None
    
    # Verificar que el token no haya expirado
    if not user.reset_token_expires:
        return None
    
    # Convertir la fecha de la BD a timezone-aware si es necesario
    token_expires = user.reset_token_expires
    if token_expires.tzinfo is None:
        # Si la fecha de la BD no tiene timezone, asumimos que es UTC
        token_expires = token_expires.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > token_expires:
        # Token expirado, limpiar de la base de datos
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        return None
    
    return email


def complete_password_reset(db: Session, token: str, new_password: str) -> bool:
    """
    Completa el proceso de reset de contraseña.
    Actualiza la contraseña del usuario y limpia el token.
    
    Args:
        db: Sesión de base de datos
        token: Token de reset
        new_password: Nueva contraseña
        
    Returns:
        bool: True si el reset fue exitoso, False en caso contrario
    """
    # Verificar el token
    email = verify_password_reset_token(db, token)
    
    if not email:
        return False
    
    # Buscar usuario
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        return False
    
    # Actualizar contraseña
    user.password_hash = hash_password(new_password)
    
    # Limpiar token de reset
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    
    return True
