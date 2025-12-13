"""
Rabbi Eitan - Celery Tasks
Background tasks for content processing and media generation
"""
import asyncio
from datetime import date
from typing import Optional

from celery import chain
from loguru import logger

from app.workers.celery_app import celery_app
from app.services.scraper import get_scraper, ScrapingError
from app.services.gemini_service import get_gemini_service, ScriptGenerationError
from app.services.whisper_service import get_whisper_service
from app.services.elevenlabs_service import get_elevenlabs_service, AudioGenerationError
from app.services.heygen_service import get_heygen_service, VideoGenerationError
from app.services.ffmpeg_service import get_ffmpeg_service, VideoProcessingError
from app.services.distribution import get_distribution_service, Platform


def run_async(coro):
    """Helper to run async functions in sync Celery tasks."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # Create new loop if one is running
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# ==================
# Content Tasks
# ==================

@celery_app.task(bind=True, name="app.workers.tasks.scrape_daily_content")
def scrape_daily_content(self):
    """
    Scrape daily Tanya content from Chabad.org.
    Implements HTML scraping with RSS fallback.
    """
    logger.info("Task: Starting daily content scraping")

    try:
        scraper = run_async(get_scraper())
        content = run_async(scraper.get_daily_content())

        logger.success(f"Scraped content: {content.title}")

        return {
            "status": "completed",
            "title": content.title,
            "source_type": content.source_type,
            "text_length": len(content.raw_text),
            "date_for": str(content.date_for),
            "raw_text": content.raw_text[:1000]  # Truncate for task result
        }

    except ScrapingError as e:
        logger.error(f"Scraping failed: {e}")
        self.retry(exc=e, countdown=300, max_retries=3)

    except Exception as e:
        logger.error(f"Unexpected error in scraping: {e}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="app.workers.tasks.generate_script")
def generate_script(self, content_text: str, content_title: str, custom_prompt: Optional[str] = None):
    """
    Generate a 60-second viral script using Gemini AI.
    """
    logger.info(f"Task: Generating script for '{content_title}'")

    try:
        gemini = get_gemini_service()
        script = run_async(gemini.generate_script(
            content_text=content_text,
            content_title=content_title,
            custom_prompt=custom_prompt
        ))

        logger.success(f"Script generated: {script.word_count} words, ~{script.estimated_duration_seconds}s")

        return {
            "status": "completed",
            "script_text": script.script_text,
            "word_count": script.word_count,
            "estimated_duration": script.estimated_duration_seconds,
            "model": script.model
        }

    except ScriptGenerationError as e:
        logger.error(f"Script generation failed: {e}")
        self.retry(exc=e, countdown=60, max_retries=3)

    except Exception as e:
        logger.error(f"Unexpected error in script generation: {e}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="app.workers.tasks.rewrite_script")
def rewrite_script(self, original_script: str, correction_text: str):
    """
    Rewrite script based on voice note correction.
    """
    logger.info("Task: Rewriting script with correction")

    try:
        gemini = get_gemini_service()
        script = run_async(gemini.rewrite_with_correction(
            original_script=original_script,
            correction_text=correction_text
        ))

        return {
            "status": "completed",
            "script_text": script.script_text,
            "word_count": script.word_count
        }

    except Exception as e:
        logger.error(f"Script rewrite failed: {e}")
        return {"status": "failed", "error": str(e)}


# ==================
# Transcription Tasks
# ==================

@celery_app.task(bind=True, name="app.workers.tasks.transcribe_voice_note")
def transcribe_voice_note(self, file_path: str):
    """
    Transcribe voice note using Whisper.
    Input: OGG file from Telegram
    Output: Transcribed text
    """
    logger.info(f"Task: Transcribing voice note: {file_path}")

    try:
        whisper = get_whisper_service()
        result = run_async(whisper.transcribe(file_path, language="he"))

        logger.success(f"Transcription complete: {len(result.text)} chars")

        return {
            "status": "completed",
            "transcription": result.text,
            "language": result.language,
            "duration": result.duration_seconds
        }

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return {"status": "failed", "error": str(e)}


# ==================
# Media Generation Tasks
# ==================

@celery_app.task(bind=True, name="app.workers.tasks.generate_audio")
def generate_audio(self, script_text: str, script_id: str):
    """
    Generate audio using ElevenLabs API.
    Model: Flash v2.5
    """
    logger.info(f"Task: Generating audio for script {script_id}")

    try:
        elevenlabs = get_elevenlabs_service()
        result = run_async(elevenlabs.generate_audio(
            text=script_text,
            output_filename=f"script_{script_id}"
        ))

        logger.success(f"Audio generated: {result.file_path}")

        return {
            "status": "completed",
            "audio_path": result.file_path,
            "duration": result.duration_seconds,
            "file_size": result.file_size_bytes,
            "characters_used": result.characters_used
        }

    except AudioGenerationError as e:
        logger.error(f"Audio generation failed: {e}")
        self.retry(exc=e, countdown=60, max_retries=3)

    except Exception as e:
        logger.error(f"Unexpected error in audio generation: {e}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(
    bind=True,
    name="app.workers.tasks.generate_video",
    soft_time_limit=1740,  # 29 minutes
    time_limit=1800  # 30 minutes
)
def generate_video(self, script_text: str, audio_path: str, script_id: str):
    """
    Generate avatar video using HeyGen API.
    Note: HeyGen can take up to 30 minutes for video generation.
    """
    logger.info(f"Task: Generating video for script {script_id}")

    try:
        heygen = get_heygen_service()
        result = run_async(heygen.generate_video(
            script_text=script_text,
            audio_path=audio_path,
            output_filename=f"script_{script_id}"
        ))

        if result.status.value == "completed":
            logger.success(f"Video generated: {result.file_path}")
            return {
                "status": "completed",
                "video_path": result.file_path,
                "video_url": result.video_url,
                "duration": result.duration_seconds
            }
        else:
            return {"status": "failed", "error": "Video generation failed"}

    except VideoGenerationError as e:
        logger.error(f"Video generation failed: {e}")
        return {"status": "failed", "error": str(e)}

    except Exception as e:
        logger.error(f"Unexpected error in video generation: {e}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="app.workers.tasks.post_process_media")
def post_process_media(
    self,
    video_path: str,
    audio_path: str,
    script_id: str,
    logo_path: Optional[str] = None,
    music_path: Optional[str] = None
):
    """
    Post-process media using FFmpeg:
    1. Merge high-quality audio with avatar video
    2. Add logo watermark
    3. Add background music (15% volume)
    NO subtitles (removed requirement)
    """
    logger.info(f"Task: Post-processing media for script {script_id}")

    try:
        ffmpeg = get_ffmpeg_service()
        result = run_async(ffmpeg.process_video(
            video_path=video_path,
            audio_path=audio_path,
            output_filename=f"script_{script_id}",
            logo_path=logo_path,
            music_path=music_path
        ))

        logger.success(f"Video processed: {result.file_path}")

        return {
            "status": "completed",
            "final_path": result.file_path,
            "duration": result.duration_seconds,
            "file_size": result.file_size_bytes,
            "resolution": result.resolution
        }

    except VideoProcessingError as e:
        logger.error(f"Video processing failed: {e}")
        return {"status": "failed", "error": str(e)}

    except Exception as e:
        logger.error(f"Unexpected error in post-processing: {e}")
        return {"status": "failed", "error": str(e)}


# ==================
# Distribution Tasks
# ==================

@celery_app.task(bind=True, name="app.workers.tasks.distribute_telegram")
def distribute_telegram(self, media_path: str, caption: str, channel_id: Optional[str] = None):
    """
    Distribute video to Telegram channel.
    Max file size: 50MB
    """
    logger.info(f"Task: Distributing to Telegram")

    try:
        service = get_distribution_service()
        result = run_async(service.telegram.send_video(
            video_path=media_path,
            caption=caption,
            channel_id=channel_id
        ))

        if result.status.value == "sent":
            logger.success(f"Sent to Telegram: {result.message_id}")
            return {"status": "sent", "message_id": result.message_id}
        else:
            return {"status": "failed", "error": result.error}

    except Exception as e:
        logger.error(f"Telegram distribution failed: {e}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="app.workers.tasks.distribute_whatsapp")
def distribute_whatsapp(self, media_path: str, caption: str, phone_number: Optional[str] = None):
    """
    Distribute video to WhatsApp.
    Compresses to 720p before sending.
    """
    logger.info(f"Task: Distributing to WhatsApp")

    try:
        service = get_distribution_service()
        result = run_async(service.whatsapp.send_video(
            video_path=media_path,
            caption=caption,
            phone_number=phone_number,
            compress=True
        ))

        if result.status.value == "sent":
            logger.success(f"Sent to WhatsApp: {result.message_id}")
            return {"status": "sent", "message_id": result.message_id}
        else:
            return {"status": "failed", "error": result.error}

    except Exception as e:
        logger.error(f"WhatsApp distribution failed: {e}")
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="app.workers.tasks.distribute_all")
def distribute_all(self, media_path: str, caption: str):
    """
    Distribute to all configured platforms.
    """
    logger.info("Task: Distributing to all platforms")

    try:
        service = get_distribution_service()
        results = run_async(service.distribute(
            video_path=media_path,
            caption=caption,
            platforms=[Platform.TELEGRAM, Platform.WHATSAPP]
        ))

        return {
            "status": "completed",
            "results": [
                {
                    "platform": r.platform.value,
                    "status": r.status.value,
                    "message_id": r.message_id,
                    "error": r.error
                }
                for r in results
            ]
        }

    except Exception as e:
        logger.error(f"Distribution failed: {e}")
        return {"status": "failed", "error": str(e)}


# ==================
# Pipeline Task
# ==================

@celery_app.task(bind=True, name="app.workers.tasks.run_full_pipeline")
def run_full_pipeline(self, custom_prompt: Optional[str] = None):
    """
    Run the complete content-to-distribution pipeline.

    Steps:
    1. Scrape daily content
    2. Generate script
    3. (Approval happens via Telegram bot - not in this task)
    4. Generate audio
    5. Generate video
    6. Post-process
    7. Distribute

    This task is typically triggered after script approval.
    """
    logger.info("Task: Starting full pipeline")

    # This would typically be orchestrated with chain() or chord()
    # For now, return the pipeline structure
    return {
        "status": "pipeline_defined",
        "steps": [
            "scrape_daily_content",
            "generate_script",
            "await_approval",  # Manual step
            "generate_audio",
            "generate_video",
            "post_process_media",
            "distribute_all"
        ]
    }
