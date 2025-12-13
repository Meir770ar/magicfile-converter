"""
Rabbi Eitan - Content Scraper Service
Module A: Content Engine with HTML scraping and RSS fallback
"""
import re
from datetime import date, datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass

import httpx
from bs4 import BeautifulSoup
import feedparser
from loguru import logger

from app.config import settings


@dataclass
class ScrapedContent:
    """Data class for scraped content."""
    source_url: str
    source_type: str  # 'html' or 'rss'
    title: str
    raw_text: str
    hebrew_text: str
    date_for: date
    metadata: Dict[str, Any]


class ContentScraper:
    """
    Scraper for Chabad.org Daily Tanya content.
    Implements HTML scraping with automatic RSS fallback.
    """

    TANYA_URL = "https://www.chabad.org/dailystudy/tanya.htm"
    RSS_URL = "https://www.chabad.org/tools/rss/tanya.xml"

    # Alternative URLs
    BACKUP_URLS = [
        "https://www.chabad.org/library/tanya/tanya_cdo/aid/7986",
        "https://www.chabad.org/dailystudy/default.htm",
    ]

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; RabbiEitanBot/1.0; Educational)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "he,en;q=0.9",
            },
            follow_redirects=True
        )

    async def get_daily_content(self) -> ScrapedContent:
        """
        Get daily Tanya content.
        Tries HTML scraping first, falls back to RSS if needed.
        """
        logger.info("Starting daily content scraping...")

        # Try HTML scraping first
        try:
            content = await self._scrape_html()
            if self._validate_content(content):
                logger.success(f"HTML scraping successful: {len(content.raw_text)} chars")
                return content
            else:
                logger.warning("HTML content validation failed, trying RSS fallback")
                raise ContentValidationError("Invalid HTML content")
        except Exception as e:
            logger.warning(f"HTML scraping failed: {e}")

        # Fallback to RSS
        try:
            content = await self._parse_rss()
            if self._validate_content(content):
                logger.success(f"RSS fallback successful: {len(content.raw_text)} chars")
                return content
            else:
                raise ContentValidationError("Invalid RSS content")
        except Exception as e:
            logger.error(f"RSS fallback also failed: {e}")
            raise ScrapingError(f"All scraping methods failed: {e}")

    async def _scrape_html(self) -> ScrapedContent:
        """Scrape content from HTML page."""
        logger.debug(f"Scraping HTML from {self.TANYA_URL}")

        response = await self.client.get(self.TANYA_URL)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'lxml')

        # Extract title
        title = self._extract_title(soup)

        # Extract main content
        content_div = soup.find('div', class_='article__content') or \
                      soup.find('div', id='contentMain') or \
                      soup.find('article') or \
                      soup.find('div', class_='content')

        if not content_div:
            # Try alternative selectors
            content_div = soup.find('div', {'class': re.compile(r'tanya|content|article', re.I)})

        if not content_div:
            raise ScrapingError("Could not find content container")

        # Extract text
        raw_text = self._clean_text(content_div.get_text(separator='\n'))
        hebrew_text = self._extract_hebrew(raw_text)

        # Extract date
        content_date = self._extract_date(soup) or date.today()

        return ScrapedContent(
            source_url=self.TANYA_URL,
            source_type='html',
            title=title,
            raw_text=raw_text,
            hebrew_text=hebrew_text,
            date_for=content_date,
            metadata={
                'scraped_at': datetime.utcnow().isoformat(),
                'page_title': soup.title.string if soup.title else None,
                'content_length': len(raw_text)
            }
        )

    async def _parse_rss(self) -> ScrapedContent:
        """Parse content from RSS feed (fallback)."""
        logger.debug(f"Parsing RSS from {self.RSS_URL}")

        response = await self.client.get(self.RSS_URL)
        response.raise_for_status()

        feed = feedparser.parse(response.text)

        if not feed.entries:
            raise ScrapingError("No entries found in RSS feed")

        # Get the most recent entry
        entry = feed.entries[0]

        # Extract content
        title = entry.get('title', 'Daily Tanya')

        # Try different content fields
        raw_content = entry.get('content', [{}])[0].get('value', '') or \
                      entry.get('summary', '') or \
                      entry.get('description', '')

        # Clean HTML from content
        soup = BeautifulSoup(raw_content, 'lxml')
        raw_text = self._clean_text(soup.get_text(separator='\n'))
        hebrew_text = self._extract_hebrew(raw_text)

        # Parse date
        published = entry.get('published_parsed') or entry.get('updated_parsed')
        if published:
            content_date = date(published.tm_year, published.tm_mon, published.tm_mday)
        else:
            content_date = date.today()

        return ScrapedContent(
            source_url=entry.get('link', self.RSS_URL),
            source_type='rss',
            title=title,
            raw_text=raw_text,
            hebrew_text=hebrew_text,
            date_for=content_date,
            metadata={
                'scraped_at': datetime.utcnow().isoformat(),
                'feed_title': feed.feed.get('title'),
                'entry_id': entry.get('id'),
                'content_length': len(raw_text)
            }
        )

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract title from page."""
        # Try multiple selectors
        title_elem = soup.find('h1') or \
                     soup.find('h2', class_=re.compile(r'title', re.I)) or \
                     soup.find('div', class_='article__title')

        if title_elem:
            return self._clean_text(title_elem.get_text())

        # Fallback to page title
        if soup.title:
            return self._clean_text(soup.title.string.split('|')[0])

        return f"Daily Tanya - {date.today().strftime('%B %d, %Y')}"

    def _extract_date(self, soup: BeautifulSoup) -> Optional[date]:
        """Extract date from page."""
        # Try to find date element
        date_elem = soup.find('time') or \
                    soup.find('span', class_=re.compile(r'date', re.I)) or \
                    soup.find('div', class_=re.compile(r'date', re.I))

        if date_elem:
            date_str = date_elem.get('datetime') or date_elem.get_text()
            try:
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%B %d, %Y', '%d/%m/%Y', '%m/%d/%Y']:
                    try:
                        return datetime.strptime(date_str.strip(), fmt).date()
                    except ValueError:
                        continue
            except Exception:
                pass

        return None

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove leading/trailing whitespace
        text = text.strip()
        # Normalize Hebrew characters
        text = text.replace('\u200f', '')  # Remove RTL mark
        text = text.replace('\u200e', '')  # Remove LTR mark
        return text

    def _extract_hebrew(self, text: str) -> str:
        """Extract Hebrew portions of text."""
        # Hebrew Unicode range: \u0590-\u05FF
        hebrew_pattern = re.compile(r'[\u0590-\u05FF\s\.\,\:\;\!\?\-\"\']+')
        hebrew_parts = hebrew_pattern.findall(text)
        return ' '.join(hebrew_parts).strip()

    def _validate_content(self, content: ScrapedContent) -> bool:
        """Validate scraped content."""
        # Check minimum length
        if len(content.raw_text) < 100:
            logger.warning(f"Content too short: {len(content.raw_text)} chars")
            return False

        # Check for Hebrew content
        if len(content.hebrew_text) < 50:
            logger.warning(f"Not enough Hebrew content: {len(content.hebrew_text)} chars")
            return False

        # Check date is reasonable (not too old)
        if (date.today() - content.date_for).days > 7:
            logger.warning(f"Content date too old: {content.date_for}")
            return False

        return True

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class ScrapingError(Exception):
    """Raised when scraping fails."""
    pass


class ContentValidationError(Exception):
    """Raised when content validation fails."""
    pass


# Singleton instance
_scraper: Optional[ContentScraper] = None


async def get_scraper() -> ContentScraper:
    """Get or create scraper instance."""
    global _scraper
    if _scraper is None:
        _scraper = ContentScraper()
    return _scraper
