"""Shared isolated database fixtures for completion/failure tests."""

from datetime import datetime, timezone
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import complete_errand, fail_errand
from main.app import app
from main.database import Base
from main.models import Errand, ErrandStatus
from test.test_accept_errand import seed


@pytest.fixture
def terminal_endpoint(request, monkeypatch):
    action = request.module.ACTION
    module = complete_errand if action == "complete" else fail_errand
    effect_name = "transfer_reserved_credits" if action == "complete" else "release_reserved_credits"
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def clock(connection, record):
        connection.create_function(
            "clock_timestamp", 0,
            lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f"),
        )

    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(module, "SessionLocal", factory)
    credit = Mock(return_value=True)
    monkeypatch.setattr(module, effect_name, credit)
    fields = seed(factory, status=ErrandStatus.ACCEPTED,
                  courier_id=uuid4(), accepted_at=datetime.now(timezone.utc))
    claims = {"sub": str(fields["requester_id"]), "type": "Student"}
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[module.verified_claims] = lambda: claims
    try:
        with TestClient(app) as client:
            yield client, claims, factory, credit, fields
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)
        engine.dispose()


def post(client, action, target_id, **changes):
    body = {"errand_id": str(target_id)}
    if action == "fail":
        body["failure_reason"] = "Missing items"
    body.update(changes)
    return client.post(
        f"/errand/{action}", json=body,
        headers={"Authorization": "Bearer test-token"},
    )


def assert_accepted(factory, errand_id):
    with factory() as db:
        stored = db.get(Errand, errand_id)
        assert stored.status == ErrandStatus.ACCEPTED
        assert stored.completed_at is None
        assert stored.failed_at is None
        assert stored.failure_reason is None
