"""
test_rag_pipeline.py
--------------------
Pruebas unitarias del pipeline RAG de SIBAP.

Ejecutar desde SIBAP_backend/ con venv activo:
    python -m pytest app/test/rag_test/test_rag_pipeline.py -v

Nota: los tests de embeddings y vector store requieren GOOGLE_API_KEY en .env.
"""

import pytest
import os
import tempfile
import shutil


# ─── 1. Test de Chunking (sin API key) ────────────────────────────────────────

def test_chunking_empty_text():
    """Texto vacío debe devolver lista vacía."""
    from app.services.rag.chunk_service import split_text
    assert split_text("") == []
    assert split_text("   ") == []


def test_chunking_short_text():
    """Texto corto debe devolver lista con 1 elemento."""
    from app.services.rag.chunk_service import split_text
    result = split_text("Este es un texto corto.")
    assert len(result) == 1
    assert "texto corto" in result[0]


def test_chunking_long_text():
    """Texto largo debe producir múltiples chunks."""
    from app.services.rag.chunk_service import split_text
    paragraph = "La programación orientada a objetos es un paradigma de programación. " * 20
    long_text = (paragraph + "\n\n") * 15
    chunks = split_text(long_text, chunk_size=600, overlap=100)
    assert len(chunks) >= 2


def test_chunking_preserves_content():
    """Una palabra clave debe aparecer en algún chunk."""
    from app.services.rag.chunk_service import split_text
    keyword = "PALABRA_CLAVE_UNICA_12345"
    text = ("Relleno. " * 300) + keyword + (" Más relleno. " * 300)
    chunks = split_text(text, chunk_size=400, overlap=80)
    combined = " ".join(chunks)
    assert keyword in combined


# ─── 2. Test de Embeddings (requiere GOOGLE_API_KEY) ──────────────────────────

def test_embeddings_empty_list():
    """Lista vacía no debe llamar a la API y devolver lista vacía."""
    from app.services.rag.embedding_service import get_embeddings
    result = get_embeddings([])
    assert result == []


@pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY"),
    reason="Requiere GOOGLE_API_KEY en el entorno"
)
def test_embeddings_count_and_dimension():
    """Debe devolver un embedding de 768 dims por texto."""
    from app.services.rag.embedding_service import get_embeddings
    texts = ["Hola mundo", "Ingeniería de software"]
    result = get_embeddings(texts)
    assert len(result) == len(texts)
    assert len(result[0]) == 768


@pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY"),
    reason="Requiere GOOGLE_API_KEY en el entorno"
)
def test_query_embedding_dimension():
    """El embedding de consulta debe tener 768 dimensiones."""
    from app.services.rag.embedding_service import get_query_embedding
    result = get_query_embedding("herencia en programación orientada a objetos")
    assert len(result) == 768


# ─── 3. Test del Vector Store (requiere GOOGLE_API_KEY) ───────────────────────

@pytest.fixture
def temp_chroma(monkeypatch):
    """Directorio temporal de ChromaDB para tests aislados."""
    tmp_dir = tempfile.mkdtemp()
    monkeypatch.setenv("CHROMA_PERSIST_DIR", tmp_dir)
    import app.services.rag.vector_service as vs
    monkeypatch.setattr(vs, "_client", None)
    monkeypatch.setattr(vs, "_collection", None)
    monkeypatch.setattr("app.core.config.settings.CHROMA_PERSIST_DIR", tmp_dir)
    yield tmp_dir
    shutil.rmtree(tmp_dir, ignore_errors=True)


@pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY"),
    reason="Requiere GOOGLE_API_KEY en el entorno"
)
def test_vector_store_add_and_search(temp_chroma):
    """Añadir chunks y recuperarlos por similitud semántica."""
    from app.services.rag.chunk_service import split_text
    from app.services.rag.embedding_service import get_embeddings
    import app.services.rag.vector_service as vs

    doc_id = 9999
    content = (
        "La herencia permite que una clase hija herede atributos de una clase padre. "
        "Es fundamental en la programación orientada a objetos. " * 8
    )
    chunks = split_text(content, chunk_size=200, overlap=40)
    embeddings = get_embeddings(chunks)
    vs.add_document_chunks(doc_id, chunks, embeddings)

    result = vs.search_similar(
        query="herencia y clases en OOP",
        document_ids=[doc_id],
        top_k=3,
    )
    assert result
    assert "herencia" in result.lower() or "clase" in result.lower()


@pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY"),
    reason="Requiere GOOGLE_API_KEY en el entorno"
)
def test_vector_store_idempotency(temp_chroma):
    """document_has_chunks() debe funcionar correctamente."""
    from app.services.rag.embedding_service import get_embeddings
    import app.services.rag.vector_service as vs

    doc_id = 8888
    chunks = ["Chunk de prueba."]
    embeddings = get_embeddings(chunks)

    assert not vs.document_has_chunks(doc_id)
    vs.add_document_chunks(doc_id, chunks, embeddings)
    assert vs.document_has_chunks(doc_id)


@pytest.mark.skipif(
    not os.getenv("GOOGLE_API_KEY"),
    reason="Requiere GOOGLE_API_KEY en el entorno"
)
def test_vector_store_delete(temp_chroma):
    """Eliminar chunks debe limpiar el vector store."""
    from app.services.rag.embedding_service import get_embeddings
    import app.services.rag.vector_service as vs

    doc_id = 7777
    chunks = ["Chunk para eliminar."]
    embeddings = get_embeddings(chunks)
    vs.add_document_chunks(doc_id, chunks, embeddings)

    deleted = vs.delete_document_chunks(doc_id)
    assert deleted == 1
    assert not vs.document_has_chunks(doc_id)
