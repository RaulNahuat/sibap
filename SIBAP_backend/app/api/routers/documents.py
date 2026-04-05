from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Query, Body, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import math
import os
import re
from pydantic import BaseModel

from app.services.document_service import DocumentService, get_document_service
from app.services.drive_manager import download_from_drive
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


@router.post(
    "/extract-text",
    response_model=DocumentExtractionResponse
)
async def extract_text(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    is_complex: bool = Form(False),
    current_user: Usuario = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """
    Subir documento para extracción de texto en segundo plano.
    Requiere autenticación.
    """
    if document_service.check_duplicate_document(current_user.id, file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"El documento '{file.filename}' ya existe."
        )
        
    try:
        content = await file.read()
        filename = file.filename
        file_ext = "." + filename.split(".")[-1] if "." in filename else ""
        
        documento = document_service.create_document(
            user_id=current_user.id,
            filename=filename,
            file_type=file_ext,
            status=ProcessingStatus.PENDING
        )
        
        background_tasks.add_task(
            document_service.process_document_background,
            content,
            filename,
            documento.id,
            is_complex
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


class DriveImportRequest(BaseModel):
    drive_url: str
    is_complex: bool = False


@router.post(
    "/from-drive",
    response_model=DocumentExtractionResponse,
    summary="Import a document from a public Google Drive URL"
)
async def import_from_drive(
    background_tasks: BackgroundTasks,
    body: DriveImportRequest,
    current_user: Usuario = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
):
    file_bytes = download_from_drive(body.drive_url)

    _id_match = re.search(r"/file/d/([a-zA-Z0-9_-]{25,})|[?&]id=([a-zA-Z0-9_-]{25,})", body.drive_url)
    file_id = (_id_match.group(1) or _id_match.group(2)) if _id_match else "drive_file"
    filename = f"drive_{file_id}.pdf"

    if document_service.check_duplicate_document(current_user.id, filename):
        raise HTTPException(
            status_code=400,
            detail="Este archivo de Drive ya fue importado anteriormente."
        )

    documento = document_service.create_document(
        user_id=current_user.id,
        filename=filename,
        file_type=".pdf",
        status=ProcessingStatus.PENDING
    )

    background_tasks.add_task(
        document_service.process_document_background,
        file_bytes,
        filename,
        documento.id,
        body.is_complex
    )

    return DocumentExtractionResponse(
        id=documento.id,
        filename=documento.filename,
        file_type=documento.file_type.value,
        characters=0,
        content_text="",
        uploaded_at=documento.uploaded_at
    )

@router.get(
    "",
    response_model=PaginatedDocumentListResponse
)
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
):
    documentos, total = document_service.get_user_documents(
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
            file_type=doc.file_type.value if hasattr(doc.file_type, "value") else doc.file_type,
            characters=len(doc.content_text) if doc.content_text else 0,
            status=doc.status.value if hasattr(doc.status, "value") else doc.status,
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
    document_service: DocumentService = Depends(get_document_service)
):
    documento = document_service.get_document_by_id(document_id, current_user.id)
    
    if not documento:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado"
        )
    
    return DocumentDetailResponse(
        id=documento.id,
        filename=documento.filename,
        file_type=documento.file_type.value if hasattr(documento.file_type, "value") else documento.file_type,
        content_text=documento.content_text,
        status=documento.status.value if hasattr(documento.status, "value") else documento.status,
        error_message=documento.error_message,
        uploaded_at=documento.uploaded_at
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: Usuario = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
):
    success = document_service.delete_document(document_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado"
        )
    
    return {"message": "Documento eliminado exitosamente"}

@router.get(
    "/{document_id}/download",
    response_class=FileResponse,
    summary="Descargar el archivo físico original"
)
def download_original(
    document_id: int,
    current_user: Usuario = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
):
    documento = document_service.get_document_by_id(document_id, current_user.id)
    
    if not documento:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
        
    if not hasattr(documento, 'file_path') or not documento.file_path or not os.path.exists(documento.file_path):
        raise HTTPException(
            status_code=404, 
            detail="El archivo original no está disponible. Posiblemente expiró o era un documento simple."
        )
        
    return FileResponse(
        path=documento.file_path,
        filename=documento.filename,
        media_type='application/octet-stream'
    )
