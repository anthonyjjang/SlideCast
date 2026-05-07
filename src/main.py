from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src.api.routes import upload, jobs
from src.api import websocket

app = FastAPI(
    title="SlideNarrator API",
    description="PPTX 파일로 AI 음성 나레이션 영상을 자동 생성하는 서비스",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(jobs.router, prefix="/api/jobs")
app.include_router(websocket.router, prefix="/ws")

app.mount("/static", StaticFiles(directory="src/static"), name="static")

@app.get("/")
async def root():
    from fastapi.responses import FileResponse
    return FileResponse("src/static/index.html")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
