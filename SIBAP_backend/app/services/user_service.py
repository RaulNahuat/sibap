from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.usuario import Usuario
from app.core.security import verify_password, hash_password

def get_active_user(db: Session, user_id: int) -> Usuario | None:
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user or not user.is_active:
        return None
    return user

def get_user_profile(db: Session, user_id: int) -> Usuario | None:
    """
    Obtiene el perfil de un usuario.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        
    Returns:
        Usuario: Objeto usuario si el usuario existe y esta autenticado
        None: Si el usuario no existe o esta inactivo
    """
    return get_active_user(db, user_id)

def update_user_profile(db: Session, user_id: int, name: str, last_name: str) -> Usuario | None:
    """
    Actualiza el perfil de un usuario.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        name: Nombre del usuario
        last_name: Apellido del usuario
        
    Returns:
        Usuario: Objeto usuario si el usuario existe y esta autenticado
        None: Si el usuario no existe o esta inactivo
    """
    user = get_active_user(db, user_id)
    if not user:
        return None

    if name is not None:
        user.name = name
    if last_name is not None:
        user.last_name = last_name

    db.commit()
    db.refresh(user)
    
    return user


def update_user_password(db: Session, user_id: int, current_password: str, new_password: str) -> Usuario | None:
    """
    Actualiza la contraseña de un usuario.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        password: Contraseña en texto plano
        new_password: Nueva contraseña en texto plano
        
    Returns:
        Usuario: Objeto usuario si el usuario existe y esta autenticado
        None: Si el usuario no existe o esta inactivo
    """
    user = get_active_user(db, user_id)
    if not user:
        return None

    if not verify_password(current_password, user.password_hash):
        return None

    user.password_hash = hash_password(new_password)

    db.commit()
    db.refresh(user)
    return user

def request_account_deletion(db: Session, user_id: int, password: str) -> Usuario | None:
    """
    Solicita la eliminación de la cuenta de un usuario.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        password: Contraseña en texto plano
        
    Returns:
        Usuario: Objeto usuario si el usuario existe y esta autenticado
        None: Si el usuario no existe o esta inactivo
    """
    user = get_active_user(db, user_id)
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    # Hard delete (cascade se encarga de documentos y exportaciones)
    db.delete(user)
    db.commit()
    
    return user