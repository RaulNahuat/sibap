from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
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
    BatchUpdateResponse,
    ManualQuestionRequest,
    QuestionStatusResponse,
)
from app.services import question_service, moodle_export_service
from fastapi.responses import PlainTextResponse, Response

router = APIRouter(
    prefix="/api/questions",
    tags=["Questions"]
)

@router.post(
    "/generate",
    response_model=QuestionGenerationResponse,
    status_code=status.HTTP_202_ACCEPTED
)
async def generate_questions(
    request: QuestionGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Crear la configuración inicial (PENDING)
        config = question_service.create_generation_config(
            db=db,
            request=request,
            user_id=current_user.id
        )
        
        # 2. Lanzar la tarea en segundo plano
        request_data = request.model_dump()
        background_tasks.add_task(
            question_service.process_question_generation_task,
            config_id=config.id,
            request_data=request_data,
            user_id=current_user.id
        )
        
        # 3. Responder de inmediato con el ID
        return QuestionGenerationResponse(
            config_id=config.id,
            questions=[] # Inicialmente vacío
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error al iniciar generación: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al iniciar generación: {str(e)}"
        )


@router.get(
    "/status/{config_id}",
    response_model=QuestionStatusResponse,
    status_code=status.HTTP_200_OK
)
def get_generation_status(
    config_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(ConfiguracionGeneracion).join(Documento).filter(
        ConfiguracionGeneracion.id == config_id,
        Documento.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    # Contar cuántas preguntas se han generado ya
    question_count = db.query(Reactivo).filter(Reactivo.config_id == config_id).count()
    
    return QuestionStatusResponse(
        config_id=config.id,
        status=config.status.value,
        question_count=question_count,
        total_requested=config.num_questions,
        error_message=config.error_message
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
    questions = question_service.get_questions_by_config(db, config_id, current_user.id)
    if questions is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco de preguntas no encontrado o no autorizado"
        )
    return questions


@router.post(
    "/bank/{config_id}/add",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED
)
def add_manual_question(
    config_id: int,
    request: ManualQuestionRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reactivo = question_service.add_manual_question(
        db=db,
        config_id=config_id,
        user_id=current_user.id,
        question_text=request.question_text,
        options=request.options
    )
    
    if not reactivo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banco de preguntas no encontrado o no autorizado"
        )

    return reactivo


@router.get("/bank/{config_id}/export/gift", response_class=PlainTextResponse)
def export_questions_gift(
    config_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(ConfiguracionGeneracion).join(Documento).filter(
        ConfiguracionGeneracion.id == config_id,
        Documento.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Banco no encontrado")
        
    content = moodle_export_service.export_to_gift(db, config_id)
    filename = f"banco_{config_id}.txt"
    return PlainTextResponse(
        content, 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/bank/{config_id}/export/xml", response_class=Response)
def export_questions_xml(
    config_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(ConfiguracionGeneracion).join(Documento).filter(
        ConfiguracionGeneracion.id == config_id,
        Documento.user_id == current_user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Banco no encontrado")
        
    content = moodle_export_service.export_to_xml(db, config_id)
    filename = f"banco_{config_id}.xml"
    return Response(
        content=content,
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
