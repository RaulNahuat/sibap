from pydantic import BaseModel
from datetime import datetime
from typing import Optional

MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = [
    ".pdf",
    ".docx",
    ".txt"
]

# Response cuando se extrae texto
class DocumentExtractionResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    characters: int
    content_text: str
    uploaded_at: datetime

# Response de error
class DocumentErrorResponse(BaseModel):
    detail: str

# Para listar documentos
class DocumentListResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    characters: int
    status: str
    error_message: Optional[str] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class DocumentDetailResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    content_text: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class PaginatedDocumentListResponse(BaseModel):
    items: list[DocumentListResponse]
    total: int
    page: int
    size: int
    pages: int