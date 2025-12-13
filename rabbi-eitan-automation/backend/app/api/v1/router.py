"""
Rabbi Eitan - API Router
Aggregates all API endpoints
"""
from fastapi import APIRouter

from app.api.v1 import content, approval, media, distribution

api_router = APIRouter()

# Include sub-routers
api_router.include_router(
    content.router,
    prefix="/content",
    tags=["Content Engine"]
)

api_router.include_router(
    approval.router,
    prefix="/approval",
    tags=["Approval System"]
)

api_router.include_router(
    media.router,
    prefix="/media",
    tags=["Media Factory"]
)

api_router.include_router(
    distribution.router,
    prefix="/distribution",
    tags=["Distribution"]
)


@api_router.get("/pipeline/status")
async def get_pipeline_status():
    """Get current pipeline status for dashboard."""
    # TODO: Implement actual status tracking
    return {
        "current_step": 1,
        "total_steps": 6,
        "status": "idle",
        "steps": [
            {"step": 1, "name": "Scraping Content", "status": "pending"},
            {"step": 2, "name": "Generating Script", "status": "pending"},
            {"step": 3, "name": "Awaiting Approval", "status": "pending"},
            {"step": 4, "name": "Generating Audio", "status": "pending"},
            {"step": 5, "name": "Generating Video", "status": "pending"},
            {"step": 6, "name": "Distribution", "status": "pending"},
        ]
    }


@api_router.get("/credits")
async def get_credits_status():
    """Get API credits status for monitoring."""
    # TODO: Implement actual credits tracking
    return {
        "elevenlabs": {
            "used": 0,
            "remaining": 45000,
            "unit": "characters"
        },
        "heygen": {
            "used": 0,
            "remaining": 12,
            "unit": "videos"
        },
        "gemini": {
            "status": "active",
            "requests_today": 0
        }
    }
