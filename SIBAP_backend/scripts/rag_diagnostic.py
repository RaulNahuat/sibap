import os
import sys
import argparse
import logging
from typing import List

sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.documento import Documento
from app.services.rag import vector_service, embedding_service
from app.core.config import EMBEDDING_MODEL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_diagnostic")

def list_indexed_documents():
    db = SessionLocal()
    try:
        docs = db.query(Documento).all()
        print("\n--- Documentos en Base de Datos ---")
        print(f"{'ID':<5} | {'Nombre':<30} | {'Indexado?'}")
        print("-" * 50)
        for d in docs:
            has_chunks = vector_service.document_has_chunks(d.id)
            print(f"{d.id:<5} | {d.filename[:30]:<30} | {'SÍ' if has_chunks else 'NO'}")
    finally:
        db.close()

def reindex_document(doc_id: int):
    db = SessionLocal()
    try:
        doc = db.query(Documento).filter(Documento.id == doc_id).first()
        if not doc:
            print(f"Error: Documento {doc_id} no encontrado en la BD.")
            return

        if not doc.content_text:
            print(f"Error: El documento {doc_id} no tiene texto extraído.")
            return

        print(f"Indexando documento {doc_id}: {doc.filename}...")
        
        from app.services.documents.document_service import DocumentService
        from app.repositories.document_repository import DocumentRepository
        
        service = DocumentService(DocumentRepository(db))
        
        from app.core.config import settings
        original_enable = getattr(settings, "ENABLE_RAG", False)
        settings.ENABLE_RAG = True 
        
        service._index_document_rag(doc.id, doc.content_text)
        
        settings.ENABLE_RAG = original_enable
        print("¡Indexación completada!")
    finally:
        db.close()

def reindex_all_documents():
    db = SessionLocal()
    try:
        docs = db.query(Documento).all()
        to_index = [d for d in docs if not vector_service.document_has_chunks(d.id)]
        
        if not to_index:
            print("Todos los documentos ya están indexados.")
            return

        print(f"Se encontraron {len(to_index)} documentos pendientes de indexación.")
        
        from app.services.documents.document_service import DocumentService
        from app.repositories.document_repository import DocumentRepository
        from app.core.config import settings
        
        service = DocumentService(DocumentRepository(db))
        original_enable = getattr(settings, "ENABLE_RAG", False)
        settings.ENABLE_RAG = True 

        for d in to_index:
            if not d.content_text:
                print(f"[-] Saltando {d.id} ({d.filename}): No tiene texto.")
                continue
            
            print(f"[+] Indexando {d.id}: {d.filename}...")
            service._index_document_rag(d.id, d.content_text)
            
            import time
            time.sleep(3.5)
            
        settings.ENABLE_RAG = original_enable
        print("\n¡Proceso de indexación masiva completado!")
    finally:
        db.close()

def test_retrieval(query: str, doc_ids: List[int], top_k: int = 5):
    print(f"\n--- Probando Recuperación para: '{query}' ---")
    print(f"Buscando en documentos: {doc_ids}")
    
    collection = vector_service._get_collection()
    if not collection:
        print("Error: No se pudo obtener la colección de ChromaDB.")
        return

    q_emb = embedding_service.get_query_embedding(query)
    
    where_filter = (
        {"document_id": {"$in": doc_ids}}
        if len(doc_ids) > 1
        else {"document_id": doc_ids[0]}
    )
    
    results = collection.query(
        query_embeddings=[q_emb],
        n_results=top_k,
        where=where_filter,
        include=["documents", "distances", "metadatas"]
    )
    
    docs = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    if not docs:
        print("No se encontraron resultados.")
        return

    print(f"\nSe encontraron {len(docs)} resultados:")
    for i, (doc, dist, meta) in enumerate(zip(docs, distances, metadatas)):
        print(f"\n[Resultado {i+1}] - Distancia: {dist:.4f}")
        print(f"Meta: {meta}")
        print("-" * 40)
        print(f"{doc[:500]}...")
        if len(doc) > 500:
            print(f"... (truncado, total chars: {len(doc)})")

def main():
    parser = argparse.ArgumentParser(description="Diagnóstico del sistema RAG de SIBAP")
    parser.add_argument("--list", action="store_true", help="Listar documentos indexados")
    parser.add_argument("--reindex", type=int, help="ID del documento a re-indexar")
    parser.add_argument("--reindex-all", action="store_true", help="Indexar todos los documentos pendientes")
    parser.add_argument("--query", type=str, help="Query de búsqueda para probar retrieval")
    parser.add_argument("--docs", type=str, help="IDs de documentos separados por coma (ej: 1,2,3)")
    parser.add_argument("--top_k", type=int, default=5, help="Número de resultados a recuperar")

    args = parser.parse_args()

    if args.list:
        list_indexed_documents()
        return

    if args.reindex:
        reindex_document(args.reindex)
        return

    if args.reindex_all:
        reindex_all_documents()
        return

    if args.query:
        if not args.docs:
            print("Error: Debes especificar los IDs de los documentos con --docs")
            return
        doc_ids = [int(i) for i in args.docs.split(",")]
        test_retrieval(args.query, doc_ids, args.top_k)
        return

    parser.print_help()

if __name__ == "__main__":
    main()
