import sys
import os

# Añadir el directorio actual al path para importar app
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from sqlalchemy import text

try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))
    print("Conexión a la base de datos EXITOSA")
    db.close()
except Exception as e:
    print(f"ERROR de conexión a la base de datos: {e}")
