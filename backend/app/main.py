from fastapi import FastAPI
from app.routes.extract import router as extract_router
from app.routes.health import router as health_router

app = FastAPI()

app.include_router(extract_router, prefix="/extract")
app.include_router(health_router, prefix="/health")
