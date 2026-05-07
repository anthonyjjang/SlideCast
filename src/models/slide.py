from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from src.models.job import Base
import uuid

class Slide(Base):
    __tablename__ = "slides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"))
    slide_no = Column(Integer)
    script_original = Column(String)
    script_edited = Column(String, nullable=True)
    script_translated = Column(JSON, nullable=True)
    audio_url = Column(String, nullable=True)
    duration = Column(Float, nullable=True)
    status = Column(String(20), default="pending")
