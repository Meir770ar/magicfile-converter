"""
Rabbi Eitan - Telegram Approval Bot
Module B: Script approval via Telegram with voice note support
"""
import os
import asyncio
from typing import Optional, Callable, Dict, Any
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, Voice
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes
)
from loguru import logger

from app.config import settings


class ApprovalStatus(Enum):
    """Script approval status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EDITING = "editing"


@dataclass
class ApprovalRequest:
    """Data class for approval request."""
    script_id: str
    script_text: str
    content_title: str
    version: int


@dataclass
class ApprovalResponse:
    """Data class for approval response."""
    script_id: str
    status: ApprovalStatus
    edited_text: Optional[str] = None
    voice_file_path: Optional[str] = None
    notes: Optional[str] = None


class TelegramApprovalBot:
    """
    Telegram bot for script approval workflow.

    Features:
    - Send script for approval with approve/reject buttons
    - Accept text edits via message
    - Accept voice note corrections (transcribed via Whisper)
    """

    def __init__(self):
        if not settings.telegram_bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN is not configured")

        self.bot_token = settings.telegram_bot_token
        self.admin_id = int(settings.telegram_admin_id) if settings.telegram_admin_id else None
        self.channel_id = settings.telegram_channel_id

        # Callbacks for approval events
        self._on_approved: Optional[Callable] = None
        self._on_rejected: Optional[Callable] = None
        self._on_edited: Optional[Callable] = None
        self._on_voice_note: Optional[Callable] = None

        # Track pending approvals
        self._pending_scripts: Dict[str, ApprovalRequest] = {}

        # Temp directory for voice files
        self.voice_dir = Path("/app/media/temp/voice")
        self.voice_dir.mkdir(parents=True, exist_ok=True)

        # Build application
        self.app = Application.builder().token(self.bot_token).build()
        self._setup_handlers()

    def _setup_handlers(self):
        """Setup bot command and message handlers."""
        # Commands
        self.app.add_handler(CommandHandler("start", self._cmd_start))
        self.app.add_handler(CommandHandler("status", self._cmd_status))
        self.app.add_handler(CommandHandler("help", self._cmd_help))

        # Callback queries (button presses)
        self.app.add_handler(CallbackQueryHandler(self._handle_callback))

        # Text messages (edits)
        self.app.add_handler(MessageHandler(
            filters.TEXT & ~filters.COMMAND,
            self._handle_text_message
        ))

        # Voice notes
        self.app.add_handler(MessageHandler(
            filters.VOICE,
            self._handle_voice_note
        ))

    async def start(self):
        """Start the bot."""
        logger.info("Starting Telegram approval bot...")
        await self.app.initialize()
        await self.app.start()
        await self.app.updater.start_polling()
        logger.success("Telegram bot started successfully")

    async def stop(self):
        """Stop the bot."""
        logger.info("Stopping Telegram approval bot...")
        await self.app.updater.stop()
        await self.app.stop()
        await self.app.shutdown()

    async def send_for_approval(self, request: ApprovalRequest) -> bool:
        """
        Send a script for admin approval.

        Args:
            request: ApprovalRequest with script details

        Returns:
            True if sent successfully
        """
        if not self.admin_id:
            logger.error("Admin ID not configured")
            return False

        # Store pending request
        self._pending_scripts[request.script_id] = request

        # Build message
        message = f"""
📝 *תסריט חדש לאישור*

*כותרת:* {request.content_title}
*גרסה:* {request.version}

---

{request.script_text}

---

*אפשרויות:*
✅ לחץ "אישור" להמשיך להפקה
✏️ שלח הודעת טקסט לעריכה
🎤 שלח הודעה קולית לתיקון
❌ לחץ "דחייה" לבטל
"""

        # Build keyboard
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ אישור", callback_data=f"approve:{request.script_id}"),
                InlineKeyboardButton("❌ דחייה", callback_data=f"reject:{request.script_id}")
            ],
            [
                InlineKeyboardButton("🔄 יצירה מחדש", callback_data=f"regenerate:{request.script_id}")
            ]
        ])

        try:
            await self.app.bot.send_message(
                chat_id=self.admin_id,
                text=message,
                parse_mode="Markdown",
                reply_markup=keyboard
            )
            logger.info(f"Sent script {request.script_id} for approval")
            return True
        except Exception as e:
            logger.error(f"Failed to send approval request: {e}")
            return False

    # ==================
    # Command Handlers
    # ==================

    async def _cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        await update.message.reply_text(
            "🤖 *הרב איתן - בוט אישורים*\n\n"
            "אני מנהל את אישור התסריטים.\n"
            "כשיגיע תסריט חדש, תקבל הודעה עם אפשרויות.\n\n"
            "פקודות:\n"
            "/status - סטטוס נוכחי\n"
            "/help - עזרה",
            parse_mode="Markdown"
        )

    async def _cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command."""
        pending_count = len(self._pending_scripts)
        await update.message.reply_text(
            f"📊 *סטטוס*\n\n"
            f"תסריטים ממתינים: {pending_count}",
            parse_mode="Markdown"
        )

    async def _cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command."""
        await update.message.reply_text(
            "📖 *עזרה*\n\n"
            "*אישור תסריט:*\n"
            "• ✅ אישור - ממשיך להפקת וידאו\n"
            "• ❌ דחייה - מבטל את התסריט\n"
            "• 🔄 יצירה מחדש - מייצר תסריט חדש\n\n"
            "*עריכת תסריט:*\n"
            "• שלח הודעת טקסט - מחליף את התסריט\n"
            "• שלח הודעה קולית - אני אתמלל ואשלב את ההערות\n\n"
            "*פקודות:*\n"
            "/status - סטטוס\n"
            "/help - עזרה זו",
            parse_mode="Markdown"
        )

    # ==================
    # Callback Handlers
    # ==================

    async def _handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callback queries."""
        query = update.callback_query
        await query.answer()

        data = query.data
        action, script_id = data.split(":", 1)

        if script_id not in self._pending_scripts:
            await query.edit_message_text("❌ התסריט לא נמצא או כבר טופל")
            return

        if action == "approve":
            await self._process_approval(query, script_id, approved=True)
        elif action == "reject":
            await self._process_approval(query, script_id, approved=False)
        elif action == "regenerate":
            await self._process_regenerate(query, script_id)

    async def _process_approval(self, query, script_id: str, approved: bool):
        """Process approval/rejection."""
        request = self._pending_scripts.pop(script_id, None)

        if approved:
            await query.edit_message_text(
                f"✅ *התסריט אושר!*\n\n"
                f"ממשיך להפקת אודיו ווידאו...",
                parse_mode="Markdown"
            )
            if self._on_approved:
                await self._on_approved(ApprovalResponse(
                    script_id=script_id,
                    status=ApprovalStatus.APPROVED
                ))
        else:
            await query.edit_message_text(
                f"❌ *התסריט נדחה*",
                parse_mode="Markdown"
            )
            if self._on_rejected:
                await self._on_rejected(ApprovalResponse(
                    script_id=script_id,
                    status=ApprovalStatus.REJECTED
                ))

        logger.info(f"Script {script_id} {'approved' if approved else 'rejected'}")

    async def _process_regenerate(self, query, script_id: str):
        """Request script regeneration."""
        await query.edit_message_text(
            "🔄 *מייצר תסריט חדש...*\n\n"
            "תקבל הודעה כשהתסריט החדש יהיה מוכן.",
            parse_mode="Markdown"
        )
        # Trigger regeneration callback
        logger.info(f"Regeneration requested for script {script_id}")

    # ==================
    # Message Handlers
    # ==================

    async def _handle_text_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle text message (script edit)."""
        if not self._pending_scripts:
            await update.message.reply_text(
                "❓ אין תסריטים ממתינים לעריכה"
            )
            return

        # Get most recent pending script
        script_id = list(self._pending_scripts.keys())[-1]
        edited_text = update.message.text

        await update.message.reply_text(
            "✏️ *קיבלתי את העריכה!*\n\n"
            "שולח את התסריט המעודכן לאישור...",
            parse_mode="Markdown"
        )

        if self._on_edited:
            await self._on_edited(ApprovalResponse(
                script_id=script_id,
                status=ApprovalStatus.EDITING,
                edited_text=edited_text
            ))

        logger.info(f"Text edit received for script {script_id}")

    async def _handle_voice_note(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle voice note (correction via speech)."""
        if not self._pending_scripts:
            await update.message.reply_text(
                "❓ אין תסריטים ממתינים לתיקון"
            )
            return

        # Get most recent pending script
        script_id = list(self._pending_scripts.keys())[-1]
        voice: Voice = update.message.voice

        await update.message.reply_text(
            "🎤 *קיבלתי את ההודעה הקולית!*\n\n"
            "מתמלל את ההקלטה...",
            parse_mode="Markdown"
        )

        try:
            # Download voice file
            file = await context.bot.get_file(voice.file_id)
            voice_path = self.voice_dir / f"{script_id}_{voice.file_unique_id}.ogg"
            await file.download_to_drive(voice_path)

            logger.info(f"Downloaded voice note to {voice_path}")

            if self._on_voice_note:
                await self._on_voice_note(ApprovalResponse(
                    script_id=script_id,
                    status=ApprovalStatus.EDITING,
                    voice_file_path=str(voice_path)
                ))

        except Exception as e:
            logger.error(f"Failed to process voice note: {e}")
            await update.message.reply_text(
                "❌ שגיאה בעיבוד ההודעה הקולית"
            )

    # ==================
    # Callback Setters
    # ==================

    def on_approved(self, callback: Callable):
        """Set callback for script approval."""
        self._on_approved = callback

    def on_rejected(self, callback: Callable):
        """Set callback for script rejection."""
        self._on_rejected = callback

    def on_edited(self, callback: Callable):
        """Set callback for script edit."""
        self._on_edited = callback

    def on_voice_note(self, callback: Callable):
        """Set callback for voice note correction."""
        self._on_voice_note = callback


# Singleton instance
_bot: Optional[TelegramApprovalBot] = None


def get_approval_bot() -> TelegramApprovalBot:
    """Get or create bot instance."""
    global _bot
    if _bot is None:
        _bot = TelegramApprovalBot()
    return _bot
