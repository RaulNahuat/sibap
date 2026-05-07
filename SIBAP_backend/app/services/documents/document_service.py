import os
import tempfile
import logging
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import Depends

from app.db.session import get_db
from app.models.documento import Documento, FileType, ProcessingStatus

from app.utils.validators import validate_file
from app.utils.text_cleaner import clean_extracted_text
from app.logic.document_parsers.factory import get_text_from_file
from app.repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self, repository: DocumentRepository):
        self.repo = repository

    def create_document(
        self,
        user_id: int, 
        filename: str, 
        file_type: str, 
        content_text: Optional[str] = None, 
        file_path: Optional[str] = None,
        is_complex: bool = False,
        status: ProcessingStatus = ProcessingStatus.PENDING
    ) -> Documento:
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

        documento = self.repo.create(documento)

        if status == ProcessingStatus.COMPLETED and content_text:
            self._index_document_rag(documento.id, content_text)

        return documento


    def process_document_background(
        self,
        file_content: bytes,
        filename: str,
        document_id: int,
        user_is_complex: bool = False
    ):
        """Tarea en segundo plano para procesar el documento."""
        try:
            self.update_document_status(
                document_id=document_id,
                status=ProcessingStatus.PROCESSING
            )

            extension = validate_file(filename, file_content)

            with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name

            try:
                raw_text, is_complex = get_text_from_file(extension, temp_path, file_content)
                clean_text = clean_extracted_text(raw_text)

                if not clean_text.strip():
                    raise ValueError("No se pudo extraer contenido legible.")

                final_path = None
                is_final_complex = user_is_complex or is_complex

                self.update_document_status(
                    document_id=document_id,
                    status=ProcessingStatus.COMPLETED,
                    content_text=clean_text,
                    is_complex=is_final_complex,
                    file_path=final_path
                )
                
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        except Exception as e:
            logger.error(f"Error procesando el documento {document_id}: {e}")
            self.update_document_status(
                document_id=document_id,
                status=ProcessingStatus.FAILED,
                error_message=str(e)
            )


    def upload_and_process_document(self, user_id: int, filename: str, content: bytes) -> Documento:
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

            documento = self.create_document(
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


    def get_user_documents(self, user_id: int, skip: int = 0, limit: int = 10) -> Tuple[List[Documento], int]:
        return self.repo.get_user_documents(user_id, skip, limit)


    def get_document_by_id(self, document_id: int, user_id: int) -> Optional[Documento]:
        return self.repo.get_by_id(document_id, user_id)


    def check_duplicate_document(self, user_id: int, filename: str) -> bool:
        return self.repo.get_by_filename(user_id, filename) is not None


    def update_document_status(
        self, 
        document_id: int, 
        status: ProcessingStatus, 
        content_text: Optional[str] = None, 
        error_message: Optional[str] = None,
        file_path: Optional[str] = None,
        is_complex: Optional[bool] = None
    ) -> Optional[Documento]:
        documento = self.repo.update_status(document_id, status, content_text, error_message, file_path, is_complex)
        
        if documento and status == ProcessingStatus.COMPLETED and documento.content_text:
            self._index_document_rag(document_id, documento.content_text)

        return documento


    def delete_document(self, document_id: int, user_id: int) -> bool:
        documento = self.repo.get_by_id(document_id, user_id)
        if not documento:
            return False

        try:
            from app.services.rag import vector_service
            vector_service.delete_document_chunks(document_id)
        except Exception as e:
            logger.warning(f"RAG: Error al limpiar vectores del documento {document_id}: {e}")

        self.repo.delete(documento)
        return True


    def _index_document_rag(self, document_id: int, content_text: str) -> None:
        try:
            from app.services.rag.chunk_service import split_text
            from app.services.rag.embedding_service import get_embeddings
            from app.services.rag import vector_service
            from app.core.config import settings, EMBEDDING_MODEL

            if not getattr(settings, "ENABLE_RAG", False):
                logger.debug(f"RAG: Indexación desactivada por configuración para el documento {document_id}.")
                return

            if vector_service.document_has_chunks(document_id):
                return

            chunks = split_text(content_text, chunk_size=1000, overlap=150)
            if not chunks:
                logger.warning(f"RAG: No se generaron chunks para el documento {document_id}.")
                return

            model_to_use = getattr(settings, "EMBEDDING_MODEL", EMBEDDING_MODEL)
                
            embeddings = get_embeddings(chunks, model_name=model_to_use)
            
            vector_service.add_document_chunks(document_id, chunks, embeddings)
            logger.info(f"RAG: Indexado exitoso para documento {document_id} ({len(chunks)} chunks).")

        except Exception as e:
            logger.error(f"RAG: Fallo no crítico en indexación del documento {document_id}: {e}")


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    repo = DocumentRepository(db)
    return DocumentService(repo)