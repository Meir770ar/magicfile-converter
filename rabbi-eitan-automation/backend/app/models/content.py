"""
Rabbi Eitan - Content Models
SQLAlchemy models for content and scripts
"""
import uuid
from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import Column, String, Text, DateTime, Date, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Content(Base):
    """Model for scraped daily content."""

    __tablename__ = "content"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_url = Column(String(500), nullable=False)
    source_type = Column(String(20), nullable=False, default="html")  # html or rss
    raw_text = Column(Text, nullable=False)
    hebrew_text = Column(Text)
    title = Column(String(500))
    date_for = Column(Date, nullable=False)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scripts = relationship("Script", back_populates="content", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Content {self.id} for {self.date_for}>"


class Script(Base):
    """Model for generated scripts."""

    __tablename__ = "scripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id = Column(UUID(as_uuid=True), ForeignKey("content.id", ondelete="CASCADE"))
    version = Column(Integer, nullable=False, default=1)
    script_text = Column(Text, nullable=False)
    prompt_used = Column(Text)
    ai_model = Column(String(50), default="gemini-2.0-flash")
    word_count = Column(Integer)
    estimated_duration = Column(Integer)  # seconds

    # Approval status
    status = Column(String(20), nullable=False, default="pending")
    # pending, approved, rejected, editing
    approved_by = Column(String(100))
    approved_at = Column(DateTime)
    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    content = relationship("Content", back_populates="scripts")
    media = relationship("Media", back_populates="script", cascade="all, delete-orphan")
    voice_notes = relationship("VoiceNote", back_populates="script", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Script {self.id} v{self.version} ({self.status})>"


class VoiceNote(Base):
    """Model for voice note corrections."""

    __tablename__ = "voice_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    script_id = Column(UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="CASCADE"))
    telegram_file_id = Column(String(200), nullable=False)
    file_path = Column(String(500))
    transcription = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    script = relationship("Script", back_populates="voice_notes")

    def __repr__(self):
        return f"<VoiceNote {self.id} for Script {self.script_id}>"
