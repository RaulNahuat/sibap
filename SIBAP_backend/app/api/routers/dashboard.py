from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from app.db.session import get_db
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario
from app.models.documento import Documento
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.reactivo import Reactivo
from app.schemas.dashboard import DashboardStats, RecentActivityItem, BankListItem

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_configs_query = (
        db.query(ConfiguracionGeneracion)
        .join(Documento)
        .filter(Documento.user_id == current_user.id)
    )
    
    total_banks = user_configs_query.count()

    #Obtener total de reactivos + validados + no validados + en proceso
    reactivos_query = (
        db.query(Reactivo)
        .join(ConfiguracionGeneracion)
        .join(Documento)
        .filter(Documento.user_id == current_user.id)
    )
    
    total_reactivos = reactivos_query.count()
    validated_count = reactivos_query.filter(Reactivo.is_validated == True).count()
    
    overall_validated_percentage = 0.0
    if total_reactivos > 0:
        overall_validated_percentage = (validated_count / total_reactivos) * 100
        
    pending_banks_count = 0
    
    stats_by_config = (
        db.query(
            Reactivo.config_id,
            func.count(Reactivo.id).label("total"),
            func.sum(func.cast(Reactivo.is_validated, __import__('sqlalchemy').Integer)).label("validated")
        )
        .join(ConfiguracionGeneracion)
        .join(Documento)
        .filter(Documento.user_id == current_user.id)
        .group_by(Reactivo.config_id)
        .all()
    )
    
    for _conf_id, total, val in stats_by_config:
        if val < total:
            pending_banks_count += 1
            
    recent_configs = (
        user_configs_query
        .order_by(desc(ConfiguracionGeneracion.created_at))
        .limit(5)
        .all()
    )
    
    activity_items = []
    for config in recent_configs:
        
        c_reactivos = db.query(Reactivo).filter(Reactivo.config_id == config.id).all()
        c_total = len(c_reactivos)
        c_val = sum(1 for r in c_reactivos if r.is_validated)
        
        c_percentage = 0.0
        if c_total > 0:
            c_percentage = (c_val / c_total) * 100
            
        status_str = "pending"
        if c_total > 0 and c_val == c_total:
            status_str = "completed"
        elif c_total == 0:
            status_str = "draft"
            
        activity_items.append(RecentActivityItem(
            id=config.id,
            name=f"Banco: {config.topic}",
            subject=config.subject,
            date=config.created_at,
            reactives_count=c_total,
            status=status_str,
            validated_percentage=c_percentage
        ))

    return DashboardStats(
        total_banks=total_banks,
        total_reactivos=total_reactivos,
        validated_percentage=overall_validated_percentage,
        pending_banks=pending_banks_count,
        recent_activity=activity_items
    )

@router.get("/banks", response_model=List[BankListItem])
def get_user_banks(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_configs = (
        db.query(ConfiguracionGeneracion)
        .join(Documento)
        .filter(Documento.user_id == current_user.id)
        .order_by(desc(ConfiguracionGeneracion.created_at))
        .all()
    )
    
    banks = []
    for config in user_configs:
        c_reactivos = db.query(Reactivo).filter(Reactivo.config_id == config.id).all()
        total = len(c_reactivos)
        validated = sum(1 for r in c_reactivos if r.is_validated)
        
        progress = 0.0
        if total > 0:
            progress = (validated / total) * 100
        
        is_completed = (total > 0 and validated == total)
            
        banks.append(BankListItem(
            id=config.id,
            name=f"Banco: {config.topic}",
            subject=config.subject,
            difficulty=config.difficulty.value,
            created_at=config.created_at,
            totalQuestions=total,
            validatedQuestions=validated,
            isCompleted=is_completed,
            progressPercentage=progress
        ))
    
    return banks

@router.delete("/banks/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_bank(
    config_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar un banco de preguntas y sus reactivos asociados.
    """
    config = (
        db.query(ConfiguracionGeneracion)
        .join(Documento)
        .filter(
            ConfiguracionGeneracion.id == config_id,
            Documento.user_id == current_user.id
        )
        .first()
    )
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="Banco de preguntas no encontrado o no autorizado"
        )
        
    db.delete(config)
    db.commit()
    return None

