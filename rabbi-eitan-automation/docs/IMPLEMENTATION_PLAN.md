# Rabbi Eitan - Tanya Automation System
## Implementation Plan (v1.0)

---

## Project Overview

**מטרה:** בניית מערכת אוטומטית מלאה שמבצעת:
1. גרידת תוכן יומי מ-Chabad.org
2. יצירת תסריט באמצעות Gemini AI
3. שליחה לאישור דרך Telegram Bot (קול/טקסט)
4. יצירת אודיו/וידאו
5. הפצה לפלטפורמות שונות

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RABBI EITAN SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │   Chabad.org │────▶│Content Engine│────▶│  Gemini AI   │            │
│  │  (Scraping)  │     │  (Module A)  │     │  (Script)    │            │
│  └──────────────┘     └──────────────┘     └──────┬───────┘            │
│                                                    │                     │
│                                                    ▼                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │   Whisper    │◀────│ Telegram Bot │◀────│   Script     │            │
│  │ (Transcribe) │     │  (Module B)  │     │  (Approval)  │            │
│  └──────────────┘     └──────┬───────┘     └──────────────┘            │
│                              │                                          │
│                              ▼                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │  ElevenLabs  │────▶│Media Factory │────▶│    FFmpeg    │            │
│  │   (Audio)    │     │  (Module C)  │     │(PostProcess) │            │
│  └──────────────┘     └──────────────┘     └──────┬───────┘            │
│                                                    │                     │
│  ┌──────────────┐                                  ▼                     │
│  │   HeyGen     │─────────────────────────▶┌──────────────┐            │
│  │  (Avatar)    │                          │ Distribution │            │
│  └──────────────┘                          │  (Module D)  │            │
│                                            └──────┬───────┘            │
│                                                   │                     │
│                              ┌────────────────────┼────────────────┐   │
│                              ▼                    ▼                ▼   │
│                       ┌──────────┐         ┌──────────┐     ┌────────┐│
│                       │ Telegram │         │ WhatsApp │     │  More  ││
│                       │ Channel  │         │   API    │     │Channels││
│                       └──────────┘         └──────────┘     └────────┘│
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                           DASHBOARD (Module E)                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  [Step 1] ──▶ [Step 2] ──▶ [Step 3] ──▶ [Step 4] ──▶ [Done]   │   │
│  │  Progress Bar: ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 35%    │   │
│  │                                                                 │   │
│  │  📊 Credits: ElevenLabs: 45,000 | HeyGen: 12 videos            │   │
│  └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
rabbi-eitan-automation/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── config.py                  # Settings & environment
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py          # API router
│   │   │       ├── content.py         # Content endpoints
│   │   │       ├── approval.py        # Approval endpoints
│   │   │       ├── media.py           # Media endpoints
│   │   │       └── distribution.py    # Distribution endpoints
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py            # Auth & security
│   │   │   └── database.py            # DB connection
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── scraper.py             # Module A: Content scraping
│   │   │   ├── gemini_service.py      # Gemini AI integration
│   │   │   ├── approval_bot.py        # Module B: Telegram bot
│   │   │   ├── whisper_service.py     # Voice transcription
│   │   │   ├── elevenlabs_service.py  # Module C: Audio generation
│   │   │   ├── heygen_service.py      # Video avatar generation
│   │   │   ├── ffmpeg_service.py      # Post-processing
│   │   │   └── distribution.py        # Module D: Distribution
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── content.py             # Content DB models
│   │   │   ├── script.py              # Script DB models
│   │   │   └── media.py               # Media DB models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── content.py             # Pydantic schemas
│   │   │   ├── script.py
│   │   │   └── media.py
│   │   ├── workers/
│   │   │   ├── __init__.py
│   │   │   ├── celery_app.py          # Celery configuration
│   │   │   └── tasks.py               # Background tasks
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── logger.py              # Logging configuration
│   │       └── helpers.py             # Helper functions
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_scraper.py
│   │   ├── test_gemini.py
│   │   └── test_bot.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Dashboard home
│   │   │   ├── globals.css
│   │   │   └── pipeline/
│   │   │       └── page.tsx           # Live pipeline status
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── button.tsx         # Shadcn Button
│   │   │       ├── card.tsx           # Shadcn Card
│   │   │       ├── progress.tsx       # Progress bar
│   │   │       └── pipeline-status.tsx # Custom pipeline component
│   │   ├── lib/
│   │   │   ├── utils.ts               # Utility functions
│   │   │   └── api.ts                 # API client
│   │   └── hooks/
│   │       └── use-pipeline.ts        # Pipeline status hook
│   ├── public/
│   │   ├── logo.png                   # Logo for watermark
│   │   └── favicon.ico
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── next.config.js
├── infrastructure/
│   ├── docker/
│   │   └── nginx.conf                 # Nginx configuration
│   └── scripts/
│       ├── init-db.sql                # Database initialization
│       └── setup.sh                   # Setup script
├── docs/
│   ├── IMPLEMENTATION_PLAN.md         # This file
│   ├── API_DOCS.md                    # API documentation
│   └── DEPLOYMENT.md                  # Deployment guide
├── docker-compose.yml                 # Docker orchestration
├── .env.example                       # Environment variables template
├── .gitignore
└── README.md
```

---

## Module Specifications

### Module A: Content Engine

| Component | Details |
|-----------|---------|
| **Source** | Chabad.org Daily Tanya Study |
| **Primary Method** | HTML Scraping (BeautifulSoup4) |
| **Fallback** | RSS Feed parsing (feedparser) |
| **AI Processing** | Gemini 2.0 Flash |
| **Output** | 60-second viral script in Hebrew |

**Scraping Logic Flow:**
```python
def get_daily_content():
    try:
        # Primary: HTML scraping
        content = scrape_html()
        if not validate_content(content):
            raise ContentError()
        return content
    except (HTTPError, ContentError):
        # Fallback: RSS Feed
        return parse_rss_feed()
```

### Module B: Approval System (Telegram Bot)

| Component | Details |
|-----------|---------|
| **Library** | python-telegram-bot v20+ |
| **Admin ID** | Configured via environment |
| **Approval Methods** | Button, Text Edit, Voice Note |

**Voice Note Processing Flow:**
```
Voice Note (OGG) → Download → Whisper Transcription →
Gemini Rewrite → Send Updated Script → Wait for Approval
```

### Module C: Media Factory

| Component | Details |
|-----------|---------|
| **Audio Engine** | ElevenLabs API (Flash v2.5) |
| **Video Engine** | HeyGen API (Avatar) |
| **Post-Processing** | FFmpeg via Python wrapper |
| **Timeout** | 30 minutes (HeyGen is slow) |

**Post-Processing Pipeline:**
1. Download HeyGen avatar video
2. Download ElevenLabs audio (higher quality)
3. Merge audio + video with FFmpeg
4. Overlay logo watermark (bottom-right)
5. Add background music (15% volume)
6. **NO subtitles** (explicitly removed)

### Module D: Distribution

| Platform | Method | Constraints |
|----------|--------|-------------|
| Telegram | Direct file upload | Max 50MB |
| WhatsApp | API via Green-API/Baileys | Compress to 720p |

### Module E: Dashboard

**Features:**
- Live Pipeline Status (6 steps progress bar)
- Manual Trigger button
- Real-time logs view
- Credit balance monitor (ElevenLabs, HeyGen)
- Content preview

---

## Technical Stack

### Backend
- **Language:** Python 3.11
- **Framework:** FastAPI
- **Task Queue:** Celery + Redis
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI
- **State:** React Query

### Infrastructure
- **Orchestration:** Docker Compose
- **Reverse Proxy:** Nginx
- **Monitoring:** Basic logging (extensible)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/rabbi_eitan
REDIS_URL=redis://redis:6379/0

# API Keys
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
HEYGEN_API_KEY=your_heygen_key
OPENAI_API_KEY=your_openai_key  # For Whisper

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_ID=your_admin_id
TELEGRAM_CHANNEL_ID=your_channel_id

# WhatsApp
WHATSAPP_API_URL=your_api_url
WHATSAPP_API_TOKEN=your_api_token

# App Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## Development Phases

### Phase 1: Infrastructure Setup
- [x] Create folder structure
- [ ] Docker Compose configuration
- [ ] Database initialization
- [ ] Environment setup

### Phase 2: Content Engine (Module A)
- [ ] HTML scraper implementation
- [ ] RSS fallback implementation
- [ ] Gemini AI integration
- [ ] Script generation logic

### Phase 3: Approval System (Module B)
- [ ] Telegram bot setup
- [ ] Approval buttons handler
- [ ] Text edit handler
- [ ] Voice note + Whisper integration

### Phase 4: Media Factory (Module C)
- [ ] ElevenLabs integration
- [ ] HeyGen integration
- [ ] FFmpeg post-processing
- [ ] Quality validation

### Phase 5: Distribution (Module D)
- [ ] Telegram channel distribution
- [ ] WhatsApp integration
- [ ] Error handling & retries

### Phase 6: Dashboard (Module E)
- [ ] Next.js project setup
- [ ] Pipeline status component
- [ ] Manual trigger
- [ ] Logs & monitoring view

---

## API Endpoints (Draft)

```
POST   /api/v1/content/scrape          # Trigger content scraping
GET    /api/v1/content/latest          # Get latest content
POST   /api/v1/script/generate         # Generate script with AI
PUT    /api/v1/script/{id}/approve     # Approve script
POST   /api/v1/media/generate          # Generate audio/video
GET    /api/v1/media/{id}/status       # Check generation status
POST   /api/v1/distribute              # Distribute to channels
GET    /api/v1/pipeline/status         # Get pipeline status
GET    /api/v1/credits                 # Get API credits status
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Chabad.org blocks scraping | Auto-switch to RSS feed |
| HeyGen slow/timeout | 30-min Celery timeout + async polling |
| API rate limits | Queue with backoff + caching |
| Voice transcription fails | Manual text input fallback |

---

## Next Steps

1. **DevOps Agent:** Set up Docker environment
2. **Backend Agent:** Implement scraper with fallback
3. **Backend Agent:** Build Telegram bot
4. **Frontend Agent:** Create dashboard

---

*Document Version: 1.0*
*Last Updated: 2024-12-13*
