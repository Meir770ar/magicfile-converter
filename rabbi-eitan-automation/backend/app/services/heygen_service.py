"""
Rabbi Eitan - HeyGen Video Service
Module C: Avatar video generation using HeyGen API
"""
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

import httpx
from loguru import logger

from app.config import settings


class VideoStatus(Enum):
    """HeyGen video generation status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class VideoResult:
    """Data class for generated video."""
    video_id: str
    file_path: Optional[str]
    video_url: Optional[str]
    duration_seconds: float
    status: VideoStatus
    thumbnail_url: Optional[str] = None


class HeyGenService:
    """
    Service for generating avatar videos using HeyGen API.

    Features:
    - Avatar video generation with custom audio
    - Long polling for status (videos can take up to 30 minutes)
    - Download completed videos
    """

    BASE_URL = "https://api.heygen.com/v2"

    # Polling settings
    POLL_INTERVAL = 30  # seconds
    MAX_POLL_TIME = 1800  # 30 minutes

    def __init__(self):
        if not settings.heygen_api_key:
            raise ValueError("HEYGEN_API_KEY is not configured")

        self.api_key = settings.heygen_api_key
        self.avatar_id = settings.heygen_avatar_id

        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={
                "X-Api-Key": self.api_key,
                "Content-Type": "application/json"
            },
            timeout=60.0
        )

        self.output_dir = Path("/app/media/video")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    async def generate_video(
        self,
        script_text: str,
        audio_path: Optional[str] = None,
        avatar_id: Optional[str] = None,
        output_filename: str = "output"
    ) -> VideoResult:
        """
        Generate avatar video from script or audio.

        Args:
            script_text: Script text (used if no audio provided)
            audio_path: Path to audio file to use
            avatar_id: Avatar to use (defaults to configured avatar)
            output_filename: Name for output file

        Returns:
            VideoResult with video info
        """
        avatar_id = avatar_id or self.avatar_id
        if not avatar_id:
            raise ValueError("No avatar_id configured")

        logger.info(f"Generating HeyGen video with avatar {avatar_id}")

        try:
            # Build video generation request
            if audio_path:
                # Use provided audio
                video_id = await self._create_video_with_audio(
                    avatar_id, audio_path, script_text
                )
            else:
                # Use HeyGen's TTS
                video_id = await self._create_video_with_tts(
                    avatar_id, script_text
                )

            logger.info(f"Video generation started: {video_id}")

            # Poll for completion
            result = await self._poll_video_status(video_id)

            if result.status == VideoStatus.COMPLETED and result.video_url:
                # Download the video
                output_path = await self._download_video(
                    result.video_url,
                    output_filename
                )
                result.file_path = output_path

            return result

        except Exception as e:
            logger.error(f"Video generation failed: {e}")
            raise VideoGenerationError(f"Failed to generate video: {e}")

    async def _create_video_with_audio(
        self,
        avatar_id: str,
        audio_path: str,
        script_text: str
    ) -> str:
        """Create video using provided audio file."""

        # First, upload the audio
        audio_url = await self._upload_audio(audio_path)

        # Create video request
        payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id,
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "audio",
                        "audio_url": audio_url
                    },
                    "background": {
                        "type": "color",
                        "value": "#FFFFFF"
                    }
                }
            ],
            "dimension": {
                "width": 1080,
                "height": 1920  # Vertical for social media
            },
            "aspect_ratio": "9:16"
        }

        response = await self.client.post("/video/generate", json=payload)
        response.raise_for_status()

        data = response.json()
        return data["data"]["video_id"]

    async def _create_video_with_tts(
        self,
        avatar_id: str,
        script_text: str
    ) -> str:
        """Create video using HeyGen's TTS."""

        payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id,
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": script_text,
                        "voice_id": "he-IL-AvriNeural"  # Hebrew voice
                    },
                    "background": {
                        "type": "color",
                        "value": "#FFFFFF"
                    }
                }
            ],
            "dimension": {
                "width": 1080,
                "height": 1920
            }
        }

        response = await self.client.post("/video/generate", json=payload)
        response.raise_for_status()

        data = response.json()
        return data["data"]["video_id"]

    async def _upload_audio(self, audio_path: str) -> str:
        """Upload audio file to HeyGen."""
        audio_path = Path(audio_path)

        # Get upload URL
        response = await self.client.post(
            "/asset",
            json={"content_type": "audio/mpeg"}
        )
        response.raise_for_status()

        data = response.json()
        upload_url = data["data"]["url"]

        # Upload file
        with open(audio_path, "rb") as f:
            async with httpx.AsyncClient() as upload_client:
                await upload_client.put(
                    upload_url,
                    content=f.read(),
                    headers={"Content-Type": "audio/mpeg"}
                )

        return data["data"]["url"]

    async def _poll_video_status(self, video_id: str) -> VideoResult:
        """Poll for video generation status."""
        start_time = asyncio.get_event_loop().time()

        while True:
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > self.MAX_POLL_TIME:
                logger.error(f"Video generation timed out: {video_id}")
                return VideoResult(
                    video_id=video_id,
                    file_path=None,
                    video_url=None,
                    duration_seconds=0,
                    status=VideoStatus.FAILED
                )

            # Check status
            try:
                response = await self.client.get(f"/video/{video_id}")
                response.raise_for_status()

                data = response.json()
                status_str = data["data"]["status"]

                logger.debug(f"Video {video_id} status: {status_str}")

                if status_str == "completed":
                    return VideoResult(
                        video_id=video_id,
                        file_path=None,
                        video_url=data["data"].get("video_url"),
                        duration_seconds=data["data"].get("duration", 0),
                        status=VideoStatus.COMPLETED,
                        thumbnail_url=data["data"].get("thumbnail_url")
                    )

                elif status_str == "failed":
                    error = data["data"].get("error", "Unknown error")
                    logger.error(f"Video generation failed: {error}")
                    return VideoResult(
                        video_id=video_id,
                        file_path=None,
                        video_url=None,
                        duration_seconds=0,
                        status=VideoStatus.FAILED
                    )

            except Exception as e:
                logger.warning(f"Poll error: {e}")

            # Wait before next poll
            await asyncio.sleep(self.POLL_INTERVAL)
            logger.info(f"Waiting for video... ({int(elapsed)}s elapsed)")

    async def _download_video(self, video_url: str, output_filename: str) -> str:
        """Download completed video."""
        output_path = self.output_dir / f"{output_filename}.mp4"

        async with httpx.AsyncClient() as client:
            response = await client.get(video_url)
            response.raise_for_status()

            with open(output_path, "wb") as f:
                f.write(response.content)

        logger.success(f"Video downloaded: {output_path}")
        return str(output_path)

    async def list_avatars(self) -> list:
        """Get list of available avatars."""
        try:
            response = await self.client.get("/avatars")
            response.raise_for_status()

            data = response.json()
            return data.get("data", {}).get("avatars", [])

        except Exception as e:
            logger.error(f"Failed to list avatars: {e}")
            return []

    async def get_remaining_credits(self) -> dict:
        """Get remaining video credits."""
        try:
            response = await self.client.get("/user/remaining_quota")
            response.raise_for_status()

            data = response.json()
            return {
                "remaining_videos": data.get("data", {}).get("remaining_quota", 0),
                "used_this_month": data.get("data", {}).get("used_quota", 0)
            }

        except Exception as e:
            logger.error(f"Failed to get credits: {e}")
            return {"remaining_videos": 0}

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class VideoGenerationError(Exception):
    """Raised when video generation fails."""
    pass


# Singleton instance
_heygen_service: Optional[HeyGenService] = None


def get_heygen_service() -> HeyGenService:
    """Get or create HeyGen service instance."""
    global _heygen_service
    if _heygen_service is None:
        _heygen_service = HeyGenService()
    return _heygen_service
