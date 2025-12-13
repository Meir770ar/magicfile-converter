# Rabbi Eitan - Tanya Automation System

מערכת אוטומציה מלאה ליצירת תוכן וידאו יומי מתניא.

## Overview

Rabbi Eitan is a fully automated system that:
1. Scrapes daily Tanya content from Chabad.org
2. Generates viral scripts using Gemini AI
3. Sends for approval via Telegram Bot (supports voice corrections!)
4. Creates audio with ElevenLabs and video with HeyGen
5. Distributes to Telegram and WhatsApp

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Chabad.org │───▶│   Gemini    │───▶│  Telegram   │
│  (Scraper)  │    │  (Script)   │    │   (Bot)     │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                   ┌─────────────┐    ┌──────▼──────┐
                   │   HeyGen    │◀───│ ElevenLabs  │
                   │  (Video)    │    │   (Audio)   │
                   └──────┬──────┘    └─────────────┘
                          │
                   ┌──────▼──────┐
                   │   FFmpeg    │───▶ Distribution
                   │  (Process)  │
                   └─────────────┘
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- API Keys for: Gemini, ElevenLabs, HeyGen, OpenAI (Whisper)
- Telegram Bot Token

### Setup

1. Clone and navigate to project:
```bash
cd rabbi-eitan-automation
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your API keys

4. Start all services:
```bash
docker-compose up -d
```

5. Access:
   - Dashboard: http://localhost:3000
   - API Docs: http://localhost:8000/api/docs
   - Flower (Celery): http://localhost:5555

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js Dashboard |
| Backend | 8000 | FastAPI Server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & Queue |
| Flower | 5555 | Celery Monitor |
| Nginx | 80 | Reverse Proxy |

## Project Structure

```
rabbi-eitan-automation/
├── backend/           # FastAPI + Celery
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── services/  # Business logic
│   │   └── workers/   # Celery tasks
│   └── Dockerfile
├── frontend/          # Next.js Dashboard
│   └── src/app/
├── infrastructure/    # Docker & DB scripts
└── docs/              # Documentation
```

## Modules

### Module A: Content Engine
- Primary: HTML scraping from Chabad.org
- Fallback: RSS feed parsing
- AI: Gemini 2.0 Flash for script generation

### Module B: Telegram Approval
- Approve/Reject buttons
- Text message edits
- Voice note corrections (Whisper transcription)

### Module C: Media Factory
- ElevenLabs Flash v2.5 for audio
- HeyGen for avatar video (30-min timeout)
- FFmpeg for post-processing:
  - Merge high-quality audio
  - Add logo watermark
  - Background music at 15% volume

### Module D: Distribution
- Telegram channel (max 50MB)
- WhatsApp (compressed to 720p)

## API Endpoints

```
POST /api/v1/content/scrape       # Trigger scraping
POST /api/v1/script/generate      # Generate script
PUT  /api/v1/approval/script/{id} # Approve/reject
POST /api/v1/media/generate       # Create media
POST /api/v1/distribution/distribute # Send to channels
GET  /api/v1/pipeline/status      # Dashboard status
```

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Celery Worker
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

## License

Private - All rights reserved.
