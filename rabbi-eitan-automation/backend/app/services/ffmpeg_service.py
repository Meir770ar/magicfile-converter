"""
Rabbi Eitan - FFmpeg Post-Processing Service
Module C: Video post-processing with FFmpeg
"""
import os
import subprocess
import asyncio
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

import ffmpeg
from loguru import logger

from app.config import settings


@dataclass
class ProcessedVideo:
    """Data class for processed video."""
    file_path: str
    duration_seconds: float
    file_size_bytes: int
    resolution: str
    has_watermark: bool
    has_background_music: bool


class FFmpegService:
    """
    Service for video post-processing using FFmpeg.

    Features:
    - Merge high-quality audio with video
    - Add logo watermark
    - Add background music
    - Video compression for different platforms
    - NO subtitles (per requirement)
    """

    def __init__(self):
        self.output_dir = Path("/app/media/final")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.assets_dir = Path("/app/media/assets")
        self.assets_dir.mkdir(parents=True, exist_ok=True)

        # Default settings
        self.background_music_volume = settings.background_music_volume
        self.watermark_position = "bottom-right"

    async def process_video(
        self,
        video_path: str,
        audio_path: str,
        output_filename: str,
        logo_path: Optional[str] = None,
        music_path: Optional[str] = None,
        music_volume: Optional[float] = None
    ) -> ProcessedVideo:
        """
        Full video post-processing pipeline.

        Steps:
        1. Merge high-quality audio with video
        2. Add logo watermark (if provided)
        3. Add background music (if provided)

        Args:
            video_path: Path to HeyGen video
            audio_path: Path to ElevenLabs audio
            output_filename: Output filename (without extension)
            logo_path: Optional path to logo image
            music_path: Optional path to background music
            music_volume: Background music volume (0.0 to 1.0)

        Returns:
            ProcessedVideo with final video info
        """
        logger.info(f"Starting video post-processing: {output_filename}")

        video_path = Path(video_path)
        audio_path = Path(audio_path)
        output_path = self.output_dir / f"{output_filename}_final.mp4"

        # Temp paths for intermediate files
        temp_merged = self.output_dir / f"{output_filename}_merged.mp4"
        temp_watermark = self.output_dir / f"{output_filename}_watermark.mp4"

        try:
            # Step 1: Merge audio with video
            logger.info("Step 1: Merging audio with video")
            await self._merge_audio_video(
                str(video_path),
                str(audio_path),
                str(temp_merged)
            )

            current_video = temp_merged

            # Step 2: Add watermark (if logo provided)
            if logo_path and Path(logo_path).exists():
                logger.info("Step 2: Adding watermark")
                await self._add_watermark(
                    str(current_video),
                    logo_path,
                    str(temp_watermark)
                )
                current_video = temp_watermark
            else:
                logger.info("Step 2: Skipping watermark (no logo)")

            # Step 3: Add background music (if provided)
            if music_path and Path(music_path).exists():
                logger.info("Step 3: Adding background music")
                volume = music_volume or self.background_music_volume
                await self._add_background_music(
                    str(current_video),
                    music_path,
                    str(output_path),
                    volume
                )
            else:
                logger.info("Step 3: Skipping background music")
                # Copy current to final
                if current_video != output_path:
                    await self._copy_video(str(current_video), str(output_path))

            # Clean up temp files
            for temp in [temp_merged, temp_watermark]:
                if temp.exists() and temp != output_path:
                    temp.unlink()

            # Get video info
            info = await self._get_video_info(str(output_path))

            logger.success(f"Video processing complete: {output_path}")

            return ProcessedVideo(
                file_path=str(output_path),
                duration_seconds=info.get("duration", 0),
                file_size_bytes=output_path.stat().st_size,
                resolution=f"{info.get('width', 0)}x{info.get('height', 0)}",
                has_watermark=logo_path is not None,
                has_background_music=music_path is not None
            )

        except Exception as e:
            logger.error(f"Video processing failed: {e}")
            # Clean up temp files on error
            for temp in [temp_merged, temp_watermark]:
                if temp.exists():
                    temp.unlink()
            raise VideoProcessingError(f"Processing failed: {e}")

    async def _merge_audio_video(
        self,
        video_path: str,
        audio_path: str,
        output_path: str
    ):
        """Merge high-quality audio with video, replacing original audio."""
        try:
            (
                ffmpeg
                .input(video_path)
                .output(
                    ffmpeg.input(audio_path),
                    output_path,
                    vcodec='copy',
                    acodec='aac',
                    audio_bitrate='192k',
                    map=['0:v:0', '1:a:0'],
                    shortest=None
                )
                .overwrite_output()
                .run(quiet=True)
            )
        except ffmpeg.Error as e:
            raise VideoProcessingError(f"Audio merge failed: {e.stderr}")

    async def _add_watermark(
        self,
        video_path: str,
        logo_path: str,
        output_path: str,
        position: str = "bottom-right",
        padding: int = 20,
        opacity: float = 0.8
    ):
        """Add logo watermark to video."""
        # Position mapping
        position_map = {
            "top-left": f"{padding}:{padding}",
            "top-right": f"W-w-{padding}:{padding}",
            "bottom-left": f"{padding}:H-h-{padding}",
            "bottom-right": f"W-w-{padding}:H-h-{padding}",
            "center": "(W-w)/2:(H-h)/2"
        }

        overlay_pos = position_map.get(position, position_map["bottom-right"])

        try:
            video = ffmpeg.input(video_path)
            logo = ffmpeg.input(logo_path)

            # Scale logo to reasonable size (10% of video width)
            logo_scaled = logo.filter('scale', 'iw*0.1', '-1')

            # Apply opacity
            if opacity < 1.0:
                logo_scaled = logo_scaled.filter('colorchannelmixer', aa=opacity)

            # Overlay
            output = ffmpeg.overlay(video, logo_scaled, x=overlay_pos.split(':')[0], y=overlay_pos.split(':')[1])

            (
                output
                .output(output_path, vcodec='libx264', acodec='copy')
                .overwrite_output()
                .run(quiet=True)
            )
        except ffmpeg.Error as e:
            raise VideoProcessingError(f"Watermark failed: {e.stderr}")

    async def _add_background_music(
        self,
        video_path: str,
        music_path: str,
        output_path: str,
        music_volume: float = 0.15
    ):
        """Add background music mixed with original audio."""
        try:
            video = ffmpeg.input(video_path)
            music = ffmpeg.input(music_path, stream_loop=-1)  # Loop music

            # Get video duration
            info = await self._get_video_info(video_path)
            duration = info.get("duration", 60)

            # Trim music to video length
            music_trimmed = music.filter('atrim', duration=duration)

            # Adjust music volume
            music_quiet = music_trimmed.filter('volume', music_volume)

            # Mix audio streams
            mixed_audio = ffmpeg.filter(
                [video.audio, music_quiet],
                'amix',
                inputs=2,
                duration='shortest'
            )

            (
                ffmpeg
                .output(video.video, mixed_audio, output_path,
                        vcodec='copy', acodec='aac', audio_bitrate='192k')
                .overwrite_output()
                .run(quiet=True)
            )
        except ffmpeg.Error as e:
            raise VideoProcessingError(f"Background music failed: {e.stderr}")

    async def compress_for_whatsapp(
        self,
        video_path: str,
        output_filename: str,
        target_resolution: int = 720
    ) -> str:
        """
        Compress video for WhatsApp sharing.
        Target: 720p, reasonable file size.
        """
        output_path = self.output_dir / f"{output_filename}_whatsapp.mp4"

        try:
            (
                ffmpeg
                .input(video_path)
                .output(
                    str(output_path),
                    vf=f'scale=-2:{target_resolution}',
                    vcodec='libx264',
                    crf=28,
                    preset='medium',
                    acodec='aac',
                    audio_bitrate='128k',
                    movflags='+faststart'
                )
                .overwrite_output()
                .run(quiet=True)
            )

            logger.info(f"Compressed for WhatsApp: {output_path}")
            return str(output_path)

        except ffmpeg.Error as e:
            raise VideoProcessingError(f"Compression failed: {e.stderr}")

    async def _copy_video(self, input_path: str, output_path: str):
        """Copy video without re-encoding."""
        try:
            (
                ffmpeg
                .input(input_path)
                .output(output_path, c='copy')
                .overwrite_output()
                .run(quiet=True)
            )
        except ffmpeg.Error as e:
            raise VideoProcessingError(f"Copy failed: {e.stderr}")

    async def _get_video_info(self, video_path: str) -> dict:
        """Get video metadata."""
        try:
            probe = ffmpeg.probe(video_path)
            video_stream = next(
                (s for s in probe['streams'] if s['codec_type'] == 'video'),
                None
            )

            if video_stream:
                return {
                    "duration": float(probe['format'].get('duration', 0)),
                    "width": int(video_stream.get('width', 0)),
                    "height": int(video_stream.get('height', 0)),
                    "codec": video_stream.get('codec_name'),
                    "fps": eval(video_stream.get('r_frame_rate', '0/1'))
                }

            return {}

        except ffmpeg.Error:
            return {}

    async def extract_thumbnail(
        self,
        video_path: str,
        output_path: str,
        timestamp: float = 1.0
    ) -> str:
        """Extract thumbnail from video."""
        try:
            (
                ffmpeg
                .input(video_path, ss=timestamp)
                .output(output_path, vframes=1)
                .overwrite_output()
                .run(quiet=True)
            )
            return output_path
        except ffmpeg.Error as e:
            raise VideoProcessingError(f"Thumbnail extraction failed: {e.stderr}")


class VideoProcessingError(Exception):
    """Raised when video processing fails."""
    pass


# Singleton instance
_ffmpeg_service: Optional[FFmpegService] = None


def get_ffmpeg_service() -> FFmpegService:
    """Get or create FFmpeg service instance."""
    global _ffmpeg_service
    if _ffmpeg_service is None:
        _ffmpeg_service = FFmpegService()
    return _ffmpeg_service
