"""
Rabbi Eitan - Celery Configuration
Background task queue for long-running operations
"""
from celery import Celery

from app.config import settings

# Create Celery app
celery_app = Celery(
    "rabbi_eitan",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jerusalem",
    enable_utc=True,

    # Task execution limits
    task_time_limit=settings.celery_task_time_limit,  # 30 min for HeyGen
    task_soft_time_limit=settings.celery_task_soft_time_limit,

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=2,

    # Result backend settings
    result_expires=3600,  # 1 hour

    # Beat schedule for automated tasks
    beat_schedule={
        "daily-content-scrape": {
            "task": "app.workers.tasks.scrape_daily_content",
            "schedule": 3600 * 6,  # Every 6 hours
            "options": {"queue": "content"}
        }
    },

    # Task routing
    task_routes={
        "app.workers.tasks.scrape_*": {"queue": "content"},
        "app.workers.tasks.generate_audio": {"queue": "media"},
        "app.workers.tasks.generate_video": {"queue": "media"},
        "app.workers.tasks.distribute_*": {"queue": "distribution"},
    }
)
