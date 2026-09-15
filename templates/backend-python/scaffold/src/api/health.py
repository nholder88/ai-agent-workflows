"""Health check endpoints."""
from fastapi import APIRouter
from datetime import datetime
from src.config import settings

router = APIRouter()


@router.get("")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
    }
