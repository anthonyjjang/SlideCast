import os
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

UPLOAD_DIR = "/tmp/slidenarrator_uploads"


def _safe_job_dir(job_id: str) -> str:
    """
    job_id는 URL에서 오는 값이므로 UUID 형식인지 검증한 뒤에만 경로에 사용합니다.
    (`%2F` 등으로 인코딩된 경로 구분자가 디코딩되어 상위 디렉터리로 새는 것을 차단)
    """
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 작업 ID입니다.")
    return os.path.join(UPLOAD_DIR, job_id)


@router.get("/{job_id}")
async def download_video(job_id: str):
    file_path = os.path.join(_safe_job_dir(job_id), f"final_{job_id}.mp4")

    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            media_type="video/mp4",
            filename=f"slide_video_{job_id[:8]}.mp4"
        )
    else:
        raise HTTPException(status_code=404, detail="생성된 영상을 찾을 수 없거나 아직 완성되지 않았습니다.")
