from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario
from app.schemas.dashboard import DashboardStats, BankListItem
from app.services.dashboard.dashboard_service import DashboardService

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_stats(current_user.id)


@router.get("/banks", response_model=List[BankListItem])
def get_user_banks(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_banks(current_user.id)


@router.delete("/banks/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_bank(
    config_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar un banco de preguntas y sus reactivos asociados.
    """
    service = DashboardService(db)
    if not service.delete_bank(config_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco de preguntas no encontrado o no autorizado"
        )
    return None
