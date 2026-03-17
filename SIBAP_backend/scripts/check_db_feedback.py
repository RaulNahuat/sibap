from sqlalchemy import create_engine, text
from app.core.config import settings

def check_feedback():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, option_text, feedback FROM options ORDER BY id DESC LIMIT 5"))
        rows = result.fetchall()
        print("Últimas 5 opciones en la DB:")
        for row in rows:
            print(f"ID: {row[0]}, Texto: {row[1][:30]}, Feedback: {row[2]}")

if __name__ == "__main__":
    check_feedback()
