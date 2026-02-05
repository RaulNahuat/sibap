from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import auth
from app.core.config import CORS_ORIGINS
from app.models import *  # noqa: F401, F403

app = FastAPI()

# configuracion de cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# registro de routers
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"status": "SIBAP backend funcionando"}