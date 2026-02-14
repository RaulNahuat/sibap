"""
Script para agregar las columnas de reset de contraseña manualmente
"""
from app.db.session import SessionLocal, engine
from sqlalchemy import text

def add_reset_columns():
    """Agrega las columnas reset_token y reset_token_expires a la tabla users"""
    
    with engine.connect() as conn:
        try:
            # Intentar agregar reset_token
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL"))
            print("Columna reset_token agregada")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Columna reset_token ya existe")
            else:
                print(f"Error agregando reset_token: {e}")
        
        try:
            # Intentar agregar reset_token_expires
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL"))
            print("✓ Columna reset_token_expires agregada")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("Columna reset_token_expires ya existe")
            else:
                print(f"Error agregando reset_token_expires: {e}")
        
        conn.commit()
        print("\nMigración completada exitosamente")

if __name__ == "__main__":
    add_reset_columns()
