from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import auth
from app.core.config import CORS_ORIGINS
from app.models import *  # noqa: F401, F403

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Orígenes permitidos desde .env
    allow_credentials=True,  # Permitir cookies
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)

# Registrar routers
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"status": "SIBAP backend funcionando"}