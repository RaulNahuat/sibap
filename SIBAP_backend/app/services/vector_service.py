import logging
import os
from typing import List, Optional

logger = logging.getLogger(__name__)

_COLLECTION_NAME = "sibap_chunks"

_client = None
_collection = None


def _get_collection():
    global _client, _collection

    from app.core.config import settings
    if not getattr(settings, "ENABLE_RAG", True):
        return None

    if _collection is not None:
        return _collection

    try:
        import chromadb
        persist_dir = getattr(settings, "CHROMA_PERSIST_DIR", "./chroma_db")
        os.makedirs(persist_dir, exist_ok=True)

        _client = chromadb.PersistentClient(path=persist_dir)
        _collection = _client.get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            f"vector_service: ChromaDB inicializado en '{persist_dir}'."
        )
    except ImportError:
        if getattr(settings, "ENABLE_RAG", True):
            logger.warning(
                "vector_service: chromadb no está instalado. "
                "Para usar RAG, ejecuta: pip install chromadb"
            )
        return None
    except Exception as e:
        logger.error(f"vector_service: error al inicializar ChromaDB: {e}")
        return None

    return _collection


def document_has_chunks(document_id: int) -> bool:
    try:
        collection = _get_collection()
        if not collection:
            return False
            
        results = collection.get(
            where={"document_id": document_id},
            limit=1,
            include=[]
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
    if not chunks:
        logger.warning(f"vector_service: no hay chunks para documento {document_id}.")
        return 0

    if len(chunks) != len(embeddings):
        raise ValueError(
            f"vector_service: mismatch chunks ({len(chunks)}) vs embeddings ({len(embeddings)})."
        )

    collection = _get_collection()
    if not collection:
        logger.debug("vector_service: RAG desactivado — omitiendo indexación.")
        return 0

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
    if not document_ids:
        logger.warning("vector_service: se llamó search_similar sin document_ids.")
        return ""

    try:
        from app.services.embedding_service import get_query_embedding

        collection = _get_collection()
        if not collection:
            return ""

        if collection.count() == 0:
            return ""

        query_embedding = get_query_embedding(query, model_name=model_name)

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
    try:
        collection = _get_collection()
        if not collection:
            return 0

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
