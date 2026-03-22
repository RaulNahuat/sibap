from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.documento import Documento, ProcessingStatus

class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, document_id: int, user_id: Optional[int] = None) -> Optional[Documento]:
        query = self.db.query(Documento).filter(Documento.id == document_id)
        if user_id:
            query = query.filter(Documento.user_id == user_id)
        return query.first()

    def get_by_filename(self, user_id: int, filename: str) -> Optional[Documento]:
        return self.db.query(Documento).filter(
            Documento.user_id == user_id,
            Documento.filename == filename
        ).first()

    def get_user_documents(self, user_id: int, skip: int = 0, limit: int = 10) -> Tuple[List[Documento], int]:
        query = self.db.query(Documento).filter(Documento.user_id == user_id)
        total = query.count()
        documents = query.order_by(Documento.uploaded_at.desc()).offset(skip).limit(limit).all()
        return documents, total

    def create(self, documento: Documento) -> Documento:
        self.db.add(documento)
        self.db.commit()
        self.db.refresh(documento)
        return documento

    def update_status(self, document_id: int, status: ProcessingStatus, content_text: Optional[str] = None, error_message: Optional[str] = None) -> Optional[Documento]:
        documento = self.get_by_id(document_id)
        if not documento:
            return None
        
        documento.status = status
        if content_text is not None:
            documento.content_text = content_text
        if error_message is not None:
            documento.error_message = error_message
            
        self.db.commit()
        self.db.refresh(documento)
        return documento

    def delete(self, documento: Documento) -> None:
        self.db.delete(documento)
        self.db.commit()
