from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.usuario import Usuario
from app.schemas.user import UserResponse
from app.core.security import hash_password, verify_password
from app.utils.validators import validate_email_not_exists
from app.utils.security_logger import log_registration, log_login_attempt

def register_user(db: Session, name: str, last_name: str, email: str, password: str) -> UserResponse:
    validate_email_not_exists(email, db)
    
    user = Usuario(
        name=name,
        last_name=last_name,
        email=email, 
        password_hash=hash_password(password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_registration(email, user.id, db)
    
    return UserResponse.model_validate(user)


def authenticate_user(db: Session, email: str, password: str) -> Usuario | None:
    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user