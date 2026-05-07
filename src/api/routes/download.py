from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

UPLOAD_DIR = "/tmp/slidenarrator_uploads"

@router.get("/{job_id}")
async def download_video(job_id: str):
    file_path = os.path.join(UPLOAD_DIR, job_id, f"final_{job_id}.mp4")
    
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path, 
            media_type="video/mp4", 
            filename=f"slide_video_{job_id[:8]}.mp4"
        )
    else:
        raise HTTPException(status_code=404, detail="생성된 영상을 찾을 수 없거나 아직 완성되지 않았습니다.")
