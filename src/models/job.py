from sqlalchemy import Column, String, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
import datetime
import uuid

Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(String(20), default="pending") # pending/processing/done/failed
    file_name = Column(String(255))
    slide_count = Column(Integer, default=0)
    settings = Column(JSON, nullable=True)
    progress = Column(Integer, default=0)
    output_url = Column(String, nullable=True)
    error_msg = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
