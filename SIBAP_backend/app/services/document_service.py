import os
import tempfile
import logging
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

# Importaciones de modelos y enums
from app.models.documento import Documento, FileType, ProcessingStatus

# Importaciones de la nueva arquitectura refactorizada
from app.utils.validators import validate_file
from app.utils.text_cleaner import clean_extracted_text
from app.logic.document_parsers.factory import get_text_from_file

# Configuración de logging
logger = logging.getLogger(__name__)

# ==========================================
# 1. ORQUESTACIÓN DE PROCESAMIENTO
# ==========================================

def upload_and_process_document(db: Session, user_id: int, filename: str, content: bytes) -> Documento:
    """
    Coordina el flujo completo: Validación -> Extracción -> Limpieza -> Guardado -> RAG.
    Este es el punto de entrada principal para tu API de carga.
    """
    
    # 1. Validación de extensión y tamaño
    extension = validate_file(filename, content)

    # 2. Gestión de archivo temporal para los motores de extracción
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        # 3. Extracción de contenido bruto (según el tipo de archivo)
        raw_text = get_text_from_file(extension, temp_path, content)
        
        # 4. Limpieza profunda del texto (NLP / RegEx / Normalización)
        clean_text = clean_extracted_text(raw_text)

        if not clean_text.strip():
            raise ValueError("No se pudo extraer contenido legible del documento.")

        # 5. Persistencia en base de datos e indexación RAG
        documento = create_document(
            db=db,
            user_id=user_id,
            filename=filename,
            file_type=extension,
            content_text=clean_text,
            status=ProcessingStatus.COMPLETED
        )
        
        return documento

    except Exception as e:
        logger.error(f"Error crítico procesando documento '{filename}': {e}")
        raise e
    finally:
        # Limpieza de archivos temporales pase lo que pase
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ==========================================
# 2. OPERACIONES CRUD (BASE DE DATOS)
# ==========================================

def create_document(
    db: Session, 
    user_id: int, 
    filename: str, 
    file_type: str, 
    content_text: Optional[str] = None, 
    file_path: Optional[str] = None,
    status: ProcessingStatus = ProcessingStatus.PENDING
) -> Documento:
    """Crea el registro en la BD y dispara el RAG si está COMPLETED."""
    
    file_type_map = {
        ".pdf": FileType.PDF,
        ".docx": FileType.DOCX,
        ".txt": FileType.TXT
    }

    documento = Documento(
        user_id=user_id,
        filename=filename,
        file_type=file_type_map.get(file_type.lower(), FileType.TXT),
        file_path=file_path,
        content_text=content_text,
        status=status
    )

    db.add(documento)
    db.commit()
    db.refresh(documento)

    # Disparar indexación si el documento ya viene procesado
    if status == ProcessingStatus.COMPLETED and content_text:
        _index_document_rag(documento.id, content_text)

    return documento


def get_user_documents(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> Tuple[List[Documento], int]:
    """Obtiene lista de documentos paginada."""
    query = db.query(Documento).filter(Documento.user_id == user_id)
    total = query.count()
    documentos = query.order_by(Documento.uploaded_at.desc()).offset(skip).limit(limit).all()
    return documentos, total


def get_document_by_id(db: Session, document_id: int, user_id: int) -> Optional[Documento]:
    """Obtiene un documento específico validando la propiedad del usuario."""
    return db.query(Documento).filter(
        Documento.id == document_id,
        Documento.user_id == user_id
    ).first()


def check_duplicate_document(db: Session, user_id: int, filename: str) -> bool:
    """Evita subir archivos duplicados por nombre para el mismo usuario."""
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
    """Actualiza estado y activa RAG si el cambio es a COMPLETED."""
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

    if status == ProcessingStatus.COMPLETED and documento.content_text:
        _index_document_rag(document_id, documento.content_text)

    return documento


def delete_document(db: Session, document_id: int, user_id: int) -> bool:
    """Borra documento de BD y limpia sus chunks del Vector Store."""
    documento = get_document_by_id(db, document_id, user_id)
    if not documento:
        return False

    try:
        from app.services import vector_service
        vector_service.delete_document_chunks(document_id)
    except Exception as e:
        logger.warning(f"RAG: Error al limpiar vectores del documento {document_id}: {e}")

    db.delete(documento)
    db.commit()
    return True


# ==========================================
# 3. PIPELINE RAG (INDEXACIÓN)
# ==========================================

def _index_document_rag(document_id: int, content_text: str) -> None:
    """
    Fragmenta, genera embeddings y guarda en ChromaDB/Pinecone.
    Diseñado para fallar silenciosamente sin interrumpir la experiencia del usuario.
    """
    try:
        from app.services.chunk_service import split_text
        from app.services.embedding_service import get_embeddings
        from app.services import vector_service
        from app.core.config import EMBEDDING_MODEL

        # Evitar duplicidad en el vector store
        if vector_service.document_has_chunks(document_id):
            return

        # 1. Chunking (600 chars con solapamiento)
        chunks = split_text(content_text, chunk_size=600, overlap=100)
        if not chunks:
            logger.warning(f"RAG: No se generaron chunks para el documento {document_id}.")
            return

        # 2. Embeddings
        embeddings = get_embeddings(chunks, model_name=EMBEDDING_MODEL)
        
        # 3. Almacenamiento Vectorial
        vector_service.add_document_chunks(document_id, chunks, embeddings)
        logger.info(f"RAG: Indexado exitoso para documento {document_id} ({len(chunks)} chunks).")

    except Exception as e:
        logger.error(f"RAG: Fallo no crítico en indexación del documento {document_id}: {e}")