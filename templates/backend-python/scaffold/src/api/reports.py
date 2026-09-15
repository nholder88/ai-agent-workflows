"""Reports endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ReportDefinition(BaseModel):
    """Report definition model."""
    id: str
    name: str
    description: str
    createdAt: str


class RunReportRequest(BaseModel):
    """Run report request."""
    reportId: str


class RunReportResponse(BaseModel):
    """Run report response."""
    jobId: str
    status: str


class JobStatusResponse(BaseModel):
    """Job status response."""
    jobId: str
    status: str
    timestamp: str


@router.get("/definitions", response_model=list[ReportDefinition])
async def get_report_definitions():
    """Get all report definitions."""
    return [
        {
            "id": "1",
            "name": "Monthly Sales Report",
            "description": "Sales summary for the month",
            "createdAt": datetime.utcnow().isoformat(),
        }
    ]


@router.post("/run", response_model=RunReportResponse)
async def run_report(request: RunReportRequest):
    """Run a report."""
    job_id = f"job-{int(datetime.utcnow().timestamp())}"
    return {"jobId": job_id, "status": "started"}


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get report job status."""
    return {
        "jobId": job_id,
        "status": "completed",
        "timestamp": datetime.utcnow().isoformat(),
    }
