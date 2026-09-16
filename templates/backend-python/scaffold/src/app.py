"""FastAPI application factory."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.api.health import router as health_router
from src.api.reports import router as reports_router
from src.api.admin import router as admin_router


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.SERVICE_NAME,
        description="{{projectName}} API",
        version=settings.SERVICE_VERSION,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="/health", tags=["health"])
    app.include_router(reports_router, prefix="/reports", tags=["reports"])
    app.include_router(admin_router, prefix="/admin", tags=["admin"])

    return app
