from sqlalchemy.orm import Session
from app.models.documento import Documento, FileType, ProcessingStatus
from typing import List, Optional, Tuple
from sqlalchemy import func

def create_document(
    db: Session,
    user_id: int,
    filename: str,
    file_type: str,
    content_text: Optional[str] = None,
    file_path: Optional[str] = None,
    status: ProcessingStatus = ProcessingStatus.PENDING
) -> Documento:
    """Crear un nuevo documento en la base de datos."""
    
    file_type_map = {
        ".pdf": FileType.PDF,
        ".docx": FileType.DOCX,
        ".txt": FileType.TXT
    }
    
    file_type_enum = file_type_map.get(file_type.lower())
    if not file_type_enum:
        raise ValueError(f"Tipo de archivo no soportado: {file_type}")
    
    documento = Documento(
        user_id=user_id,
        filename=filename,
        file_type=file_type_enum,
        file_path=file_path,
        content_text=content_text,
        status=status
    )
    
    db.add(documento)
    db.commit()
    db.refresh(documento)
    
    return documento


def get_user_documents(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 10
) -> Tuple[List[Documento], int]:
    """Obtener documentos paginados de un usuario."""
    query = db.query(Documento).filter(Documento.user_id == user_id)
    
    total = query.count()
    
    documentos = query.order_by(Documento.uploaded_at.desc())\
                      .offset(skip)\
                      .limit(limit)\
                      .all()
                      
    return documentos, total


def check_duplicate_document(db: Session, user_id: int, filename: str) -> bool:
    """Verificar si ya existe un documento con el mismo nombre para el usuario."""
    return db.query(Documento).filter(
        Documento.user_id == user_id,
        Documento.filename == filename
    ).first() is not None


def update_document_status(
    db: Session, 
    document_id: int, 
    status: ProcessingStatus,
    content_text: Optional[str] = None,
    error_message: Optional[str] = None
) -> Optional[Documento]:
    """Actualizar el estado y contenido de un documento."""
    documento = db.query(Documento).filter(Documento.id == document_id).first()
    
    if not documento:
        return None
        
    documento.status = status
    if content_text is not None:
        documento.content_text = content_text
    if error_message is not None:
        documento.error_message = error_message
        
    db.commit()
    db.refresh(documento)
    return documento


def get_document_by_id(db: Session, document_id: int, user_id: int) -> Optional[Documento]:
    """Obtener un documento específico del usuario."""
    return db.query(Documento).filter(
        Documento.id == document_id,
        Documento.user_id == user_id
    ).first()


def delete_document(db: Session, document_id: int, user_id: int) -> bool:
    """Eliminar un documento del usuario."""
    documento = get_document_by_id(db, document_id, user_id)
    
    if not documento:
        return False
    
    db.delete(documento)
    db.commit()
    
    return True
