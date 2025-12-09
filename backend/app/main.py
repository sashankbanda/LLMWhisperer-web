from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

from app.routes.extract import router as extract_router
from app.routes.health import router as health_router

app.include_router(extract_router, prefix="/extract")
app.include_router(health_router, prefix="/health")
