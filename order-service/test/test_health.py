# AI Assistance Disclosure
# Tool and date: Anthropic Claude (model unrecorded), 2026-11-06
# Scope (AI-25): Generated Kubernetes manifests, health endpoints and probe settings from my deployment specification.
# Usage log: AI_USAGE_LOG.md
# Author review: Pending confirmation by Melodi Joy Halim.

from fastapi.testclient import TestClient

from main.app import app


def test_health_returns_ok_without_authentication() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
