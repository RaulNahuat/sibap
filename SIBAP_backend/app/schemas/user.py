from pydantic import BaseModel, EmailStr, field_validator
from app.utils.validators import validate_password_strength, validate_name_length
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    name: str
    last_name: str
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Valida que la contraseña sea fuerte"""
        return validate_password_strength(v)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Valida la longitud del nombre"""
        return validate_name_length(v, "nombre")
    
    @field_validator('last_name')
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        """Valida la longitud del apellido"""
        return validate_name_length(v, "apellido")

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    last_name: str
    email: str
    is_active: bool
    created_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # Permite crear desde modelos SQLAlchemy