from fastapi.testclient import TestClient

from main.app import app


def test_health_returns_ok_without_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
# AI Assistance Disclosure:
# Tool: OpenAI Codex (model not recorded), dates: 2026-10-02–2026-10-22
# Scope: Implementation, debugging, refactoring, and test assistance for Order Service modules; architecture and decision-rationale assistance is not attributed.
# Author review: I reviewed, adapted, and tested the code for the project requirements.

