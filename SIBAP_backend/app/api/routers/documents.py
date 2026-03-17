from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.services.document_service import upload_and_process_document
from app.services import document_service
from app.schemas.document import (
    DocumentExtractionResponse,
    DocumentListResponse,
    DocumentDetailResponse,
    PaginatedDocumentListResponse
)
from app.models.documento import ProcessingStatus
from app.db.session import get_db
from app.utils.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)


import os
import tempfile
from app.utils.validators import validate_file
from app.utils.text_cleaner import clean_extracted_text
from app.logic.document_parsers.factory import get_text_from_file

def process_document_background(
    file_content: bytes,
    filename: str,
    document_id: int,
    db: Session
):
    """Tarea en segundo plano para procesar el documento usando la nueva arquitectura."""
    try:
        document_service.update_document_status(
            db=db,
            document_id=document_id,
            status=ProcessingStatus.PROCESSING
        )
        
        # 1. Validación de extensión
        extension = validate_file(filename, file_content)

        # 2. Gestión de archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name

        try:
            # 3. Extracción de contenido bruto
            raw_text = get_text_from_file(extension, temp_path, file_content)
            
            # 4. Limpieza profunda del texto
            clean_text = clean_extracted_text(raw_text)

            if not clean_text.strip():
                raise ValueError("No se pudo extraer contenido legible.")

            # 5. Actualización final y disparo de RAG
            document_service.update_document_status(
                db=db,
                document_id=document_id,
                status=ProcessingStatus.COMPLETED,
                content_text=clean_text
            )
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        print(f"Error procesando el documento {document_id}: {e}")
        document_service.update_document_status(
            db=db,
            document_id=document_id,
            status=ProcessingStatus.FAILED,
            error_message=str(e)
        )


@router.post(
    "/extract-text",
    response_model=DocumentExtractionResponse
)
async def extract_text(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subir documento para extracción de texto en segundo plano.
    Requiere autenticación.
    """
    if document_service.check_duplicate_document(db, current_user.id, file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"El documento '{file.filename}' ya existe."
        )
        
    try:
        content = await file.read()
        filename = file.filename
        file_ext = "." + filename.split(".")[-1] if "." in filename else ""
        
        documento = document_service.create_document(
            db=db,
            user_id=current_user.id,
            filename=filename,
            file_type=file_ext,
            status=ProcessingStatus.PENDING
        )
        
        background_tasks.add_task(
            process_document_background,
            content,
            filename,
            documento.id,
            db
        )
        
        return DocumentExtractionResponse(
            id=documento.id,
            filename=documento.filename,
            file_type=documento.file_type.value,
            characters=0,
            content_text="",
            uploaded_at=documento.uploaded_at
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error iniciando carga del documento: {str(e)}"
        )


@router.get(
    "",
    response_model=PaginatedDocumentListResponse
)
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar documentos del usuario con paginación.
    """
    documentos, total = document_service.get_user_documents(
        db, 
        current_user.id,
        skip=skip,
        limit=limit
    )

    pages = math.ceil(total / limit) if limit > 0 else 0
    current_page = (skip // limit) + 1
    
    items = [
        DocumentListResponse(
            id=doc.id,
            filename=doc.filename,
            file_type=doc.file_type.value,
            characters=len(doc.content_text) if doc.content_text else 0,
            status=doc.status.value,
            error_message=doc.error_message,
            uploaded_at=doc.uploaded_at
        )
        for doc in documentos
    ]
    
    return PaginatedDocumentListResponse(
        items=items,
        total=total,
        page=current_page,
        size=limit,
        pages=pages
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetailResponse
)
def get_document(
    document_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documento = document_service.get_document_by_id(db, document_id, current_user.id)
    
    if not documento:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado"
        )
    
    return DocumentDetailResponse(
        id=documento.id,
        filename=documento.filename,
        file_type=documento.file_type.value,
        content_text=documento.content_text,
        status=documento.status.value,
        error_message=documento.error_message,
        uploaded_at=documento.uploaded_at
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = document_service.delete_document(db, document_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado"
        )
    
    return {"message": "Documento eliminado exitosamente"}
