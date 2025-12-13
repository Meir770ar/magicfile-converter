"""
Rabbi Eitan - Configuration Settings
Using Pydantic Settings for environment variable management
"""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Rabbi Eitan - Tanya Automation"
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql://rabbi_user:rabbi_pass@localhost:5432/rabbi_eitan"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "change-this-in-production"

    # API Keys
    gemini_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    elevenlabs_voice_id: Optional[str] = None
    heygen_api_key: Optional[str] = None
    heygen_avatar_id: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Telegram
    telegram_bot_token: Optional[str] = None
    telegram_admin_id: Optional[str] = None
    telegram_channel_id: Optional[str] = None

    # WhatsApp
    whatsapp_api_url: Optional[str] = None
    whatsapp_instance_id: Optional[str] = None
    whatsapp_api_token: Optional[str] = None

    # Content Source
    chabad_tanya_url: str = "https://www.chabad.org/dailystudy/tanya.htm"

    # Media Settings
    background_music_volume: float = 0.15
    whatsapp_video_resolution: int = 720

    # Celery
    celery_task_time_limit: int = 1800  # 30 minutes for HeyGen
    celery_task_soft_time_limit: int = 1740

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
