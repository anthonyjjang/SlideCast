from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        self.active_connections[job_id] = websocket

    def disconnect(self, job_id: str):
        if job_id in self.active_connections:
            del self.active_connections[job_id]

    async def send_progress(self, job_id: str, progress: int, message: str):
        if job_id in self.active_connections:
            websocket = self.active_connections[job_id]
            await websocket.send_json({"progress": progress, "message": message})

manager = ConnectionManager()

@router.websocket("/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect(websocket, job_id)
    try:
        while True:
            # 클라이언트로부터 핑/메시지 대기
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(job_id)
