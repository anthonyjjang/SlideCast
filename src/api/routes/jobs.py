from fastapi import APIRouter
from celery.result import AsyncResult
from src.worker.celery_app import celery_app

router = APIRouter()


def _error_message(info) -> str:
    """Celery가 FAILURE 상태에 담아주는 예외 정보를 사용자용 문구로 정리합니다."""
    if isinstance(info, dict):
        return str(info.get("exc_message") or info.get("message") or info)
    if isinstance(info, BaseException):
        return str(info) or info.__class__.__name__
    return str(info)


@router.get("/{job_id}")
async def get_job_status(job_id: str):
    task_result = AsyncResult(job_id, app=celery_app)

    response = {
        "job_id": job_id,
        "status": task_result.status,
    }

    if task_result.status == 'PROGRESS':
        info = task_result.info or {}
        response["progress"] = info.get('progress', 0)
        response["message"] = info.get('message', '')
    elif task_result.status == 'SUCCESS':
        response["result"] = task_result.result
    elif task_result.status == 'FAILURE':
        # 워커가 예외를 그대로 올리므로 여기서 실제 실패 사유를 받을 수 있다
        response["error"] = _error_message(task_result.info)

    return response
