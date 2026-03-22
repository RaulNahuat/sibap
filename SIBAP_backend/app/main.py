from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.routers import auth, user, documents, questions, dashboard, curriculum
from app.core.config import CORS_ORIGINS
from app.models import *  # noqa: F401, F403
from app.core.tasks import cleanup_expired_documents_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Iniciar la tarea de fondo de limpieza de documentos estructurados >24h
    # Corre una vez por hora (3600 segundos)
    task = asyncio.create_task(cleanup_expired_documents_loop(3600))
    yield
    # Cancelación al apagar el servidor
    task.cancel()

app = FastAPI(lifespan=lifespan)

# configuracion de cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.middleware.csrf import CSRFMiddleware
app.add_middleware(CSRFMiddleware)

# registro de routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(documents.router)
app.include_router(questions.router)
app.include_router(dashboard.router)
app.include_router(curriculum.router)

@app.get("/")
def read_root():
    return {"status": "SIBAP backend funcionando"}