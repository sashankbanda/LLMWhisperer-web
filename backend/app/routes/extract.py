from fastapi import APIRouter, UploadFile, File
from app.services.llmwhisperer import process_document

router = APIRouter()

@router.post("/")
async def extract(file: UploadFile = File(...)):
    result = await process_document(file)
    return result
