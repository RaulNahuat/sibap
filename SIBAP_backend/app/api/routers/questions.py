from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario
from app.models.reactivo import Reactivo
from app.models.configuracion_generacion import ConfiguracionGeneracion
from app.models.documento import Documento
from app.schemas.question import (
    QuestionGenerationRequest, 
    QuestionGenerationResponse, 
    QuestionResponse,
    QuestionUpdateRequest,
    BatchUpdateResponse
)
from app.services import question_service

router = APIRouter(
    prefix="/api/questions",
    tags=["Questions"]
)

@router.post(
    "/generate",
    response_model=QuestionGenerationResponse,
    status_code=status.HTTP_201_CREATED
)
async def generate_questions(
    request: QuestionGenerationRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generar reactivos basados en la configuración proporcionada.
    Optimizada para concurrencia.
    """
    try:
        config, questions = await question_service.generate_questions(
            db=db,
            request=request,
            user_id=current_user.id
        )
        
        return QuestionGenerationResponse(
            config_id=config.id,
            questions=questions
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error al generar las preguntas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar las preguntas: {str(e)}"
        )

@router.post(
    "/{question_id}/regenerate",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK
)
async def regenerate_single_question(
    question_id: int,
    model_name: Optional[str] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerar un único reactivo manteniendo el contexto original.
    Permite especificar el modelo a usar.
    """
    try:
        updated_question = await question_service.regenerate_question(
            db=db,
            question_id=question_id,
            user_id=current_user.id,
            model_name=model_name
        )
        return updated_question
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error al regenerar la pregunta {question_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al regenerar la pregunta: {str(e)}"
        )

@router.put(
    "/batch-update",
    response_model=BatchUpdateResponse,
    status_code=status.HTTP_200_OK
)
def batch_update_questions(
    updates: List[QuestionUpdateRequest],
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar múltiples reactivos (texto, estado, opciones).
    """
    try:
        updates_dicts = [u.model_dump() for u in updates]
        
        updated_items = question_service.update_questions_batch(
            db=db,
            updates=updates_dicts,
            user_id=current_user.id
        )
        
        return BatchUpdateResponse(
            updated_count=len(updated_items),
            message="Preguntas actualizadas correctamente"
        )
    except Exception as e:
        print(f"Error al actualizar las preguntas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar las preguntas: {str(e)}"
        )

@router.get(
    "/bank/{config_id}",
    response_model=List[QuestionResponse],
    status_code=status.HTTP_200_OK
)
def get_questions_by_bank(
    config_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(ConfiguracionGeneracion).join(Documento).filter(
        ConfiguracionGeneracion.id == config_id,
        Documento.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco de preguntas no encontrado o no autorizado"
        )
        
    questions = db.query(Reactivo).filter(Reactivo.config_id == config_id).all()
    return questions
