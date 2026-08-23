import os
import re
import shutil
import uuid

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from src.config import settings
from src.core.tts_engine import VOICES
from src.worker.tasks import process_presentation

router = APIRouter()

UPLOAD_DIR = "/tmp/slidenarrator_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

CHUNK_SIZE = 1024 * 1024          # 1MB씩 스트리밍 (전체를 메모리에 올리지 않는다)
PPTX_MAGIC = b"PK\x03\x04"        # PPTX는 ZIP 컨테이너
MAX_DELAY_SEC = 10.0
_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9가-힣._ -]")


def sanitize_filename(name: str) -> str:
    """
    업로드 파일명에서 경로 성분을 제거합니다.

    `file.filename`은 클라이언트가 보내는 값이라 신뢰할 수 없다.
    `../../evil.pptx` 같은 이름을 그대로 os.path.join에 넘기면
    job 디렉터리 밖에 파일이 기록된다.
    """
    name = (name or "").replace("\\", "/")
    name = os.path.basename(name).strip()
    name = _UNSAFE_CHARS.sub("_", name).lstrip(".")
    if not name.lower().endswith(".pptx"):
        name = "presentation.pptx"
    return name[:120]


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    voice_key: str = Form("ko_female"),
    delay_sec: float = Form(1.5)
):
    if not (file.filename or "").lower().endswith(".pptx"):
        raise HTTPException(status_code=400, detail="PPTX 파일만 업로드 가능합니다.")

    if voice_key not in VOICES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 목소리입니다. 사용 가능: {', '.join(VOICES)}"
        )

    # 음수 딜레이는 ffmpeg의 adelay 필터를 깨뜨리고, 과도한 값은 영상을 무한정 늘린다
    if not (0 <= delay_sec <= MAX_DELAY_SEC):
        raise HTTPException(
            status_code=400,
            detail=f"화면 전환 여백은 0~{MAX_DELAY_SEC:g}초 사이여야 합니다."
        )

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    file_path = os.path.join(job_dir, sanitize_filename(file.filename))

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    written = 0

    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(CHUNK_SIZE):
                if written == 0 and not chunk.startswith(PPTX_MAGIC):
                    raise HTTPException(
                        status_code=400,
                        detail="올바른 PPTX 파일이 아닙니다. (확장자만 .pptx인 파일로 보입니다)"
                    )
                written += len(chunk)
                if written > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"파일 크기가 제한({settings.MAX_FILE_SIZE_MB}MB)을 초과했습니다."
                    )
                buffer.write(chunk)

        if written == 0:
            raise HTTPException(status_code=400, detail="빈 파일입니다.")
    except HTTPException:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise

    # 비동기 작업 큐에 전송 (설정값 포함)
    process_presentation.apply_async(
        args=[job_id, file_path, job_dir, voice_key, delay_sec],
        task_id=job_id
    )

    return {"job_id": job_id, "message": "파일 업로드 완료 및 작업 큐에 등록되었습니다."}
