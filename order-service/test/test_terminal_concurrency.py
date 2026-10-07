from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from threading import Barrier
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from main import complete_errand, fail_errand
from main.models import Errand, ErrandStatus
from test.test_accept_errand import postgres_database, seed


@pytest.mark.parametrize("actions", [
    ("complete", "complete"), ("fail", "fail"), ("complete", "fail"),
])
def test_postgres_terminal_transition_has_one_winner(postgres_database, monkeypatch, actions):
    factory = postgres_database
    monkeypatch.setattr(complete_errand, "SessionLocal", factory)
    monkeypatch.setattr(fail_errand, "SessionLocal", factory)
    transfer, release = Mock(return_value=True), Mock(return_value=True)
    monkeypatch.setattr(complete_errand, "transfer_reserved_credits", transfer)
    monkeypatch.setattr(fail_errand, "release_reserved_credits", release)
    fields = seed(factory, status=ErrandStatus.ACCEPTED, courier_id=uuid4(),
                  accepted_at=datetime.now(timezone.utc))
    barrier = Barrier(2)

    def attempt(action):
        barrier.wait(timeout=10)
        claims = {"sub": str(fields["requester_id"])}
        try:
            if action == "complete":
                response = complete_errand.complete_errand_request(
                    complete_errand.CompleteErrandRequest(errand_id=fields["id"]), claims
                )
            else:
                response = fail_errand.fail_errand_request(
                    fail_errand.FailErrandRequest(errand_id=fields["id"], failure_reason="Missing items"),
                    claims,
                )
            return 200, response.status
        except HTTPException as exc:
            return exc.status_code, None

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(attempt, actions))
    assert sorted(code for code, _ in results) == [200, 409]
    winner = next(state for code, state in results if code == 200)
    assert transfer.call_count + release.call_count == 1
    assert transfer.call_count == (1 if winner == ErrandStatus.COMPLETED else 0)
    assert release.call_count == (1 if winner == ErrandStatus.FAILED else 0)
    with factory() as db:
        stored = db.get(Errand, fields["id"])
        assert stored.status == winner
        assert stored.courier_id == fields["courier_id"]
        if winner == ErrandStatus.COMPLETED:
            assert stored.completed_at is not None
            assert stored.failed_at is None
            assert stored.failure_reason is None
        else:
            assert stored.failed_at is not None
            assert stored.completed_at is None
            assert stored.failure_reason == "Missing items"
