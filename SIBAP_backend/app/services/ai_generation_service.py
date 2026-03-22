import json
import logging
import re
from typing import List, Any
from google import genai
from google.genai import types
from app.core.config import GOOGLE_API_KEY

logger = logging.getLogger(__name__)

class AiGenerationService:
    def __init__(self, api_key: str = GOOGLE_API_KEY):
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key) if api_key else None

    def _extract_json(self, text: str):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                json_str = text[start:end+1]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
            
        raise ValueError("No se pudo extraer un JSON válido de la respuesta de la IA.")

    async def generate_content_json(self, model: str, prompt: str) -> Any:
        if not self.client:
            raise ValueError("GOOGLE_API_KEY no configurada.")

        try:
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
            
        except Exception as e:
            logger.warning(f"Error generando contenido con {model}: {e}")
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=prompt + "\n\nIMPORTANTE: Responde ÚNICAMENTE con el JSON raw.",
                config=types.GenerateContentConfig(response_mime_type="text/plain")
            )
            return self._extract_json(response.text)
