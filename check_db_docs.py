import sys
import os
sys.path.append(r'c:\Users\wwwra\Desktop\SIBAP\SIBAP_backend')

from app.db.session import SessionLocal
from app.models.documento import Documento
from app.models.usuario import Usuario

def check_docs():
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        for user in users:
            docs = db.query(Documento).filter(Documento.user_id == user.id).all()
            print(f"User: {user.email} (ID: {user.id})")
            print(f"  Docs count: {len(docs)}")
            for doc in docs:
                print(f"    - ID: {doc.id}, File: {doc.filename}, Status: {doc.status}")
    finally:
        db.close()

if __name__ == "__main__":
    check_docs()
