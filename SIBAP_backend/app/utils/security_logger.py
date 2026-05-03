import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter(
    '[%(asctime)s] [SECURITY] [%(levelname)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(formatter)
security_logger.addHandler(console_handler)

security_logger.propagate = False


def _save_to_db(db: Optional[Session], event_type: str, message: str, user_id: Optional[int] = None):
    if db is None:
        return

    try:
        from app.models.log import Log
        
        log_entry = Log(
            user_id=user_id,
            event_type=event_type,
            message=message
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        security_logger.error(f"Error guardando log en BD: {str(e)}")
        db.rollback()


def log_login_attempt(email: str, success: bool, user_id: Optional[int] = None, db: Optional[Session] = None):
    status = "EXITOSO" if success else "FALLIDO"
    
    if success:
        security_logger.info(f"Login {status} para usuario: {email}")
    else:
        security_logger.warning(f"Login {status} para usuario: {email}")
    
    event_type = "login_success" if success else "login_failed"
    message = f"Intento de login {status.lower()}"
    
    _save_to_db(db, event_type, message, user_id)


def log_registration(email: str, user_id: int, db: Optional[Session] = None):
    security_logger.info(f"Nuevo usuario registrado: {email}")
    _save_to_db(db, "user_registered", "Nuevo usuario registrado", user_id)


def log_rate_limit_exceeded(endpoint: str, db: Optional[Session] = None):
    security_logger.warning(f"Rate limit excedido en endpoint {endpoint}")
    _save_to_db(db, "rate_limit_exceeded", f"Rate limit excedido en {endpoint}")


def log_logout(email: str, user_id: int, db: Optional[Session] = None):
    security_logger.info(f"Logout de usuario: {email}")
    _save_to_db(db, "user_logout", "Usuario cerró sesión", user_id)


def log_invalid_token(reason: str, db: Optional[Session] = None):
    security_logger.warning(f"Token inválido ({reason})")
    _save_to_db(db, "invalid_token", "Intento de acceso con token inválido")
