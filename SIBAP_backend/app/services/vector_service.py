"""
vector_service.py
-----------------
Interfaz con ChromaDB para almacenamiento y recuperación semántica de chunks.

Características:
  - Persistencia local en disco (CHROMA_PERSIST_DIR del .env)
  - Colección única de sistema: "sibap_chunks"
  - Metadata por chunk: document_id, chunk_index, texto
  - Filtrado por document_ids en búsqueda (aislamiento por usuario implícito)
  - Guard de idempotencia: no re-indexa documentos ya procesados
"""

import logging
import os
from typing import List, Optional

logger = logging.getLogger(__name__)

# Nombre de la colección ChromaDB compartida por todo el sistema
_COLLECTION_NAME = "sibap_chunks"

# ─── Cliente ChromaDB (lazy singleton) ────────────────────────────────────────
_client = None
_collection = None


def _get_collection():
    """
    Inicializa ChromaDB con persistencia en disco y retorna la colección.
    Patrón lazy — no bloquea el arranque del servidor si ChromaDB no está disponible.
    """
    global _client, _collection

    if _collection is not None:
        return _collection

    try:
        import chromadb
        from app.core.config import settings

        persist_dir = getattr(settings, "CHROMA_PERSIST_DIR", "./chroma_db")
        os.makedirs(persist_dir, exist_ok=True)

        _client = chromadb.PersistentClient(path=persist_dir)
        _collection = _client.get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},  # Métrica: similitud coseno
        )
        logger.info(
            f"vector_service: ChromaDB inicializado en '{persist_dir}'. "
            f"Colección '{_COLLECTION_NAME}' con {_collection.count()} chunks existentes."
        )
    except ImportError:
        logger.error(
            "vector_service: chromadb no está instalado. "
            "Ejecuta: pip install chromadb"
        )
        raise
    except Exception as e:
        logger.error(f"vector_service: error al inicializar ChromaDB: {e}")
        raise

    return _collection


# ─── API Pública ────────────────────────────────────────────────────────────────

def document_has_chunks(document_id: int) -> bool:
    """
    Verifica si el documento ya fue indexado en ChromaDB.
    Evita re-procesar documentos en reinicios del servidor.

    Args:
        document_id: ID del documento a verificar.

    Returns:
        True si ya existen chunks para ese documento_id.
    """
    try:
        collection = _get_collection()
        results = collection.get(
            where={"document_id": document_id},
            limit=1,
            include=[]  # Solo necesitamos saber si existe
        )
        exists = len(results["ids"]) > 0
        if exists:
            logger.info(
                f"vector_service: documento {document_id} ya indexado — omitiendo re-indexado."
            )
        return exists
    except Exception as e:
        logger.warning(f"vector_service: error verificando chunks de documento {document_id}: {e}")
        return False


def add_document_chunks(
    document_id: int,
    chunks: List[str],
    embeddings: List[List[float]],
) -> int:
    """
    Almacena los chunks y sus embeddings en ChromaDB.

    Args:
        document_id:  ID del documento origen.
        chunks:       Lista de textos (un chunk por elemento).
        embeddings:   Lista de vectores correspondientes a cada chunk.

    Returns:
        Número de chunks efectivamente almacenados.

    Raises:
        ValueError: Si chunks y embeddings tienen distinta longitud.
    """
    if not chunks:
        logger.warning(f"vector_service: no hay chunks para documento {document_id}.")
        return 0

    if len(chunks) != len(embeddings):
        raise ValueError(
            f"vector_service: mismatch chunks ({len(chunks)}) vs embeddings ({len(embeddings)})."
        )

    collection = _get_collection()

    ids = [f"doc{document_id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "document_id": document_id,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    logger.info(
        f"vector_service: {len(chunks)} chunks indexados para documento {document_id}."
    )
    return len(chunks)


def search_similar(
    query: str,
    document_ids: List[int],
    top_k: int = 5,
    model_name: str = "paraphrase-multilingual-mpnet-base-v2",
) -> str:
    """
    Busca los top_k chunks más relevantes para `query` dentro de `document_ids`.

    Args:
        query:          Texto de consulta (ej.: "programación orientada a objetos").
        document_ids:   IDs de documentos sobre los que buscar (filtro de seguridad).
        top_k:          Número de chunks a recuperar.
        model_name:     Modelo de embeddings (debe coincidir con el de indexado).

    Returns:
        String con los chunks recuperados concatenados y separados por "---".
        Retorna string vacío si no hay resultados.
    """
    if not document_ids:
        logger.warning("vector_service: se llamó search_similar sin document_ids.")
        return ""

    try:
        from app.services.embedding_service import get_query_embedding

        collection = _get_collection()

        # Verificar que al menos un documento tiene chunks
        if collection.count() == 0:
            logger.warning("vector_service: colección vacía — sin chunks indexados.")
            return ""

        query_embedding = get_query_embedding(query, model_name=model_name)

        # Filtro por document_ids ($in requiere lista de primitivos)
        where_filter: dict = (
            {"document_id": {"$in": document_ids}}
            if len(document_ids) > 1
            else {"document_id": document_ids[0]}
        )

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            where=where_filter,
            include=["documents", "distances", "metadatas"],
        )

        retrieved_docs: List[str] = results.get("documents", [[]])[0]
        distances: List[float] = results.get("distances", [[]])[0]

        if not retrieved_docs:
            logger.warning(
                f"vector_service: 0 resultados para query '{query[:60]}...' "
                f"en documentos {document_ids}."
            )
            return ""

        # Estimar tokens enviados (≈ 4 chars/token)
        total_chars = sum(len(d) for d in retrieved_docs)
        estimated_tokens = total_chars // 4

        logger.info(
            f"vector_service: recuperados {len(retrieved_docs)} chunks "
            f"(~{estimated_tokens} tokens) para query: '{query[:60]}...'"
        )

        context = "\n\n---\n\n".join(retrieved_docs)
        return context

    except Exception as e:
        logger.error(f"vector_service: error en search_similar: {e}")
        return ""


def delete_document_chunks(document_id: int) -> int:
    """
    Elimina todos los chunks de un documento del vector store.
    Debe llamarse cuando el documento es eliminado de la BD.

    Args:
        document_id: ID del documento a eliminar.

    Returns:
        Número de chunks eliminados.
    """
    try:
        collection = _get_collection()

        existing = collection.get(
            where={"document_id": document_id},
            include=[]
        )
        ids_to_delete = existing["ids"]

        if not ids_to_delete:
            logger.info(f"vector_service: no hay chunks para documento {document_id}.")
            return 0

        collection.delete(ids=ids_to_delete)
        logger.info(
            f"vector_service: {len(ids_to_delete)} chunks eliminados para documento {document_id}."
        )
        return len(ids_to_delete)

    except Exception as e:
        logger.error(f"vector_service: error eliminando chunks de documento {document_id}: {e}")
        return 0
