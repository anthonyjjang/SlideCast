from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    SECRET_KEY: str = "super-secret-key"
    
    DATABASE_URL: str = "postgresql+asyncpg://slidenarrator:password@localhost:5432/slidenarrator"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    TTS_DEFAULT_ENGINE: str = "edge"
    MAX_FILE_SIZE_MB: int = 100
    MAX_SLIDES: int = 100
    
    class Config:
        env_file = ".env"

settings = Settings()
