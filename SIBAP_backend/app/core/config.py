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

# Convertir CORS_ORIGINS de string a lista
CORS_ORIGINS: List[str] = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
