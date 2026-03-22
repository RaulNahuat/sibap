import os
import asyncio
import logging
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.documento import Documento

logger = logging.getLogger(__name__)

async def cleanup_expired_documents_loop(interval_seconds: int = 3600):
    """
    Bucle infinito que se ejecuta en segundo plano durante toda la vida
    de la aplicación FastAPI. Busca documentos 'complejos' cuyo archivo
    físico se conservó por más de 24 horas y los elimina para ahorrar espacio.
    """
    logger.info("Task: Iniciando bucle de limpieza de documentos expirados (>24h).")
    while True:
        try:
            cleanup_expired_documents()
        except Exception as e:
            logger.error(f"Task: Error en ciclo de limpieza de documentos: {e}")
        
        # Dormir hasta la siguiente iteración
        await asyncio.sleep(interval_seconds)

def cleanup_expired_documents():
    """
    Lógica síncrona real de limpieza. Instancia una sesión de DB corta,
    busca candidatos, elimina el archivo físico y pone file_path = None.
    """
    db = SessionLocal()
    try:
        # Límite: hace exactamente 24 horas
        cutoff_date = datetime.utcnow() - timedelta(hours=24)
        
        # Buscar: es complejo, AÚN tiene file_path, y se subió antes del cutoff
        candidatos = db.query(Documento).filter(
            Documento.is_complex == True,
            Documento.file_path.isnot(None),
            Documento.uploaded_at < cutoff_date
        ).all()
        
        if not candidatos:
            return

        eliminados = 0
        for doc in candidatos:
            if doc.file_path and os.path.exists(doc.file_path):
                try:
                    os.remove(doc.file_path)
                    doc.file_path = None
                    eliminados += 1
                except OSError as e:
                    logger.warning(f"Task: No se pudo eliminar archivo físico {doc.file_path}: {e}")
            else:
                # Si el archivo no existía en disco pero estaba en DB, limpiamos la DB igual
                doc.file_path = None
                eliminados += 1
                
        if eliminados > 0:
            db.commit()
            logger.info(f"Task: Limpieza completada. {eliminados} archivos físicos expirados eliminados.")
            
    finally:
        db.close()
