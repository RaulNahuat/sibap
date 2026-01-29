import sys
import os

sys.path.append(os.getcwd())

from sqlalchemy import text
from app.db.session import engine

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("\nConexión a la base de datos exitosa!")
            print(f"   Prueba: SELECT 1 -> {result.scalar()}")
    except Exception as e:
        print("\nError al conectar a la base de datos:")
        print(e)
        print("\nPor favor verifica tu archivo .env y asegúrate de que MySQL esté corriendo.")

if __name__ == "__main__":
    test_connection()
