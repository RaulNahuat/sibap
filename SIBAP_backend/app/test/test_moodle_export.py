import sys
import os

# Añadir el directorio raíz al path para importar la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.configuracion_generacion import ConfiguracionGeneracion, QuestionType, DifficultyLevel
from app.models.reactivo import Reactivo
from app.models.opcion import Opcion
from app.services import moodle_export_service

# Configuración de DB temporal para test
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_export():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        # 1. Crear datos de prueba
        config = ConfiguracionGeneracion(
            document_id=1,
            program="Ingeniería",
            semester="1",
            subject="Matemáticas",
            topic="Álgebra",
            question_type=QuestionType.MCQ,
            difficulty=DifficultyLevel.EASY,
            num_questions=1
        )
        db.add(config)
        db.commit()
        db.refresh(config)
        
        reactivo = Reactivo(
            config_id=config.id,
            question_text="¿Cuánto es 2+2?",
            name="Mat_Algebra_P1",
            item_type="MCQ",
            difficulty="EASY"
        )
        db.add(reactivo)
        db.commit()
        db.refresh(reactivo)
        
        db.add(Opcion(item_id=reactivo.id, option_text="4", is_correct=True, feedback="Correcto, 2+2=4"))
        db.add(Opcion(item_id=reactivo.id, option_text="5", is_correct=False, feedback="Incorrecto, intenta de nuevo"))
        db.commit()
        
        # 2. Probar exportación GIFT
        gift = moodle_export_service.export_to_gift(db, config.id)
        print("--- GIFT OUTPUT ---")
        print(gift)
        assert "::Mat_Algebra_P1::" in gift
        assert "=4#Correcto, 2+2=4" in gift
        
        # 3. Probar exportación XML
        xml = moodle_export_service.export_to_xml(db, config.id)
        print("\n--- XML OUTPUT ---")
        print(xml)
        assert "<name>" in xml
        assert "Mat_Algebra_P1" in xml
        assert "<feedback" in xml
        
        print("\n¡Prueba de exportación exitosa!")
        
    finally:
        db.close()
        # Limpieza
        if os.path.exists("./test_temp.db"):
            os.remove("./test_temp.db")

if __name__ == "__main__":
    test_export()
