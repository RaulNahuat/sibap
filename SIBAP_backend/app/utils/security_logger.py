import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

# Configurar logger específico para eventos de seguridad (consola)
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

# Handler para consola con formato personalizado
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Formato: [TIMESTAMP] [SECURITY] [LEVEL] - Message
formatter = logging.Formatter(
    '[%(asctime)s] [SECURITY] [%(levelname)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(formatter)
security_logger.addHandler(console_handler)

# Evitar duplicación de logs
security_logger.propagate = False


def _save_to_db(db: Optional[Session], event_type: str, message: str, user_id: Optional[int] = None):
    """
    Guarda el log en la base de datos de forma segura.
    
    IMPORTANTE: NO guarda IPs ni datos sensibles para minimizar riesgo en caso de filtración.
    
    Args:
        db: Sesión de base de datos (opcional)
        event_type: Tipo de evento (login_success, login_failed, etc.)
        message: Mensaje descriptivo SIN datos sensibles
        user_id: ID del usuario (opcional)
    """
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
        # Si falla el guardado en BD, solo registrar en consola
        security_logger.error(f"Error guardando log en BD: {str(e)}")
        db.rollback()


def log_login_attempt(email: str, success: bool, user_id: Optional[int] = None, db: Optional[Session] = None):
    """
    Registra un intento de login.
    
    Args:
        email: Email del usuario (solo para consola, NO se guarda en BD)
        success: Si el login fue exitoso
        user_id: ID del usuario (solo si login exitoso)
        db: Sesión de base de datos (opcional)
    """
    status = "EXITOSO" if success else "FALLIDO"
    
    # Log en consola (temporal, con email para debugging)
    if success:
        security_logger.info(f"Login {status} para usuario: {email}")
    else:
        security_logger.warning(f"Login {status} para usuario: {email}")
    
    # Log en BD (persistente, SIN email para proteger privacidad)
    event_type = "login_success" if success else "login_failed"
    message = f"Intento de login {status.lower()}"
    
    _save_to_db(db, event_type, message, user_id)


def log_registration(email: str, user_id: int, db: Optional[Session] = None):
    """
    Registra un nuevo registro de usuario.
    
    Args:
        email: Email del nuevo usuario (solo para consola)
        user_id: ID del usuario creado
        db: Sesión de base de datos (opcional)
    """
    # Log en consola
    security_logger.info(f"Nuevo usuario registrado: {email}")
    
    # Log en BD (SIN email)
    _save_to_db(db, "user_registered", "Nuevo usuario registrado", user_id)


def log_rate_limit_exceeded(endpoint: str, db: Optional[Session] = None):
    """
    Registra cuando se excede el límite de intentos.
    
    NOTA: NO guarda IP para proteger privacidad.
    
    Args:
        endpoint: Endpoint que fue bloqueado
        db: Sesión de base de datos (opcional)
    """
    # Log en consola
    security_logger.warning(f"Rate limit excedido en endpoint {endpoint}")
    
    # Log en BD (SIN IP)
    _save_to_db(db, "rate_limit_exceeded", f"Rate limit excedido en {endpoint}")


def log_logout(email: str, user_id: int, db: Optional[Session] = None):
    """
    Registra un logout de usuario.
    
    Args:
        email: Email del usuario (solo para consola)
        user_id: ID del usuario
        db: Sesión de base de datos (opcional)
    """
    # Log en consola
    security_logger.info(f"Logout de usuario: {email}")
    
    # Log en BD (SIN email)
    _save_to_db(db, "user_logout", "Usuario cerró sesión", user_id)


def log_invalid_token(reason: str, db: Optional[Session] = None):
    """
    Registra intentos de acceso con tokens inválidos.
    
    Args:
        reason: Razón por la que el token es inválido
        db: Sesión de base de datos (opcional)
    """
    # Log en consola
    security_logger.warning(f"Token inválido ({reason})")
    
    # Log en BD (SIN detalles sensibles)
    _save_to_db(db, "invalid_token", "Intento de acceso con token inválido")
