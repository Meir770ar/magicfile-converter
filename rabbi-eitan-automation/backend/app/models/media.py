"""
Rabbi Eitan - Media Models
SQLAlchemy models for media assets and distribution
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean, ForeignKey, JSON, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Media(Base):
    """Model for generated media files."""

    __tablename__ = "media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    script_id = Column(UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="CASCADE"))

    # Type: audio, video, final
    media_type = Column(String(20), nullable=False)
    # Provider: elevenlabs, heygen, ffmpeg
    provider = Column(String(50), nullable=False)

    # File info
    file_path = Column(String(500))
    file_url = Column(String(1000))
    file_size_bytes = Column(BigInteger)
    duration_seconds = Column(Float)
    resolution = Column(String(20))  # e.g., "1080x1920"

    # Status: pending, processing, completed, failed
    status = Column(String(20), nullable=False, default="pending")
    error_message = Column(Text)
    metadata = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    script = relationship("Script", back_populates="media")
    distributions = relationship("Distribution", back_populates="media", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Media {self.id} ({self.media_type}) - {self.status}>"


class Distribution(Base):
    """Model for content distribution records."""

    __tablename__ = "distributions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"))

    # Platform: telegram, whatsapp
    platform = Column(String(50), nullable=False)
    platform_message_id = Column(String(200))
    recipient = Column(String(200))  # channel_id, phone_number, etc.

    # Status: pending, sent, failed
    status = Column(String(20), nullable=False, default="pending")
    sent_at = Column(DateTime)
    error_message = Column(Text)
    metadata = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    media = relationship("Media", back_populates="distributions")

    def __repr__(self):
        return f"<Distribution {self.id} to {self.platform} - {self.status}>"


class PipelineRun(Base):
    """Model for pipeline execution tracking."""

    __tablename__ = "pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id = Column(UUID(as_uuid=True), ForeignKey("content.id"))

    current_step = Column(Integer, nullable=False, default=1)
    total_steps = Column(Integer, default=6)

    # Status: running, paused, completed, failed
    status = Column(String(20), nullable=False, default="running")
    steps_completed = Column(JSON, default=[])

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    metadata = Column(JSON, default={})

    def __repr__(self):
        return f"<PipelineRun {self.id} Step {self.current_step}/{self.total_steps} - {self.status}>"


class APICredit(Base):
    """Model for tracking API credit usage."""

    __tablename__ = "api_credits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Provider: elevenlabs, heygen, gemini, openai
    provider = Column(String(50), nullable=False)
    credits_used = Column(Integer, default=0)
    credits_remaining = Column(Integer)
    operation_type = Column(String(50))  # audio_generation, video_generation, etc.

    recorded_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, default={})

    def __repr__(self):
        return f"<APICredit {self.provider}: {self.credits_used} used>"
