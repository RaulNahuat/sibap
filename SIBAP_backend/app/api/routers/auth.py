from fastapi import APIRouter, Depends, Response, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth_service import register_user, authenticate_user
from app.core.security import create_access_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_NAME, ENVIRONMENT
from app.db.session import get_db
from app.middleware.rate_limiter import check_rate_limit, reset_rate_limit, get_client_ip
from app.utils.security_logger import log_login_attempt, log_logout
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario.
    
    Validaciones automáticas (en schema):
    - Email válido y único
    - Contraseña fuerte (min 8 chars, mayúsculas, minúsculas, números, especiales)
    - Nombres con longitud adecuada (2-150 caracteres)
    
    Returns:
        UserResponse: Datos del usuario creado (sin password_hash)
    """
    try:
        user = register_user(db, data.name, data.last_name, data.email, data.password)
        return user
    except ValueError as e:
        # Errores de validación de contraseña o nombres
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(data: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Inicia sesión y retorna un token JWT en una cookie httponly.
    
    Rate limiting: 5 intentos por minuto por IP.
    
    Returns:
        dict: Mensaje de éxito y datos del usuario
    """
    # Verificar rate limiting
    check_rate_limit(request, "/auth/login")
    
    # Autenticar usuario
    user = authenticate_user(db, data.email, data.password)
    
    ip_address = get_client_ip(request)

    if not user:
        log_login_attempt(data.email, success=False, ip_address=ip_address)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not user.is_active:
        log_login_attempt(data.email, success=False, ip_address=ip_address)
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    # Login exitoso - resetear rate limit
    reset_rate_limit(request)
    log_login_attempt(data.email, success=True, ip_address=ip_address)

    # Crear token JWT
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Configurar cookie segura
    # En producción (HTTPS), secure=True
    # En desarrollo (HTTP), secure=False
    is_production = ENVIRONMENT == "production"
    
    response.set_cookie(
        key=COOKIE_NAME,
        value=token, 
        httponly=True, 
        secure=is_production,  
        samesite="lax",  
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60  
    )

    return {
        "message": "Login exitoso",
        "user": UserResponse.model_validate(user)
    }


@router.post("/logout")
def logout(request: Request, response: Response, current_user: Usuario = Depends(get_current_user)):
    """
    Cierra la sesión del usuario eliminando la cookie del token.
    
    Returns:
        dict: Mensaje de confirmación
    """
    ip_address = get_client_ip(request)
    log_logout(current_user.email, ip_address)
    
    # Eliminar cookie
    response.delete_cookie(key=COOKIE_NAME)
    
    return {"message": "Logout exitoso"}