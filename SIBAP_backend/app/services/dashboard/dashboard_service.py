from typing import List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.models.reactivo import Reactivo
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.documento import Documento
from app.repositories.question_repository import QuestionRepository
from app.schemas.dashboard import DashboardStats, RecentActivityItem, BankListItem

class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.q_repo = QuestionRepository(db)


    def get_stats(self, user_id: int) -> DashboardStats:
        user_configs_query = (
            self.db.query(ConfiguracionGeneracion)
            .options(
                joinedload(ConfiguracionGeneracion.tema_obj),
                joinedload(ConfiguracionGeneracion.materia_obj)
            )
            .join(Documento)
            .filter(Documento.user_id == user_id)
        )
        
        total_banks = user_configs_query.count()

        reactivos_query = (
            self.db.query(Reactivo)
            .join(ConfiguracionGeneracion)
            .join(Documento)
            .filter(Documento.user_id == user_id)
        )
        
        total_reactivos = reactivos_query.count()
        validated_count = reactivos_query.filter(Reactivo.is_validated == True).count()
        
        overall_validated_percentage = (validated_count / total_reactivos * 100) if total_reactivos > 0 else 0.0
            
        pending_banks_count = 0
        stats_by_config = (
            self.db.query(
                Reactivo.config_id,
                func.count(Reactivo.id).label("total"),
                func.sum(func.cast(Reactivo.is_validated, __import__('sqlalchemy').Integer)).label("validated")
            )
            .join(ConfiguracionGeneracion)
            .join(Documento)
            .filter(Documento.user_id == user_id)
            .group_by(Reactivo.config_id)
            .all()
        )
        
        for _conf_id, total, val in stats_by_config:
            if val < total:
                pending_banks_count += 1
                
        recent_configs = user_configs_query.order_by(desc(ConfiguracionGeneracion.created_at)).limit(5).all()
        
        activity_items = []
        for config in recent_configs:
            c_reactivos = self.q_repo.get_reactivos_by_config(config.id)
            c_total = len(c_reactivos)
            c_val = sum(1 for r in c_reactivos if r.is_validated)
            c_percentage = (c_val / c_total * 100) if c_total > 0 else 0.0
                
            status_str = "pending"
            if c_total > 0 and c_val == c_total:
                status_str = "completed"
            elif c_total == 0:
                status_str = "draft"
                
            activity_items.append(RecentActivityItem(
                id=config.id,
                name=f"Banco: {config.tema_obj.nombre if config.tema_obj else 'Sin tema'}",
                subject=config.materia_obj.nombre if config.materia_obj else 'Sin materia',
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


    def get_banks(self, user_id: int) -> List[BankListItem]:
        user_configs = (
            self.db.query(ConfiguracionGeneracion)
            .options(
                joinedload(ConfiguracionGeneracion.tema_obj),
                joinedload(ConfiguracionGeneracion.materia_obj)
            )
            .join(Documento)
            .filter(Documento.user_id == user_id)
            .order_by(desc(ConfiguracionGeneracion.created_at))
            .all()
        )
        
        banks = []
        for config in user_configs:
            c_reactivos = self.q_repo.get_reactivos_by_config(config.id)
            total = len(c_reactivos)
            validated = sum(1 for r in c_reactivos if r.is_validated)
            progress = (validated / total * 100) if total > 0 else 0.0
            
            banks.append(BankListItem(
                id=config.id,
                name=f"Banco: {config.tema_obj.nombre if config.tema_obj else 'Sin tema'}",
                subject=config.materia_obj.nombre if config.materia_obj else 'Sin materia',
                difficulty=config.difficulty.value,
                created_at=config.created_at,
                totalQuestions=total,
                validatedQuestions=validated,
                isCompleted=(total > 0 and validated == total),
                progressPercentage=progress
            ))
        return banks


    def delete_bank(self, config_id: int, user_id: int) -> bool:
        config = self.q_repo.get_config_by_id(config_id)
        if not config or config.documento.user_id != user_id:
            return False
        self.q_repo.delete_config(config)
        return True
