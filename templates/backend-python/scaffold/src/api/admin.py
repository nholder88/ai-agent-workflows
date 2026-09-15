"""Admin endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class FeatureFlag(BaseModel):
    """Feature flag model."""
    key: str
    description: str
    enabled: bool
    updatedAt: str


class AuditLogsResponse(BaseModel):
    """Audit logs response."""
    logs: list
    total: int
    page: int
    pageSize: int


@router.get("/feature-flags", response_model=list[FeatureFlag])
async def get_feature_flags():
    """Get all feature flags."""
    return [
        {
            "key": "new-reports-ui",
            "description": "Enable new reports UI",
            "enabled": True,
            "updatedAt": datetime.utcnow().isoformat(),
        },
        {
            "key": "advanced-filtering",
            "description": "Enable advanced filtering",
            "enabled": False,
            "updatedAt": datetime.utcnow().isoformat(),
        },
    ]


@router.get("/audit", response_model=AuditLogsResponse)
async def get_audit_logs():
    """Get audit logs."""
    return {
        "logs": [],
        "total": 0,
        "page": 1,
        "pageSize": 20,
    }
