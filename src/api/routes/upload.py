from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from src.worker.tasks import process_presentation

router = APIRouter()

UPLOAD_DIR = "/tmp/slidenarrator_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="PPTX 파일만 업로드 가능합니다.")

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    file_path = os.path.join(job_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 비동기 작업 큐에 전송 (Celery)
    process_presentation.apply_async(
        args=[job_id, file_path, job_dir],
        task_id=job_id
    )

    return {"job_id": job_id, "message": "파일 업로드 완료 및 작업 큐에 등록되었습니다."}
