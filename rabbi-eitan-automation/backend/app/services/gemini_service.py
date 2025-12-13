"""
Rabbi Eitan - Gemini AI Service
Module A: Script Generation using Google Gemini 2.0 Flash
"""
from typing import Optional, Dict, Any
from dataclasses import dataclass
import json

import google.generativeai as genai
from loguru import logger

from app.config import settings


@dataclass
class GeneratedScript:
    """Data class for generated script."""
    script_text: str
    word_count: int
    estimated_duration_seconds: int
    prompt_used: str
    model: str
    metadata: Dict[str, Any]


class GeminiService:
    """
    Service for generating viral Tanya scripts using Gemini AI.
    """

    MODEL_NAME = "gemini-2.0-flash-exp"
    FALLBACK_MODEL = "gemini-1.5-flash"

    # Target duration in seconds
    TARGET_DURATION = 60

    # Estimated words per second for Hebrew speech
    HEBREW_WPS = 2.5

    def __init__(self):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        genai.configure(api_key=settings.gemini_api_key)

        # Configure model
        self.generation_config = {
            "temperature": 0.9,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1024,
        }

        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]

        try:
            self.model = genai.GenerativeModel(
                model_name=self.MODEL_NAME,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
            logger.info(f"Initialized Gemini with model: {self.MODEL_NAME}")
        except Exception as e:
            logger.warning(f"Failed to init {self.MODEL_NAME}, falling back: {e}")
            self.model = genai.GenerativeModel(
                model_name=self.FALLBACK_MODEL,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )

    async def generate_script(
        self,
        content_text: str,
        content_title: str,
        custom_prompt: Optional[str] = None
    ) -> GeneratedScript:
        """
        Generate a 60-second viral script from Tanya content.

        Args:
            content_text: The raw Tanya text to transform
            content_title: Title of the content
            custom_prompt: Optional custom instructions

        Returns:
            GeneratedScript with the generated text
        """
        logger.info(f"Generating script for: {content_title}")

        # Build the prompt
        prompt = self._build_prompt(content_text, content_title, custom_prompt)

        try:
            # Generate content
            response = await self._generate_with_retry(prompt)

            # Extract script text
            script_text = self._extract_script(response.text)

            # Calculate metrics
            word_count = len(script_text.split())
            estimated_duration = int(word_count / self.HEBREW_WPS)

            return GeneratedScript(
                script_text=script_text,
                word_count=word_count,
                estimated_duration_seconds=estimated_duration,
                prompt_used=prompt[:500] + "...",  # Truncate for storage
                model=self.MODEL_NAME,
                metadata={
                    "target_duration": self.TARGET_DURATION,
                    "content_length": len(content_text),
                    "generation_config": self.generation_config
                }
            )

        except Exception as e:
            logger.error(f"Script generation failed: {e}")
            raise ScriptGenerationError(f"Failed to generate script: {e}")

    async def rewrite_with_correction(
        self,
        original_script: str,
        correction_text: str
    ) -> GeneratedScript:
        """
        Rewrite a script based on voice note correction.

        Args:
            original_script: The original generated script
            correction_text: Transcribed correction from voice note

        Returns:
            GeneratedScript with the rewritten text
        """
        logger.info("Rewriting script with correction")

        prompt = f"""
אתה עורך תוכן מקצועי. קיבלת תסריט ותיקון מהמשתמש.

## התסריט המקורי:
{original_script}

## התיקון/ההערה מהמשתמש:
{correction_text}

## המשימה שלך:
1. הבן מה המשתמש רוצה לשנות
2. שלב את התיקון בתסריט
3. שמור על האורך (כ-60 שניות, 150 מילים בערך)
4. שמור על הסגנון הוויראלי והמעניין

## כתוב את התסריט המתוקן בעברית:
"""

        try:
            response = await self._generate_with_retry(prompt)
            script_text = self._extract_script(response.text)

            word_count = len(script_text.split())
            estimated_duration = int(word_count / self.HEBREW_WPS)

            return GeneratedScript(
                script_text=script_text,
                word_count=word_count,
                estimated_duration_seconds=estimated_duration,
                prompt_used="rewrite_with_correction",
                model=self.MODEL_NAME,
                metadata={
                    "correction_applied": True,
                    "original_length": len(original_script)
                }
            )

        except Exception as e:
            logger.error(f"Script rewrite failed: {e}")
            raise ScriptGenerationError(f"Failed to rewrite script: {e}")

    def _build_prompt(
        self,
        content_text: str,
        content_title: str,
        custom_prompt: Optional[str]
    ) -> str:
        """Build the generation prompt."""

        base_prompt = f"""
אתה יוצר תוכן וויראלי מומחה בחסידות ותניא.
המשימה שלך: להפוך לימוד תניא יומי לסרטון וויראלי של 60 שניות.

## הלימוד היומי: {content_title}

## הטקסט המקורי:
{content_text[:3000]}

## הנחיות ליצירת התסריט:

### מבנה (60 שניות = ~150 מילים):
1. **פתיחה (5 שניות)**: Hook חזק - שאלה מפתיעה או אמירה פרובוקטיבית
2. **הצגת הבעיה (10 שניות)**: למה זה רלוונטי לחיים שלנו היום?
3. **התובנה מהתניא (30 שניות)**: הסבר פשוט וברור של הרעיון המרכזי
4. **יישום מעשי (10 שניות)**: איך מיישמים את זה היום?
5. **סיום (5 שניות)**: Call to action או מחשבה לסיום

### סגנון:
- דבר ישירות למאזין (אתה/את)
- השתמש בשפה פשוטה, לא אקדמית
- הוסף דוגמאות מחיי היומיום
- צור מתח והפתעה
- הימנע ממילים מיותרות
- כל משפט צריך להוסיף ערך

### חשוב:
- הכל בעברית
- אל תכתוב הוראות במה, רק את הטקסט לקריינות
- אורך: בדיוק 150 מילים (פלוס מינוס 10)

{f"## הנחיות נוספות מהמשתמש: {custom_prompt}" if custom_prompt else ""}

## כתוב את התסריט:
"""
        return base_prompt

    async def _generate_with_retry(self, prompt: str, max_retries: int = 3):
        """Generate with retry logic."""
        last_error = None

        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response
            except Exception as e:
                last_error = e
                logger.warning(f"Generation attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff

        raise last_error

    def _extract_script(self, response_text: str) -> str:
        """Extract clean script from response."""
        # Remove any markdown formatting
        text = response_text.strip()

        # Remove code blocks if present
        if text.startswith("```"):
            lines = text.split('\n')
            text = '\n'.join(lines[1:-1] if lines[-1] == "```" else lines[1:])

        # Remove stage directions in brackets
        import re
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'\(.*?\)', '', text)

        # Clean up whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()

        return text


class ScriptGenerationError(Exception):
    """Raised when script generation fails."""
    pass


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
