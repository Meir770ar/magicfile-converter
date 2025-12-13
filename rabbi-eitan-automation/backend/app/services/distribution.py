"""
Rabbi Eitan - Distribution Service
Module D: Multi-platform video distribution
"""
import asyncio
from pathlib import Path
from typing import Optional, List
from dataclasses import dataclass
from enum import Enum

import httpx
from telegram import Bot
from telegram.error import TelegramError
from loguru import logger

from app.config import settings
from app.services.ffmpeg_service import get_ffmpeg_service


class Platform(Enum):
    """Distribution platforms."""
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"


class DistributionStatus(Enum):
    """Distribution status."""
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"


@dataclass
class DistributionResult:
    """Data class for distribution result."""
    platform: Platform
    status: DistributionStatus
    message_id: Optional[str] = None
    error: Optional[str] = None


class TelegramDistributor:
    """
    Telegram channel distribution.
    Max file size: 50MB
    """

    MAX_FILE_SIZE_MB = 50

    def __init__(self):
        if not settings.telegram_bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN not configured")

        self.bot = Bot(token=settings.telegram_bot_token)
        self.channel_id = settings.telegram_channel_id

    async def send_video(
        self,
        video_path: str,
        caption: str,
        channel_id: Optional[str] = None
    ) -> DistributionResult:
        """
        Send video to Telegram channel.

        Args:
            video_path: Path to video file
            caption: Video caption
            channel_id: Channel ID (defaults to configured channel)

        Returns:
            DistributionResult with status
        """
        channel_id = channel_id or self.channel_id
        if not channel_id:
            return DistributionResult(
                platform=Platform.TELEGRAM,
                status=DistributionStatus.FAILED,
                error="No channel_id configured"
            )

        video_path = Path(video_path)

        # Check file size
        file_size_mb = video_path.stat().st_size / (1024 * 1024)
        if file_size_mb > self.MAX_FILE_SIZE_MB:
            logger.warning(f"File too large for Telegram: {file_size_mb:.1f}MB")
            return DistributionResult(
                platform=Platform.TELEGRAM,
                status=DistributionStatus.FAILED,
                error=f"File too large: {file_size_mb:.1f}MB (max {self.MAX_FILE_SIZE_MB}MB)"
            )

        try:
            logger.info(f"Sending video to Telegram channel: {channel_id}")

            with open(video_path, 'rb') as video_file:
                message = await self.bot.send_video(
                    chat_id=channel_id,
                    video=video_file,
                    caption=caption,
                    parse_mode='Markdown',
                    supports_streaming=True
                )

            logger.success(f"Video sent to Telegram: message_id={message.message_id}")

            return DistributionResult(
                platform=Platform.TELEGRAM,
                status=DistributionStatus.SENT,
                message_id=str(message.message_id)
            )

        except TelegramError as e:
            logger.error(f"Telegram send failed: {e}")
            return DistributionResult(
                platform=Platform.TELEGRAM,
                status=DistributionStatus.FAILED,
                error=str(e)
            )

    async def send_to_admin(
        self,
        video_path: str,
        caption: str
    ) -> DistributionResult:
        """Send video to admin for preview before channel posting."""
        admin_id = settings.telegram_admin_id
        if not admin_id:
            return DistributionResult(
                platform=Platform.TELEGRAM,
                status=DistributionStatus.FAILED,
                error="No admin_id configured"
            )

        return await self.send_video(video_path, caption, admin_id)


class WhatsAppDistributor:
    """
    WhatsApp distribution via API.
    Supports Green-API or similar services.
    Auto-compresses to 720p.
    """

    def __init__(self):
        self.api_url = settings.whatsapp_api_url
        self.instance_id = settings.whatsapp_instance_id
        self.api_token = settings.whatsapp_api_token

        self.client = httpx.AsyncClient(timeout=120.0)
        self.ffmpeg = get_ffmpeg_service()

    async def send_video(
        self,
        video_path: str,
        caption: str,
        phone_number: Optional[str] = None,
        group_id: Optional[str] = None,
        compress: bool = True
    ) -> DistributionResult:
        """
        Send video via WhatsApp.

        Args:
            video_path: Path to video file
            caption: Video caption
            phone_number: Recipient phone number
            group_id: WhatsApp group ID
            compress: Whether to compress to 720p

        Returns:
            DistributionResult with status
        """
        if not self.api_url or not self.api_token:
            return DistributionResult(
                platform=Platform.WHATSAPP,
                status=DistributionStatus.FAILED,
                error="WhatsApp API not configured"
            )

        if not phone_number and not group_id:
            return DistributionResult(
                platform=Platform.WHATSAPP,
                status=DistributionStatus.FAILED,
                error="No recipient specified"
            )

        try:
            # Compress video if needed
            if compress:
                logger.info("Compressing video for WhatsApp...")
                video_path = await self.ffmpeg.compress_for_whatsapp(
                    video_path,
                    Path(video_path).stem,
                    target_resolution=settings.whatsapp_video_resolution
                )

            video_path = Path(video_path)

            # Prepare recipient
            chat_id = group_id or f"{phone_number}@c.us"

            logger.info(f"Sending video to WhatsApp: {chat_id}")

            # Upload and send (Green-API style)
            # First upload the file
            with open(video_path, 'rb') as f:
                files = {'file': (video_path.name, f, 'video/mp4')}
                response = await self.client.post(
                    f"{self.api_url}/waInstance{self.instance_id}/sendFileByUpload/{self.api_token}",
                    files=files,
                    data={
                        'chatId': chat_id,
                        'caption': caption
                    }
                )

            if response.status_code == 200:
                data = response.json()
                logger.success(f"Video sent to WhatsApp: {data.get('idMessage')}")

                return DistributionResult(
                    platform=Platform.WHATSAPP,
                    status=DistributionStatus.SENT,
                    message_id=data.get('idMessage')
                )
            else:
                error = response.text
                logger.error(f"WhatsApp send failed: {error}")
                return DistributionResult(
                    platform=Platform.WHATSAPP,
                    status=DistributionStatus.FAILED,
                    error=error
                )

        except Exception as e:
            logger.error(f"WhatsApp distribution failed: {e}")
            return DistributionResult(
                platform=Platform.WHATSAPP,
                status=DistributionStatus.FAILED,
                error=str(e)
            )

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class DistributionService:
    """
    Main distribution service coordinating all platforms.
    """

    def __init__(self):
        self.telegram = TelegramDistributor()
        self.whatsapp = WhatsAppDistributor()

    async def distribute(
        self,
        video_path: str,
        caption: str,
        platforms: List[Platform] = None
    ) -> List[DistributionResult]:
        """
        Distribute video to multiple platforms.

        Args:
            video_path: Path to video file
            caption: Video caption
            platforms: List of platforms to send to

        Returns:
            List of DistributionResult for each platform
        """
        if platforms is None:
            platforms = [Platform.TELEGRAM, Platform.WHATSAPP]

        results = []

        for platform in platforms:
            logger.info(f"Distributing to {platform.value}...")

            if platform == Platform.TELEGRAM:
                result = await self.telegram.send_video(video_path, caption)
            elif platform == Platform.WHATSAPP:
                result = await self.whatsapp.send_video(video_path, caption)
            else:
                result = DistributionResult(
                    platform=platform,
                    status=DistributionStatus.FAILED,
                    error="Unknown platform"
                )

            results.append(result)

            # Small delay between platforms
            if len(platforms) > 1:
                await asyncio.sleep(2)

        # Log summary
        sent = sum(1 for r in results if r.status == DistributionStatus.SENT)
        failed = sum(1 for r in results if r.status == DistributionStatus.FAILED)
        logger.info(f"Distribution complete: {sent} sent, {failed} failed")

        return results

    async def send_preview(
        self,
        video_path: str,
        caption: str
    ) -> DistributionResult:
        """Send preview to admin before full distribution."""
        return await self.telegram.send_to_admin(video_path, caption)


# Singleton instance
_distribution_service: Optional[DistributionService] = None


def get_distribution_service() -> DistributionService:
    """Get or create distribution service instance."""
    global _distribution_service
    if _distribution_service is None:
        _distribution_service = DistributionService()
    return _distribution_service
