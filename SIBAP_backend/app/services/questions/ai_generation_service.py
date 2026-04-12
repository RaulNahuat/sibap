import json
import logging
import re
from typing import List, Any
from google import genai
from google.genai import types
from app.core.config import GOOGLE_API_KEY

logger = logging.getLogger(__name__)

_VALID_JSON_ESCAPES = set('"\\/ bfnrtu\n\r')


def _sanitize_json_str(text: str) -> str:
    result = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == '\\':
            if i + 1 < n:
                nxt = text[i + 1]
                if nxt in _VALID_JSON_ESCAPES:
                    result.append(ch)
                    result.append(nxt)
                    i += 2
                else:
                    result.append('\\')
                    result.append('\\')
                    i += 1
            else:
                result.append('\\')
                result.append('\\')
                i += 1
        else:
            result.append(ch)
            i += 1
    return ''.join(result)


import asyncio

FALLBACK_CHAIN = {
    # Si falla pro, intenta con flash
    "gemini-1.5-pro": ["gemini-1.5-pro", "gemini-1.5-flash"],
    "gemini-2.5-pro": ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
    # Si falla flash, podría intentar con pro o solo reintentar (aquí usamos retry en el mismo si no hay alternativas más rápidas)
    "gemini-1.5-flash": ["gemini-1.5-flash", "gemini-1.5-pro"],
    "gemini-2.5-flash": ["gemini-2.5-flash", "gemini-1.5-flash"]
}

DEFAULT_FALLBACK = ["gemini-1.5-flash", "gemini-1.5-pro"]

class AiGenerationService:
    def __init__(self, api_key: str = GOOGLE_API_KEY):
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key) if api_key else None

    def _extract_json(self, text: str):
        try:
            return json.loads(_sanitize_json_str(text))
        except json.JSONDecodeError:
            pass

        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            try:
                return json.loads(_sanitize_json_str(match.group(1)))
            except json.JSONDecodeError:
                pass

        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                json_str = text[start:end+1]
                return json.loads(_sanitize_json_str(json_str))
        except json.JSONDecodeError:
            pass
            
        raise ValueError("No se pudo extraer un JSON válido de la respuesta de la IA.")

    async def _attempt_generation_single_model(self, model: str, prompt: str) -> Any:
        """Intenta generar contenido con un modelo específico, incluyendo fallback interno a texto plano."""
        try:
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(_sanitize_json_str(response.text))
            
        except Exception as e:
            logger.warning(f"Error generando contenido con {model} en modo JSON: {e}")
            # Si el error fue por formato o filtro, intentamos en texto plano como último recurso para este modelo
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=prompt + "\n\nIMPORTANTE: Responde ÚNICAMENTE con el crudo o raw array JSON, nada más.",
                config=types.GenerateContentConfig(response_mime_type="text/plain")
            )
            return self._extract_json(response.text)

    async def generate_content_json(self, model: str, prompt: str) -> Any:
        if not self.client:
            raise ValueError("GOOGLE_API_KEY no configurada.")

        models_to_try = FALLBACK_CHAIN.get(model, [model] + DEFAULT_FALLBACK)
        
        # Eliminar duplicados manteniendo orden en caso de configuraciones raras
        models_to_try = list(dict.fromkeys(models_to_try))

        ultima_excepcion = None
        
        for idx, current_model in enumerate(models_to_try):
            try:
                if idx > 0:
                    logger.info(f"Iniciando intento de fallback usando modelo: {current_model}")
                    await asyncio.sleep(1.5)  # Breve pausa antes del reintento (backoff)
                    
                result = await self._attempt_generation_single_model(current_model, prompt)
                return result
                
            except Exception as e:
                error_msg = str(e).lower()
                logger.error(f"El modelo {current_model} falló al generar: {error_msg}")
                ultima_excepcion = e
                
                # Verificamos si es un error de API que amerita reintento (no cuesta tokens)
                # 429: Too Many Requests / Quota / Rate limit
                # 50X: Server Errors (500, 502, 503, 504)
                retriable_keywords = [
                    "429", "500", "502", "503", "504", 
                    "rate limit", "quota", "internal error", 
                    "server error", "timeout", "overloaded"
                ]
                
                is_retriable_api_error = any(kw in error_msg for kw in retriable_keywords)
                
                if not is_retriable_api_error:
                    logger.warning("Abortando cadena de fallback. El error es de parseo JSON o filtro de seguridad, evitando gasto innecesario de tokens.")
                    raise e  # Abortamos inmediatamente
                
        # Si llegamos aquí, todos los modelos de la cadena fallaron
        raise ValueError(f"Todos los modelos de respaldo fallaron. Error final: {ultima_excepcion}")
