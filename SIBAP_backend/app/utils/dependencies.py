from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import SECRET_KEY, ALGORITHM, COOKIE_NAME
from app.db.session import get_db
from app.models.usuario import Usuario
from app.utils.security_logger import log_invalid_token

def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    """
    Obtiene el usuario actual desde el token JWT en la cookie.
    
    Validaciones:
    - Token presente en cookie
    - Token válido y no expirado
    - Usuario existe en base de datos
    - Usuario está activo
    
    Args:
        request: Request de FastAPI
        db: Sesión de base de datos
        
    Returns:
        Usuario: Objeto del usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe/inactivo
    """
    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            log_invalid_token("Token sin user_id", db)
            raise HTTPException(status_code=401, detail="Token inválido")
            
    except JWTError as e:
        log_invalid_token(f"Error JWT: {str(e)}", db)
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    
    if not user:
        log_invalid_token("Usuario no existe", db)
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    if not user.is_active:
        log_invalid_token("Usuario inactivo", db)
        raise HTTPException(status_code=401, detail="Usuario inactivo")
    
    return user
