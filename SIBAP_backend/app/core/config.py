from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    COOKIE_NAME: str
    ENVIRONMENT: str = "development"  # development o production
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Email configuration
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "SIBAP"
    EMAIL_USE_TLS: bool = True
    EMAIL_CONSOLE_MODE: bool = True  # True para desarrollo, False para producción
    
    # Frontend URL for reset links
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Password reset token configuration
    RESET_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"

settings = Settings()

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
COOKIE_NAME = settings.COOKIE_NAME
ENVIRONMENT = settings.ENVIRONMENT

# Refresh token configuration
REFRESH_TOKEN_EXPIRE_DAYS = 30
REFRESH_COOKIE_NAME = "refresh_token"

# Email configuration
EMAIL_HOST = settings.EMAIL_HOST
EMAIL_PORT = settings.EMAIL_PORT
EMAIL_USERNAME = settings.EMAIL_USERNAME
EMAIL_PASSWORD = settings.EMAIL_PASSWORD
EMAIL_FROM = settings.EMAIL_FROM
EMAIL_FROM_NAME = settings.EMAIL_FROM_NAME
EMAIL_USE_TLS = settings.EMAIL_USE_TLS
EMAIL_CONSOLE_MODE = settings.EMAIL_CONSOLE_MODE

# Frontend URL
FRONTEND_URL = settings.FRONTEND_URL

# Password reset token configuration
RESET_TOKEN_EXPIRE_MINUTES = settings.RESET_TOKEN_EXPIRE_MINUTES

# Convertir CORS_ORIGINS de string a lista
CORS_ORIGINS: List[str] = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
