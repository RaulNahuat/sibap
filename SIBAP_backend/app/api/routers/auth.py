from fastapi import APIRouter, Depends, Response, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from app.schemas.user import UserCreate, UserLogin, UserLoginResponse
from app.schemas import user as schemas
from app.services.auth.auth_service import register_user, authenticate_user
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, COOKIE_NAME, ENVIRONMENT, REFRESH_TOKEN_EXPIRE_DAYS, REFRESH_COOKIE_NAME
from app.db.session import get_db
from app.middleware.rate_limiter import check_rate_limit, reset_rate_limit
from app.utils.security_logger import log_login_attempt, log_logout
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(data: UserCreate, request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        user = register_user(db, data.name, data.last_name, data.email, data.password)
        token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        is_production = ENVIRONMENT == "production"
        
        response.set_cookie(
            key=COOKIE_NAME,
            value=token, 
            httponly=True, 
            secure=is_production,  
            samesite="lax",  
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60  
        )
        
        return {"message": "Usuario registrado exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(data: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):

    check_rate_limit(request, "/auth/login")
    
    user = authenticate_user(db, data.email, data.password)
    
    if not user:
        log_login_attempt(data.email, success=False, user_id=None, db=db)
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not user.is_active:
        log_login_attempt(data.email, success=False, user_id=None, db=db)
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    reset_rate_limit(request)
    log_login_attempt(data.email, success=True, user_id=user.id, db=db)

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )


    is_production = ENVIRONMENT == "production"
    
    response.set_cookie(
        key=COOKIE_NAME,
        value=token, 
        httponly=True, 
        secure=is_production,  
        samesite="lax",  
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60  
    )

    if data.remember_me:
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )

    return {
        "message": "Login exitoso"
    }


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):

    log_logout(current_user.email, current_user.id, db)
    
    response.delete_cookie(key=COOKIE_NAME)
    response.delete_cookie(key=REFRESH_COOKIE_NAME)
    
    return {"message": "Logout exitoso"}


@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):

    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No hay refresh token")
    
    payload = verify_token(refresh_token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    
    new_access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    is_production = ENVIRONMENT == "production"
    
    response.set_cookie(
        key=COOKIE_NAME,
        value=new_access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"message": "Token renovado exitosamente"}


@router.get("/me", response_model=UserLoginResponse)
def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    return current_user


# ========================================
# Password Reset Endpoints
@router.post("/password-reset/request")
def request_password_reset(
    data: schemas.PasswordResetRequest,
    db: Session = Depends(get_db)
):

    from app.services.auth.password_reset_service import request_password_reset
    
    request_password_reset(db, data.email)
    
    return {
        "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña"
    }


@router.post("/password-reset/verify")
def verify_reset_token(
    data: schemas.PasswordResetVerify,
    db: Session = Depends(get_db)
):

    from app.services.auth.password_reset_service import verify_password_reset_token
    
    email = verify_password_reset_token(db, data.token)
    
    if not email:
        raise HTTPException(
            status_code=400,
            detail="El enlace de recuperación es inválido o ha expirado"
        )
    
    return {
        "message": "Token válido",
        "email": email
    }


@router.post("/password-reset/complete")
def complete_password_reset(
    data: schemas.PasswordResetComplete,
    db: Session = Depends(get_db)
):
    from app.services.auth.password_reset_service import complete_password_reset
    
    success = complete_password_reset(db, data.token, data.new_password)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="El enlace de recuperación es inválido o ha expirado"
        )
    
    return {
        "message": "Contraseña actualizada exitosamente"
    }
