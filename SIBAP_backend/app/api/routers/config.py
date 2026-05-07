from fastapi import APIRouter
from app.core.models_config import SUPPORTED_MODELS

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/ai-models")
async def get_ai_models():
    """
    Retorna la lista de modelos de IA soportados con sus metadatos.
    Utilizado por el frontend para construir el selector de modelos.
    """
    return SUPPORTED_MODELS
