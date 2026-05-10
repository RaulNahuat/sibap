import logging
from typing import List
from app.core.config import EMBEDDING_MODEL, EMBEDDING_DIMENSIONALITY, GOOGLE_API_KEY

logger = logging.getLogger(__name__)

from tenacity import retry, stop_after_attempt, wait_exponential
import time

# Función para obtener los embeddings de los textos (chunks de los documentos)
def get_embeddings(
    texts: List[str],
    model_name: str = EMBEDDING_MODEL,
    batch_size: int = 32,
    show_progress: bool = False,
) -> List[List[float]]:
    if not texts:
        return []

    try:
        from google import genai
        from google.genai import types

        if not GOOGLE_API_KEY:
            raise ValueError(
                "embedding_service: GOOGLE_API_KEY no configurada. "
                "Verifica el archivo .env."
            )

        client = genai.Client(api_key=GOOGLE_API_KEY)

        logger.info(
            f"embedding_service: generando embeddings para {len(texts)} textos "
            f"con {model_name}..."
        )

        embeddings: List[List[float]] = []

        # Función interna con reintentos para manejar el límite de cuota (Error 429)
        @retry(
            stop=stop_after_attempt(5),
            wait=wait_exponential(multiplier=2, min=2, max=20),
            reraise=True
        )
        def _get_single_embedding(text_chunk: str) -> List[float]:
            resp = client.models.embed_content(
                model=model_name,
                contents=text_chunk,
                config=types.EmbedContentConfig(
                    output_dimensionality=EMBEDDING_DIMENSIONALITY,
                    task_type="RETRIEVAL_DOCUMENT",
                ),
            )
            return resp.embeddings[0].values

        for i, text in enumerate(texts):
            # Agregar un pequeño delay para no golpear el límite de 15 RPM de la capa gratuita
            if i > 0:
                time.sleep(2) 
                
            embedding = _get_single_embedding(text)
            embeddings.append(embedding)

        logger.info(
            f"embedding_service: {len(embeddings)} embeddings generados "
            f"(dim={EMBEDDING_DIMENSIONALITY})."
        )
        return embeddings

    except Exception as e:
        logger.error(f"embedding_service: error generando embeddings: {e}")
        raise


#Función obtener el embedding de la consulta del usuario
def get_query_embedding(
    query: str,
    model_name: str = EMBEDDING_MODEL,
) -> List[float]:
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GOOGLE_API_KEY)

        response = client.models.embed_content(
            model=model_name,
            contents=query,
            config=types.EmbedContentConfig(
                output_dimensionality=EMBEDDING_DIMENSIONALITY,
                task_type="RETRIEVAL_QUERY",
            ),
        )
        return response.embeddings[0].values

    except Exception as e:
        logger.error(f"embedding_service: error generando query embedding: {e}")
        raise
