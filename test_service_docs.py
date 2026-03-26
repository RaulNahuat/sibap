import requests

def test_api():
    base_url = "http://localhost:8000"
    # Necesitamos un token o desactivar auth en el script,
    # pero como está corriendo localmente, podemos intentar
    # llamar al endpoint si tenemos el ID del usuario directamente?
    # No, el middleware requiere el usuario actual.
    
    # Intentaré simular una llamada desde dentro de la app o simplemente 
    # imprimir lo que el servicio devuelve.
    pass

import sys
sys.path.append(r'c:\Users\wwwra\Desktop\SIBAP\SIBAP_backend')
from app.db.session import SessionLocal
from app.services.document_service import get_document_service
from app.repositories.document_repository import DocumentRepository

def check_service():
    db = SessionLocal()
    try:
        repo = DocumentRepository(db)
        docs, total = repo.get_user_documents(3, skip=0, limit=10)
        print(f"Total from repo: {total}")
        print(f"Items from repo: {len(docs)}")
        for d in docs:
            print(f"  - {d.id}: {d.filename} ({d.file_type})")
    finally:
        db.close()

if __name__ == "__main__":
    check_service()
