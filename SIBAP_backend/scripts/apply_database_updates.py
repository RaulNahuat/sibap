from sqlalchemy import create_engine, text
from app.core.config import settings

def apply_updates():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        print("Conectado a la base de datos para aplicar actualizaciones...")
        
        # 1. Agregar columna 'name' a la tabla 'items'
        try:
            connection.execute(text("ALTER TABLE items ADD COLUMN name TEXT"))
            connection.commit()
            print("Columna 'name' añadida exitosamente a la tabla 'items'.")
        except Exception as e:
            if "Duplicate column name" in str(e) or "1060" in str(e):
                print("La columna 'name' ya existe en la tabla 'items'.")
            else:
                print(f"Error al añadir columna 'name': {e}")

        # 2. Agregar columna 'feedback' a la tabla 'options'
        try:
            connection.execute(text("ALTER TABLE options ADD COLUMN feedback TEXT"))
            connection.commit()
            print("Columna 'feedback' añadida exitosamente a la tabla 'options'.")
        except Exception as e:
            if "Duplicate column name" in str(e) or "1060" in str(e):
                print("La columna 'feedback' ya existe en la tabla 'options'.")
            else:
                print(f"Error al añadir columna 'feedback': {e}")

    print("Proceso de actualización de base de datos finalizado.")

if __name__ == "__main__":
    apply_updates()
