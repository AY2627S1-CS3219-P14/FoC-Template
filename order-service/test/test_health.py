from fastapi.testclient import TestClient

from main.app import app


def test_health_returns_ok_without_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
