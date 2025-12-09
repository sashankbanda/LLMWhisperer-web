from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.extract import router as extract_router
from app.routes.health import router as health_router

app = FastAPI()

# CORS middleware must be added before including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router, prefix="/extract")
app.include_router(health_router, prefix="/health")
