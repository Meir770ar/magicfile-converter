"""
Rabbi Eitan - ElevenLabs Audio Service
Module C: High-quality TTS using ElevenLabs Flash v2.5
"""
import os
import asyncio
from pathlib import Path
from typing import Optional, List
from dataclasses import dataclass

import httpx
from loguru import logger

from app.config import settings


@dataclass
class VoiceInfo:
    """Data class for voice information."""
    voice_id: str
    name: str
    language: str
    preview_url: Optional[str] = None


@dataclass
class AudioResult:
    """Data class for generated audio."""
    file_path: str
    duration_seconds: float
    file_size_bytes: int
    voice_id: str
    model: str
    characters_used: int


class ElevenLabsService:
    """
    Service for generating high-quality TTS audio using ElevenLabs.

    Features:
    - Flash v2.5 model for fast, quality Hebrew speech
    - Voice selection
    - Streaming support
    """

    BASE_URL = "https://api.elevenlabs.io/v1"

    # Models
    MODEL_FLASH = "eleven_flash_v2_5"
    MODEL_MULTILINGUAL = "eleven_multilingual_v2"
    MODEL_TURBO = "eleven_turbo_v2_5"

    def __init__(self):
        if not settings.elevenlabs_api_key:
            raise ValueError("ELEVENLABS_API_KEY is not configured")

        self.api_key = settings.elevenlabs_api_key
        self.voice_id = settings.elevenlabs_voice_id

        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers={
                "xi-api-key": self.api_key,
                "Content-Type": "application/json"
            },
            timeout=120.0
        )

        self.output_dir = Path("/app/media/audio")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    async def generate_audio(
        self,
        text: str,
        output_filename: str,
        voice_id: Optional[str] = None,
        model: str = MODEL_FLASH,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0
    ) -> AudioResult:
        """
        Generate audio from text using ElevenLabs TTS.

        Args:
            text: Text to convert to speech
            output_filename: Name for output file (without extension)
            voice_id: Voice ID to use (defaults to configured voice)
            model: TTS model to use
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity (0-1)
            style: Style exaggeration (0-1)

        Returns:
            AudioResult with file path and metadata
        """
        voice_id = voice_id or self.voice_id
        if not voice_id:
            raise ValueError("No voice_id configured or provided")

        logger.info(f"Generating audio: {len(text)} chars with voice {voice_id}")

        output_path = self.output_dir / f"{output_filename}.mp3"

        try:
            response = await self.client.post(
                f"/text-to-speech/{voice_id}",
                json={
                    "text": text,
                    "model_id": model,
                    "voice_settings": {
                        "stability": stability,
                        "similarity_boost": similarity_boost,
                        "style": style,
                        "use_speaker_boost": True
                    }
                }
            )
            response.raise_for_status()

            # Save audio file
            with open(output_path, "wb") as f:
                f.write(response.content)

            # Get file info
            file_size = output_path.stat().st_size

            # Estimate duration (rough: MP3 at 128kbps)
            duration = file_size / (128 * 1024 / 8)

            logger.success(f"Audio generated: {output_path} ({file_size} bytes)")

            return AudioResult(
                file_path=str(output_path),
                duration_seconds=duration,
                file_size_bytes=file_size,
                voice_id=voice_id,
                model=model,
                characters_used=len(text)
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"ElevenLabs API error: {e.response.status_code} - {e.response.text}")
            raise AudioGenerationError(f"API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Audio generation failed: {e}")
            raise AudioGenerationError(f"Failed to generate audio: {e}")

    async def generate_audio_stream(
        self,
        text: str,
        output_filename: str,
        voice_id: Optional[str] = None,
        model: str = MODEL_FLASH
    ) -> AudioResult:
        """
        Generate audio with streaming (for longer texts).
        Writes chunks to file as they arrive.
        """
        voice_id = voice_id or self.voice_id
        if not voice_id:
            raise ValueError("No voice_id configured")

        output_path = self.output_dir / f"{output_filename}.mp3"

        logger.info(f"Streaming audio generation: {len(text)} chars")

        try:
            async with self.client.stream(
                "POST",
                f"/text-to-speech/{voice_id}/stream",
                json={
                    "text": text,
                    "model_id": model,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            ) as response:
                response.raise_for_status()

                with open(output_path, "wb") as f:
                    async for chunk in response.aiter_bytes():
                        f.write(chunk)

            file_size = output_path.stat().st_size
            duration = file_size / (128 * 1024 / 8)

            return AudioResult(
                file_path=str(output_path),
                duration_seconds=duration,
                file_size_bytes=file_size,
                voice_id=voice_id,
                model=model,
                characters_used=len(text)
            )

        except Exception as e:
            logger.error(f"Streaming audio failed: {e}")
            raise AudioGenerationError(f"Failed to stream audio: {e}")

    async def list_voices(self) -> List[VoiceInfo]:
        """Get list of available voices."""
        try:
            response = await self.client.get("/voices")
            response.raise_for_status()

            data = response.json()
            voices = []

            for voice in data.get("voices", []):
                # Filter for Hebrew-capable voices
                labels = voice.get("labels", {})

                voices.append(VoiceInfo(
                    voice_id=voice["voice_id"],
                    name=voice["name"],
                    language=labels.get("language", "unknown"),
                    preview_url=voice.get("preview_url")
                ))

            return voices

        except Exception as e:
            logger.error(f"Failed to list voices: {e}")
            return []

    async def get_user_info(self) -> dict:
        """Get user account info including character usage."""
        try:
            response = await self.client.get("/user")
            response.raise_for_status()

            data = response.json()
            subscription = data.get("subscription", {})

            return {
                "character_count": subscription.get("character_count", 0),
                "character_limit": subscription.get("character_limit", 0),
                "characters_remaining": subscription.get("character_limit", 0) - subscription.get("character_count", 0),
                "tier": subscription.get("tier", "unknown")
            }

        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return {}

    async def get_recommended_hebrew_voices(self) -> List[VoiceInfo]:
        """Get voices recommended for Hebrew content."""
        voices = await self.list_voices()

        # Filter for multilingual or Hebrew voices
        hebrew_voices = [
            v for v in voices
            if "hebrew" in v.language.lower() or "multilingual" in v.name.lower()
        ]

        return hebrew_voices or voices[:5]  # Return first 5 if no Hebrew specific

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class AudioGenerationError(Exception):
    """Raised when audio generation fails."""
    pass


# Singleton instance
_elevenlabs_service: Optional[ElevenLabsService] = None


def get_elevenlabs_service() -> ElevenLabsService:
    """Get or create ElevenLabs service instance."""
    global _elevenlabs_service
    if _elevenlabs_service is None:
        _elevenlabs_service = ElevenLabsService()
    return _elevenlabs_service
