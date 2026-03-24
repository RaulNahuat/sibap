import os
import tempfile
import logging
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.documento import Documento, FileType, ProcessingStatus

from app.utils.validators import validate_file
from app.utils.text_cleaner import clean_extracted_text
from app.logic.document_parsers.factory import get_text_from_file
from app.repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)

def upload_and_process_document(db: Session, user_id: int, filename: str, content: bytes) -> Documento:
    repo = DocumentRepository(db)
    extension = validate_file(filename, content)

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        raw_text, is_complex = get_text_from_file(extension, temp_path, content)
        clean_text = clean_extracted_text(raw_text)

        if not clean_text.strip():
            raise ValueError("No se pudo extraer contenido legible del documento.")

        final_path = None
        if is_complex:
            storage_dir = os.path.join(os.getcwd(), "app", "storage", "documents")
            os.makedirs(storage_dir, exist_ok=True)
            import uuid
            unique_filename = f"{uuid.uuid4().hex}{extension}"
            final_path = os.path.join(storage_dir, unique_filename)
            with open(final_path, "wb") as f:
                f.write(content)

        documento = create_document(
            db=db,
            user_id=user_id,
            filename=filename,
            file_type=extension,
            content_text=clean_text,
            is_complex=is_complex,
            file_path=final_path,
            status=ProcessingStatus.COMPLETED
        )
        return documento

    except Exception as e:
        logger.error(f"Error crítico procesando documento '{filename}': {e}")
        raise e
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def create_document(
    db: Session, 
    user_id: int, 
    filename: str, 
    file_type: str, 
    content_text: Optional[str] = None, 
    file_path: Optional[str] = None,
    is_complex: bool = False,
    status: ProcessingStatus = ProcessingStatus.PENDING
) -> Documento:

    repo = DocumentRepository(db)
    
    file_type_map = {
        ".pdf": FileType.PDF,
        ".docx": FileType.DOCX,
        ".txt": FileType.TXT,
        ".pptx": FileType.PPTX
    }

    documento = Documento(
        user_id=user_id,
        filename=filename,
        file_type=file_type_map.get(file_type.lower(), FileType.TXT),
        file_path=file_path,
        is_complex=is_complex,
        content_text=content_text,
        status=status
    )

    documento = repo.create(documento)

    if status == ProcessingStatus.COMPLETED and content_text:
        _index_document_rag(documento.id, content_text)

    return documento


def get_user_documents(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> Tuple[List[Documento], int]:
    repo = DocumentRepository(db)
    return repo.get_user_documents(user_id, skip, limit)


def get_document_by_id(db: Session, document_id: int, user_id: int) -> Optional[Documento]:
    repo = DocumentRepository(db)
    return repo.get_by_id(document_id, user_id)


def check_duplicate_document(db: Session, user_id: int, filename: str) -> bool:
    repo = DocumentRepository(db)
    return repo.get_by_filename(user_id, filename) is not None


def update_document_status(
    db: Session, 
    document_id: int, 
    status: ProcessingStatus, 
    content_text: Optional[str] = None, 
    error_message: Optional[str] = None,
    file_path: Optional[str] = None,
    is_complex: Optional[bool] = None
) -> Optional[Documento]:
    repo = DocumentRepository(db)
    documento = repo.update_status(document_id, status, content_text, error_message, file_path, is_complex)
    
    if documento and status == ProcessingStatus.COMPLETED and documento.content_text:
        _index_document_rag(document_id, documento.content_text)

    return documento


def delete_document(db: Session, document_id: int, user_id: int) -> bool:
    repo = DocumentRepository(db)
    documento = repo.get_by_id(document_id, user_id)
    if not documento:
        return False

    try:
        from app.services import vector_service
        vector_service.delete_document_chunks(document_id)
    except Exception as e:
        logger.warning(f"RAG: Error al limpiar vectores del documento {document_id}: {e}")

    repo.delete(documento)
    return True


def _index_document_rag(document_id: int, content_text: str) -> None:
    try:
        from app.services.chunk_service import split_text
        from app.services.embedding_service import get_embeddings
        from app.services import vector_service
        from app.core.config import settings

        if not getattr(settings, "ENABLE_RAG", False):
            logger.debug(f"RAG: Indexación desactivada por configuración para el documento {document_id}.")
            return

        if vector_service.document_has_chunks(document_id):
            return

        chunks = split_text(content_text, chunk_size=600, overlap=100)
        if not chunks:
            logger.warning(f"RAG: No se generaron chunks para el documento {document_id}.")
            return

        model_to_use = getattr(settings, "EMBEDDING_MODEL", None)
        if model_to_use == "paraphrase-multilingual-mpnet-base-v2":
            model_to_use = None
            
        embeddings = get_embeddings(chunks, model_name=model_to_use)
        
        vector_service.add_document_chunks(document_id, chunks, embeddings)
        logger.info(f"RAG: Indexado exitoso para documento {document_id} ({len(chunks)} chunks).")

    except Exception as e:
        logger.error(f"RAG: Fallo no crítico en indexación del documento {document_id}: {e}")