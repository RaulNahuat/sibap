import logging
from datetime import datetime
from typing import Optional

# Configurar logger específico para eventos de seguridad
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


def log_login_attempt(email: str, success: bool, ip_address: Optional[str] = None):
    """
    Registra un intento de login.
    
    Args:
        email: Email del usuario
        success: Si el login fue exitoso
        ip_address: Dirección IP del cliente (opcional)
    """
    status = "EXITOSO" if success else "FALLIDO"
    ip_info = f" desde IP {ip_address}" if ip_address else ""
    
    if success:
        security_logger.info(f"Login {status} para usuario: {email}{ip_info}")
    else:
        security_logger.warning(f"Login {status} para usuario: {email}{ip_info}")


def log_registration(email: str, ip_address: Optional[str] = None):
    """
    Registra un nuevo registro de usuario.
    
    Args:
        email: Email del nuevo usuario
        ip_address: Dirección IP del cliente (opcional)
    """
    ip_info = f" desde IP {ip_address}" if ip_address else ""
    security_logger.info(f"Nuevo usuario registrado: {email}{ip_info}")


def log_rate_limit_exceeded(ip_address: str, endpoint: str):
    """
    Registra cuando se excede el límite de intentos.
    
    Args:
        ip_address: Dirección IP bloqueada
        endpoint: Endpoint que fue bloqueado
    """
    security_logger.warning(
        f"Rate limit excedido para IP {ip_address} en endpoint {endpoint}"
    )


def log_logout(email: str, ip_address: Optional[str] = None):
    """
    Registra un logout de usuario.
    
    Args:
        email: Email del usuario
        ip_address: Dirección IP del cliente (opcional)
    """
    ip_info = f" desde IP {ip_address}" if ip_address else ""
    security_logger.info(f"Logout de usuario: {email}{ip_info}")


def log_invalid_token(reason: str, ip_address: Optional[str] = None):
    """
    Registra intentos de acceso con tokens inválidos.
    
    Args:
        reason: Razón por la que el token es inválido
        ip_address: Dirección IP del cliente (opcional)
    """
    ip_info = f" desde IP {ip_address}" if ip_address else ""
    security_logger.warning(f"Token inválido ({reason}){ip_info}")
