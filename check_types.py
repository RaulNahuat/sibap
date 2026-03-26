import sys
sys.path.append(r'c:\Users\wwwra\Desktop\SIBAP\SIBAP_backend')
from app.db.session import SessionLocal
from app.models.documento import Documento

db = SessionLocal()
try:
    docs = db.query(Documento).all()
    for d in docs:
        print(f"ID:{d.id} TypeValue:'{d.file_type.value}' Status:'{d.status.value}'")
finally:
    db.close()
