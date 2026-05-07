from fastapi import APIRouter
from celery.result import AsyncResult
from src.worker.celery_app import celery_app

router = APIRouter()

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    task_result = AsyncResult(job_id, app=celery_app)
    
    response = {
        "job_id": job_id,
        "status": task_result.status,
    }

    if task_result.status == 'PROGRESS':
        response["progress"] = task_result.info.get('progress', 0)
        response["message"] = task_result.info.get('message', '')
    elif task_result.status == 'SUCCESS':
        response["result"] = task_result.result
    elif task_result.status == 'FAILURE':
        response["error"] = str(task_result.info)

    return response
