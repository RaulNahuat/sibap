from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.usuario import Usuario
from app.schemas.user import UserResponse
from app.core.security import hash_password, verify_password
from app.utils.validators import validate_email_not_exists
from app.utils.security_logger import log_registration, log_login_attempt

def register_user(db: Session, name: str, last_name: str, email: str, password: str) -> UserResponse:
    """
    Registra un nuevo usuario en el sistema.
    
    Validaciones:
    - Email no duplicado
    - Contraseña fuerte (validado en schema)
    - Nombres con longitud adecuada (validado en schema)
    
    Args:
        db: Sesión de base de datos
        name: Nombre del usuario
        last_name: Apellido del usuario
        email: Email del usuario
        password: Contraseña en texto plano
        
    Returns:
        UserResponse: Datos del usuario creado (sin password_hash)
        
    Raises:
        HTTPException: Si el email ya está registrado
    """
    # Validar que el email no exista
    validate_email_not_exists(email, db)
    
    # Crear usuario
    user = Usuario(
        name=name,
        last_name=last_name,
        email=email, 
        password_hash=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Registrar evento de seguridad (con user_id y db session)
    log_registration(email, user.id, db)
    
    # Retornar respuesta segura (sin password_hash)
    return UserResponse.model_validate(user)


def authenticate_user(db: Session, email: str, password: str) -> Usuario | None:
    """
    Autentica un usuario verificando email y contraseña.
    
    Args:
        db: Sesión de base de datos
        email: Email del usuario
        password: Contraseña en texto plano
        
    Returns:
        Usuario: Objeto usuario si las credenciales son válidas
        None: Si el email no existe o la contraseña es incorrecta
    """
    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user