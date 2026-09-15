"""Unit tests for reports service."""
import pytest
from datetime import datetime
from src.api.reports import get_report_definitions, run_report, get_job_status


@pytest.mark.asyncio
async def test_get_report_definitions():
    """Test getting report definitions."""
    result = await get_report_definitions()
    assert isinstance(result, list)
    assert len(result) > 0
    assert "id" in result[0]
    assert "name" in result[0]


@pytest.mark.asyncio
async def test_run_report():
    """Test running a report."""
    from src.api.reports import RunReportRequest
    request = RunReportRequest(reportId="1")
    result = await run_report(request)
    assert "jobId" in result
    assert result["status"] == "started"


@pytest.mark.asyncio
async def test_get_job_status():
    """Test getting job status."""
    result = await get_job_status("job-123")
    assert result["jobId"] == "job-123"
    assert result["status"] == "completed"
