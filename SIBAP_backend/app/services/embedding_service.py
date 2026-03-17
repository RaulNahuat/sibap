"""
embedding_service.py
--------------------
Genera embeddings vectoriales usando la API de Google (text-embedding-004).

Ventajas sobre modelo local:
  - Sin PyTorch (~2.5 GB ahorro en servidor)
  - Embeddings de mayor calidad (3072 dims, reducible a 768)
  - Reutiliza la google-genai ya instalada en el proyecto
  - Costo: ~$0.00001 / chunk (prácticamente cero)

Dimensión de salida: 768 (configurado via output_dimensionality para
mantener compatibilidad con ChromaDB y eficiencia de búsqueda).
"""

import logging
from typing import List

logger = logging.getLogger(__name__)

# Modelo de embeddings de Google
_GOOGLE_EMBEDDING_MODEL = "models/text-embedding-004"

# Dimensión de salida (text-embedding-004 soporta hasta 3072, usamos 768 para eficiencia)
_OUTPUT_DIMENSIONALITY = 768


def get_embeddings(
    texts: List[str],
    model_name: str = _GOOGLE_EMBEDDING_MODEL,  # parámetro mantenido por compatibilidad
    batch_size: int = 32,
    show_progress: bool = False,
) -> List[List[float]]:
    """
    Genera embeddings para una lista de textos usando la API de Google.

    Args:
        texts:      Lista de strings a embeddear.
        model_name: Ignorado (siempre usa text-embedding-004). Presente por compatibilidad.
        batch_size: No aplicable — la API de Google maneja el batching internamente.
        show_progress: No aplicable.

    Returns:
        Lista de vectores (list[float]) de 768 dimensiones, uno por texto.

    Raises:
        ImportError: Si google-genai no está instalado (no debería ocurrir).
        Exception:   Si la API key no está configurada o hay error de red.
    """
    if not texts:
        return []

    try:
        from google import genai
        from google.genai import types
        from app.core.config import GOOGLE_API_KEY

        if not GOOGLE_API_KEY:
            raise ValueError(
                "embedding_service: GOOGLE_API_KEY no configurada. "
                "Verifica el archivo .env."
            )

        client = genai.Client(api_key=GOOGLE_API_KEY)

        logger.info(
            f"embedding_service: generando embeddings para {len(texts)} textos "
            f"con {_GOOGLE_EMBEDDING_MODEL}..."
        )

        embeddings: List[List[float]] = []

        for text in texts:
            response = client.models.embed_content(
                model=_GOOGLE_EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(
                    output_dimensionality=_OUTPUT_DIMENSIONALITY,
                    task_type="RETRIEVAL_DOCUMENT",
                ),
            )
            embeddings.append(response.embeddings[0].values)

        logger.info(
            f"embedding_service: {len(embeddings)} embeddings generados "
            f"(dim={_OUTPUT_DIMENSIONALITY})."
        )
        return embeddings

    except Exception as e:
        logger.error(f"embedding_service: error generando embeddings: {e}")
        raise


def get_query_embedding(
    query: str,
    model_name: str = _GOOGLE_EMBEDDING_MODEL,  # parámetro mantenido por compatibilidad
) -> List[float]:
    """
    Genera el embedding de una consulta usando task_type RETRIEVAL_QUERY.

    Google diferencia entre embeddings de documentos (RETRIEVAL_DOCUMENT)
    y de consultas (RETRIEVAL_QUERY) para mejor calidad de búsqueda.

    Args:
        query:      Texto de la consulta del usuario.
        model_name: Ignorado. Presente por compatibilidad con vector_service.

    Returns:
        Vector de 768 dimensiones como list[float].
    """
    try:
        from google import genai
        from google.genai import types
        from app.core.config import GOOGLE_API_KEY

        client = genai.Client(api_key=GOOGLE_API_KEY)

        response = client.models.embed_content(
            model=_GOOGLE_EMBEDDING_MODEL,
            contents=query,
            config=types.EmbedContentConfig(
                output_dimensionality=_OUTPUT_DIMENSIONALITY,
                task_type="RETRIEVAL_QUERY",
            ),
        )
        return response.embeddings[0].values

    except Exception as e:
        logger.error(f"embedding_service: error generando query embedding: {e}")
        raise
