"""
Rabbi Eitan - Whisper Transcription Service
Module B: Voice note transcription using OpenAI Whisper
"""
import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

from openai import AsyncOpenAI
from pydub import AudioSegment
from loguru import logger

from app.config import settings


@dataclass
class TranscriptionResult:
    """Data class for transcription result."""
    text: str
    language: str
    duration_seconds: float
    confidence: Optional[float] = None


class WhisperService:
    """
    Service for transcribing voice notes using OpenAI Whisper API.

    Supports:
    - OGG files (Telegram voice notes)
    - MP3, WAV, M4A files
    - Hebrew language detection
    """

    SUPPORTED_FORMATS = {'.ogg', '.mp3', '.wav', '.m4a', '.webm', '.mp4'}
    MAX_FILE_SIZE_MB = 25  # OpenAI limit

    def __init__(self):
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.temp_dir = Path("/app/media/temp/audio")
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    async def transcribe(
        self,
        audio_path: str,
        language: str = "he"
    ) -> TranscriptionResult:
        """
        Transcribe an audio file to text.

        Args:
            audio_path: Path to the audio file
            language: Language code (default: Hebrew)

        Returns:
            TranscriptionResult with transcribed text
        """
        audio_path = Path(audio_path)

        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Check format
        if audio_path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {audio_path.suffix}")

        logger.info(f"Transcribing: {audio_path.name}")

        # Convert to MP3 if needed (Whisper works best with MP3)
        processed_path = await self._prepare_audio(audio_path)

        try:
            # Get audio duration
            audio = AudioSegment.from_file(str(processed_path))
            duration_seconds = len(audio) / 1000.0

            # Check file size
            file_size_mb = processed_path.stat().st_size / (1024 * 1024)
            if file_size_mb > self.MAX_FILE_SIZE_MB:
                raise ValueError(f"File too large: {file_size_mb:.1f}MB (max {self.MAX_FILE_SIZE_MB}MB)")

            # Transcribe
            with open(processed_path, "rb") as audio_file:
                response = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json"
                )

            logger.success(f"Transcription complete: {len(response.text)} chars")

            return TranscriptionResult(
                text=response.text,
                language=response.language,
                duration_seconds=duration_seconds,
                confidence=None  # Whisper doesn't provide confidence scores
            )

        finally:
            # Cleanup temp file if we converted
            if processed_path != audio_path and processed_path.exists():
                processed_path.unlink()

    async def _prepare_audio(self, audio_path: Path) -> Path:
        """
        Prepare audio file for transcription.
        Converts OGG to MP3 if needed.
        """
        if audio_path.suffix.lower() == '.mp3':
            return audio_path

        # Convert to MP3
        output_path = self.temp_dir / f"{audio_path.stem}_converted.mp3"

        try:
            logger.debug(f"Converting {audio_path.suffix} to MP3")

            # Load audio
            if audio_path.suffix.lower() == '.ogg':
                audio = AudioSegment.from_ogg(str(audio_path))
            else:
                audio = AudioSegment.from_file(str(audio_path))

            # Export as MP3
            audio.export(
                str(output_path),
                format="mp3",
                parameters=["-q:a", "2"]  # Good quality
            )

            logger.debug(f"Converted to: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Audio conversion failed: {e}")
            # Try to use original file
            return audio_path

    async def transcribe_with_timestamps(
        self,
        audio_path: str,
        language: str = "he"
    ) -> dict:
        """
        Transcribe with word-level timestamps.

        Args:
            audio_path: Path to the audio file
            language: Language code

        Returns:
            Dict with text, segments, and word timestamps
        """
        audio_path = Path(audio_path)
        processed_path = await self._prepare_audio(audio_path)

        try:
            with open(processed_path, "rb") as audio_file:
                response = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    timestamp_granularities=["word", "segment"]
                )

            return {
                "text": response.text,
                "language": response.language,
                "duration": response.duration,
                "segments": [
                    {
                        "id": seg.id,
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text
                    }
                    for seg in (response.segments or [])
                ],
                "words": [
                    {
                        "word": word.word,
                        "start": word.start,
                        "end": word.end
                    }
                    for word in (response.words or [])
                ]
            }

        finally:
            if processed_path != audio_path and processed_path.exists():
                processed_path.unlink()


class LocalWhisperService:
    """
    Alternative service using local Whisper model.
    Use when you want to avoid API costs or need offline capability.
    """

    def __init__(self, model_size: str = "base"):
        """
        Initialize local Whisper.

        Args:
            model_size: One of 'tiny', 'base', 'small', 'medium', 'large'
        """
        try:
            import whisper
            logger.info(f"Loading local Whisper model: {model_size}")
            self.model = whisper.load_model(model_size)
            logger.success("Local Whisper model loaded")
        except ImportError:
            raise ImportError("openai-whisper package required for local transcription")

    def transcribe(
        self,
        audio_path: str,
        language: str = "he"
    ) -> TranscriptionResult:
        """
        Transcribe using local Whisper model.
        Note: This is synchronous, not async.
        """
        import whisper

        logger.info(f"Local transcription: {audio_path}")

        result = self.model.transcribe(
            audio_path,
            language=language,
            task="transcribe"
        )

        return TranscriptionResult(
            text=result["text"],
            language=result.get("language", language),
            duration_seconds=0,  # Would need to calculate
            confidence=None
        )


# Singleton instance
_whisper_service: Optional[WhisperService] = None


def get_whisper_service() -> WhisperService:
    """Get or create Whisper service instance."""
    global _whisper_service
    if _whisper_service is None:
        _whisper_service = WhisperService()
    return _whisper_service
