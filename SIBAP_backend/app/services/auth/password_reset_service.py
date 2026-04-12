from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from typing import Optional

from app.models.usuario import Usuario
from app.core.security import create_reset_token, verify_reset_token, hash_password
from app.core.config import RESET_TOKEN_EXPIRE_MINUTES
from app.services.notifications.email_service import send_password_reset_email


def request_password_reset(db: Session, email: str) -> bool:
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        return True
    
    if not user.is_active:
        return True
    
    reset_token = create_reset_token(email)
    
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    db.commit()
    
    send_password_reset_email(email, reset_token)
    
    return True


def verify_password_reset_token(db: Session, token: str) -> Optional[str]:

    email = verify_reset_token(token)
    
    if not email:
        return None
    
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        return None
    
    if user.reset_token != token:
        return None
    
    if not user.reset_token_expires:
        return None
    
    token_expires = user.reset_token_expires
    if token_expires.tzinfo is None:
        token_expires = token_expires.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > token_expires:
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        return None
    
    return email


def complete_password_reset(db: Session, token: str, new_password: str) -> bool:
    
    email = verify_password_reset_token(db, token)
    
    if not email:
        return False
    
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        return False
    
    user.password_hash = hash_password(new_password)
    
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    
    return True
