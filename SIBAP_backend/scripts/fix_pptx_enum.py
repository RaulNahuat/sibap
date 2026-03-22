import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine

def fix_enum():
    print("Corrigiendo ENUM de file_type en la tabla documents...")
    try:
        with engine.connect() as connection:
            # MySQL syntax to modify ENUM
            sql = "ALTER TABLE documents MODIFY COLUMN file_type ENUM('PDF', 'DOCX', 'TXT', 'PPTX') NOT NULL;"
            connection.execute(text(sql))
            connection.commit()
            print("¡Éxito! El ENUM ha sido actualizado para incluir 'PPTX'.")
    except Exception as e:
        print(f"Error al corregir el ENUM: {e}")

if __name__ == "__main__":
    fix_enum()
