"""E2E API smoke tests."""
import pytest
from fastapi.testclient import TestClient
from src.app import create_app


@pytest.fixture
def client():
    """Create test client."""
    app = create_app()
    return TestClient(app)


@pytest.mark.e2e
def test_health_endpoint(client):
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


@pytest.mark.e2e
def test_reports_definitions_endpoint(client):
    """Test reports definitions endpoint."""
    response = client.get("/reports/definitions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.e2e
def test_admin_feature_flags_endpoint(client):
    """Test admin feature flags endpoint."""
    response = client.get("/admin/feature-flags")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
