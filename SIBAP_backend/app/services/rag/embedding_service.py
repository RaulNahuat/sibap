import logging
from typing import List
from app.core.config import EMBEDDING_MODEL, EMBEDDING_DIMENSIONALITY, GOOGLE_API_KEY

logger = logging.getLogger(__name__)

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

        for text in texts:
            response = client.models.embed_content(
                model=model_name,
                contents=text,
                config=types.EmbedContentConfig(
                    output_dimensionality=EMBEDDING_DIMENSIONALITY,
                    task_type="RETRIEVAL_DOCUMENT",
                ),
            )
            embeddings.append(response.embeddings[0].values)

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
