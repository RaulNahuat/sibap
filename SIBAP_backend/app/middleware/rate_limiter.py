from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from typing import Dict, List
from app.utils.security_logger import log_rate_limit_exceeded

# Almacenamiento en memoria de intentos por IP
# Estructura: {ip_address: [timestamp1, timestamp2, ...]}
login_attempts: Dict[str, List[datetime]] = {}

# Configuración
MAX_ATTEMPTS = 5
WINDOW_MINUTES = 1  # Ventana de tiempo en minutos


def get_client_ip(request: Request) -> str:
    """
    Obtiene la dirección IP del cliente.
    
    Args:
        request: Request de FastAPI
        
    Returns:
        str: Dirección IP del cliente
    """
    # Intenta obtener la IP real si está detrás de un proxy
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Si no hay proxy, usa la IP directa
    return request.client.host if request.client else "unknown"


def clean_old_attempts(ip_address: str):
    """
    Limpia intentos antiguos fuera de la ventana de tiempo.
    
    Args:
        ip_address: Dirección IP a limpiar
    """
    if ip_address not in login_attempts:
        return
    
    cutoff_time = datetime.now() - timedelta(minutes=WINDOW_MINUTES)
    login_attempts[ip_address] = [
        attempt for attempt in login_attempts[ip_address]
        if attempt > cutoff_time
    ]
    
    # Si no quedan intentos, eliminar la entrada
    if not login_attempts[ip_address]:
        del login_attempts[ip_address]


def check_rate_limit(request: Request, endpoint: str = "/auth/login"):
    """
    Verifica si la IP ha excedido el límite de intentos.
    
    Args:
        request: Request de FastAPI
        endpoint: Nombre del endpoint (para logging)
        
    Raises:
        HTTPException: Si se excede el límite de intentos
    """
    ip_address = get_client_ip(request)
    
    # Limpiar intentos antiguos
    clean_old_attempts(ip_address)
    
    # Verificar intentos actuales
    if ip_address in login_attempts:
        attempts_count = len(login_attempts[ip_address])
        
        if attempts_count >= MAX_ATTEMPTS:
            log_rate_limit_exceeded(endpoint)
            raise HTTPException(
                status_code=429,
                detail=f"Demasiados intentos. Por favor, espera {WINDOW_MINUTES} minuto(s) antes de intentar nuevamente."
            )
    
    # Registrar este intento
    if ip_address not in login_attempts:
        login_attempts[ip_address] = []
    
    login_attempts[ip_address].append(datetime.now())


def reset_rate_limit(request: Request):
    """
    Reinicia el contador de intentos para una IP (usado después de login exitoso).
    
    Args:
        request: Request de FastAPI
    """
    ip_address = get_client_ip(request)
    
    if ip_address in login_attempts:
        del login_attempts[ip_address]
