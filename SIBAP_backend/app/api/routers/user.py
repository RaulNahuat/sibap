from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.config import COOKIE_NAME

from app.schemas.user import UserResponse, UserUpdate, UserUpdatePassword, UserDeleteRequest
from app.services.user_service import get_user_profile, update_user_profile, update_user_password, request_account_deletion
from app.db.session import get_db
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/profile", response_model=UserResponse)
def get_profile(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el perfil del usuario autenticado.
    
    La autenticación se valida automáticamente mediante get_current_user:
    - Token JWT válido y no expirado
    - Usuario existe en base de datos
    - Usuario está activo
    
    Returns:
        UserResponse: Datos del usuario actual
    """
    user = get_user_profile(db, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza el perfil del usuario autenticado.
    
    Validaciones automáticas (en schema):
    - Nombres con longitud adecuada (2-150 caracteres)
    
    Returns:
        UserResponse: Datos del usuario actualizado
    """
    user = update_user_profile(db, current_user.id, data.name, data.last_name)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/password", status_code=204)
def update_password(
    data: UserUpdatePassword,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza la contraseña del usuario autenticado.
    
    Validaciones automáticas (en schema):
    - Contraseña fuerte (min 8 chars, mayúsculas, minúsculas, números, especiales)
    
    Returns:
        No Content (204)
    """
    user = update_user_password(db, current_user.id, data.password, data.new_password)
    if not user:
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    return Response(status_code=204)


@router.delete("/account")
def delete_account(
    data: UserDeleteRequest,
    response: Response,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Solicita la eliminación de la cuenta del usuario autenticado.
    Esta acción es IRREVERSIBLE. Elimina permanentemente:
    - Cuenta de usuario
    - Documentos asociados
    - Historial de exportaciones
    
    Los logs de actividad se mantienen pero se anonimizan.
    
    Returns:
        dict: Mensaje de éxito
    """
    user = request_account_deletion(db, current_user.id, data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    
    response.delete_cookie(key=COOKIE_NAME)
    
    return {"message": "Cuenta eliminada exitosamente"}