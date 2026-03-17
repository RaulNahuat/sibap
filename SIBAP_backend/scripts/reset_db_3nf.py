import os
import pymysql
from dotenv import load_dotenv

def init_db():
    print("🚀 Inciando inicialización de base de datos SIBAP (3NF)...")
    
    # 1. Cargar .env
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: No se encontró DATABASE_URL en el archivo .env")
        return

    # Extraer credenciales de mysql+pymysql://user:pass@host:port/dbname
    try:
        # Remover el prefijo del driver
        clean_url = db_url.replace("mysql+pymysql://", "")
        
        # Separar auth y host
        auth, rest = clean_url.split("@")
        user_pass = auth.split(":")
        user = user_pass[0]
        password = user_pass[1] if len(user_pass) > 1 else ""
        
        # Separar host/port y dbname
        host_port, dbname = rest.split("/")
        host_port_split = host_port.split(":")
        host = host_port_split[0]
        port = int(host_port_split[1]) if len(host_port_split) > 1 else 3306

        print(f"📡 Conectando a MySQL en {host}:{port} (BD: {dbname})...")
        
        # 2. Conectar
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=dbname,
            port=port,
            client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
        )
        
        # 3. Leer SQL
        sql_path = r"C:\Users\wwwra\.gemini\antigravity\brain\e5f75c5a-177e-46fd-8be2-4620ff38b663\init_db_3nf.sql"
        if not os.path.exists(sql_path):
            # Buscar en el directorio actual si no está en el path absoluto
            sql_path = "init_db_3nf.sql"
            
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        # 4. Ejecutar
        with connection.cursor() as cursor:
            # Separar por punto y coma y ejecutar (pymysql soporta MULTI_STATEMENTS)
            cursor.execute(sql_script)
            
        connection.commit()
        print("✅ Base de datos inicializada exitosamente con estructura 3NF y Malla Curricular.")

    except Exception as e:
        print(f"❌ Error durante la inicialización: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    init_db()
