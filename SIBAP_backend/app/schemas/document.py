from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import Optional

MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = [
    ".pdf",
    ".docx",
    ".txt"
]

class DocumentExtractionResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    characters: int
    content_text: str
    uploaded_at: datetime

class DocumentErrorResponse(BaseModel):
    detail: str

class DocumentListResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    characters: int
    status: str
    is_complex: bool = False
    
    # Lo agregamos al schema pero lo podemos ocultar si queremos,
    # el frontend lo recibirá y sabrá qué hacer.
    file_path: Optional[str] = None
    
    @computed_field
    def has_physical_file(self) -> bool:
        return self.file_path is not None

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
    is_complex: bool = False
    
    file_path: Optional[str] = None
    
    @computed_field
    def has_physical_file(self) -> bool:
        return self.file_path is not None

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