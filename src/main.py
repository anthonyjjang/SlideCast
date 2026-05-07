from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
async def root():
    return {"message": "Welcome to SlideNarrator API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
