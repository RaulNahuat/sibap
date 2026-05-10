from pydantic_settings import BaseSettings
from typing import List
from app.core.models_config import AIModelID, SUPPORTED_MODELS

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    COOKIE_NAME: str
    ENVIRONMENT: str = "development" #development o production
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000"
    
    # Configuración de correo electrónico
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "SIBAP"
    EMAIL_USE_TLS: bool = True
    EMAIL_CONSOLE_MODE: bool = True  # True para desarrollo, False para producción

    # URL del frontend para enlaces de restablecimiento
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Configuración del token de restablecimiento de contraseña
    RESET_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Configuración de IA
    GOOGLE_API_KEY: str = ""
    GOOGLE_AI_MODEL: str = AIModelID.GEMINI_FLASH.value
    EMBEDDING_DIMENSIONALITY: int = 3072

    # Configuración de RAG
    ENABLE_RAG: bool = True
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    ANONYMIZED_TELEMETRY: str = "False"

    class Config:
        env_file = ".env"

settings = Settings()

# Configuración de JWT y Core
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
COOKIE_NAME = settings.COOKIE_NAME
ENVIRONMENT = settings.ENVIRONMENT

# Configuración del token de refresco
REFRESH_TOKEN_EXPIRE_DAYS = 30
REFRESH_COOKIE_NAME = "refresh_token"

# Configuración del token de restablecimiento de contraseña
RESET_TOKEN_EXPIRE_MINUTES = settings.RESET_TOKEN_EXPIRE_MINUTES

# Configuración de IA
GOOGLE_API_KEY = settings.GOOGLE_API_KEY
GOOGLE_AI_MODEL = settings.GOOGLE_AI_MODEL
EMBEDDING_DIMENSIONALITY = settings.EMBEDDING_DIMENSIONALITY

# Configuración de RAG
ENABLE_RAG = settings.ENABLE_RAG
CHROMA_PERSIST_DIR = settings.CHROMA_PERSIST_DIR
EMBEDDING_MODEL = settings.EMBEDDING_MODEL

# Configuración de correo electrónico
EMAIL_HOST = settings.EMAIL_HOST
EMAIL_PORT = settings.EMAIL_PORT
EMAIL_USERNAME = settings.EMAIL_USERNAME
EMAIL_PASSWORD = settings.EMAIL_PASSWORD
EMAIL_FROM = settings.EMAIL_FROM
EMAIL_FROM_NAME = settings.EMAIL_FROM_NAME
EMAIL_USE_TLS = settings.EMAIL_USE_TLS
EMAIL_CONSOLE_MODE = settings.EMAIL_CONSOLE_MODE

# Configuración de Frontend y CORS
FRONTEND_URL = settings.FRONTEND_URL
CORS_ORIGINS: List[str] = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
