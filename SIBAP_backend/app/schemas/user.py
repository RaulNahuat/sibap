from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


from app.utils.validators import (
    validate_password_strength, 
    validate_name_length,

)

"""
Mixins de validaciones
"""
class NameValidationMixin(BaseModel):
    @field_validator('name', check_fields=False)
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_name_length(v, "nombre")
    
    @field_validator('last_name', check_fields=False)
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        return validate_name_length(v, "apellido")


class PasswordValidationMixin(BaseModel):
    @field_validator('password', check_fields=False)
    @classmethod
    def validate_password(cls, v:str) -> str:
        return validate_password_strength(v)

"""
Schemas de usuario
"""
class UserCreate(NameValidationMixin, PasswordValidationMixin):
    name: str
    last_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class UserUpdate(NameValidationMixin):
    name: Optional[str] = None
    last_name: Optional[str] = None

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

class UserLoginResponse(BaseModel):
    id: int
    name: str
    last_name: str
    email: str
    #is_active: bool

    class Config:
        from_attributes = True


class UserDeleteRequest(PasswordValidationMixin):
    password: str

class UserUpdatePassword(PasswordValidationMixin):
    password: str
    new_password: str

    @field_validator('new_password', check_fields=False)
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        from app.utils.validators import validate_password_strength
        return validate_password_strength(v)
