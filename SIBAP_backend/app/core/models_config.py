from enum import Enum
from typing import List, Dict, Any

class AIModelID(str, Enum):
    GEMINI_FLASH = "gemini-flash-latest"
    GEMMA_3 = "gemma-3-27b-it"
    GEMINI_3_FLASH = "gemini-3-flash-preview"

#Modelos disponibles
SUPPORTED_MODELS = [
    {
        "id": AIModelID.GEMINI_FLASH.value,
        "name": "Gemini Flash (Estable)",
        "description": "Modelo balanceado para la mayoría de las tareas pedagógicas.",
        "is_default": True,
        "provider": "Google"
    },
    {
        "id": AIModelID.GEMMA_3.value,
        "name": "Gemma 3 27B (Modelo Abierto)",
        "description": "Modelo optimizado para razonamiento y lenguaje técnico.",
        "is_default": False,
        "provider": "Google"
    },
    {
        "id": AIModelID.GEMINI_3_FLASH.value,
        "name": "Gemini 3 Flash (Vista Previa)",
        "description": "Última tecnología en fase experimental para pruebas avanzadas.",
        "is_default": False,
        "provider": "Google"
    }
]

#Cadenas de respaldo (Fallbacks)
FALLBACK_CHAIN: Dict[str, List[str]] = {
    AIModelID.GEMINI_FLASH.value: [
        AIModelID.GEMINI_FLASH.value
    ],
    AIModelID.GEMMA_3.value: [
        AIModelID.GEMMA_3.value,
        AIModelID.GEMINI_FLASH.value
    ],
    AIModelID.GEMINI_3_FLASH.value: [
        AIModelID.GEMINI_3_FLASH.value,
        AIModelID.GEMINI_FLASH.value
    ]
}

DEFAULT_FALLBACK = [AIModelID.GEMINI_FLASH.value]
