from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.api.routers import auth, user, documents, questions, dashboard, curriculum, config
from app.core.config import CORS_ORIGINS
from app.models import *
app = FastAPI()

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
app.include_router(config.router)

@app.get("/")
def read_root():
    return {"status": "SIBAP backend funcionando"}