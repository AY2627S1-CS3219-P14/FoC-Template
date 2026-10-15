from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from sqlalchemy import event

from main import fail_errand
from main.app import app
from main.models import Errand, ErrandStatus
from test.terminal_support import terminal_endpoint, post, assert_accepted


ACTION = "fail"


@pytest.mark.parametrize("reason", ["", "  \t\n ", None, 123, "x" * 501])
def test_invalid_failure_reason(terminal_endpoint, reason):
    client, _, factory, credit, fields = terminal_endpoint
    response = post(client, ACTION, fields["id"], failure_reason=reason)
    assert response.status_code == 422
    credit.assert_not_called()
    assert_accepted(factory, fields["id"])


def test_failure_reason_required(terminal_endpoint):
    client, _, _, credit, fields = terminal_endpoint
    response = client.post("/errand/fail", json={"errand_id": str(fields["id"])},
                           headers={"Authorization": "Bearer test-token"})
    assert response.status_code == 422
    credit.assert_not_called()


def test_failure_reason_is_trimmed(terminal_endpoint):
    client, _, factory, _, fields = terminal_endpoint
    response = post(client, ACTION, fields["id"], failure_reason="  Missing items  ")
    assert response.status_code == 200
    assert response.json()["failure_reason"] == "Missing items"
    with factory() as db:
        assert db.get(Errand, fields["id"]).failure_reason == "Missing items"


def test_success_records_transition_and_calls_credit_operation(terminal_endpoint):
    client, claims, factory, credit, fields = terminal_endpoint
    response = post(client, ACTION, fields["id"])
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(fields["id"])
    assert body["status"] == "FAILED"
    assert body["failed_at"] is not None
    credit.assert_called_once_with(
        fields["credit_value"], claims["sub"],
    )
    with factory() as db:
        stored = db.get(Errand, fields["id"])
        assert stored.status == ErrandStatus.FAILED
        assert stored.failed_at is not None
        assert stored.courier_id == fields["courier_id"]
        assert stored.failure_reason == 'Missing items'


@pytest.mark.parametrize("actor", ["courier", "other"])
def test_only_requester_can_terminate(terminal_endpoint, actor):
    client, claims, factory, credit, fields = terminal_endpoint
    claims["sub"] = str(fields["courier_id"] if actor == "courier" else uuid4())
    assert post(client, ACTION, fields["id"]).status_code == 403
    credit.assert_not_called()
    assert_accepted(factory, fields["id"])


@pytest.mark.parametrize("state", [s for s in ErrandStatus if s != ErrandStatus.ACCEPTED])
def test_wrong_state_is_rejected(terminal_endpoint, state):
    client, _, factory, credit, fields = terminal_endpoint
    with factory.begin() as db:
        db.get(Errand, fields["id"]).status = state
    assert post(client, ACTION, fields["id"]).status_code == 409
    credit.assert_not_called()
    with factory() as db:
        assert db.get(Errand, fields["id"]).status == state


def test_expired_errand_is_rejected(terminal_endpoint):
    client, _, factory, credit, fields = terminal_endpoint
    with factory.begin() as db:
        db.get(Errand, fields["id"]).expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    assert post(client, ACTION, fields["id"]).status_code == 409
    credit.assert_not_called()
    assert_accepted(factory, fields["id"])


def test_missing_courier_is_rejected(terminal_endpoint):
    client, _, factory, credit, fields = terminal_endpoint
    with factory.begin() as db:
        db.get(Errand, fields["id"]).courier_id = None
    assert post(client, ACTION, fields["id"]).status_code == 409
    credit.assert_not_called()


def test_unknown_errand(terminal_endpoint):
    client, _, _, credit, _ = terminal_endpoint
    assert post(client, ACTION, uuid4()).status_code == 404
    credit.assert_not_called()


def test_repeated_request_does_not_repeat_credit_operation(terminal_endpoint):
    client, _, _, credit, fields = terminal_endpoint
    assert post(client, ACTION, fields["id"]).status_code == 200
    assert post(client, ACTION, fields["id"]).status_code == 409
    credit.assert_called_once()


def test_credit_failure_rolls_back_and_allows_retry(terminal_endpoint):
    client, _, factory, credit, fields = terminal_endpoint
    credit.return_value = False
    assert post(client, ACTION, fields["id"]).status_code == 503
    assert_accepted(factory, fields["id"])
    credit.return_value = True
    assert post(client, ACTION, fields["id"]).status_code == 200


def test_credit_exception_rolls_back(terminal_endpoint):
    client, _, factory, credit, fields = terminal_endpoint
    credit.side_effect = RuntimeError("Credit operation failed")
    with pytest.raises(RuntimeError, match="Credit operation failed"):
        post(client, ACTION, fields["id"])
    assert_accepted(factory, fields["id"])


def test_commit_failure_rolls_back(terminal_endpoint):
    client, _, factory, credit, fields = terminal_endpoint

    def reject_commit(session):
        raise RuntimeError("Commit failed")

    event.listen(factory, "before_commit", reject_commit)
    try:
        with pytest.raises(RuntimeError, match="Commit failed"):
            post(client, ACTION, fields["id"])
    finally:
        event.remove(factory, "before_commit", reject_commit)
    credit.assert_called_once()
    assert_accepted(factory, fields["id"])


@pytest.mark.parametrize("changes", [
    {"errand_id": "invalid"}, {"errand_id": None},
    {"requester_id": str(uuid4())},
])
def test_invalid_body(terminal_endpoint, changes):
    client, _, _, credit, fields = terminal_endpoint
    assert post(client, ACTION, fields["id"], **changes).status_code == 422
    credit.assert_not_called()


def test_missing_errand_id(terminal_endpoint):
    client, _, _, credit, _ = terminal_endpoint
    body = {"failure_reason": "Missing items"}
    response = client.post(f"/errand/{ACTION}", json=body,
                           headers={"Authorization": "Bearer test-token"})
    assert response.status_code == 422
    credit.assert_not_called()


@pytest.mark.parametrize("subject", [None, "invalid"])
def test_invalid_subject(terminal_endpoint, subject):
    client, claims, _, credit, fields = terminal_endpoint
    claims["sub"] = subject
    assert post(client, ACTION, fields["id"]).status_code == 401
    credit.assert_not_called()


def test_authentication_required(terminal_endpoint):
    client, _, _, credit, fields = terminal_endpoint
    app.dependency_overrides.pop(fail_errand.verified_claims)
    body = {"errand_id": str(fields["id"])}
    body["failure_reason"] = "Missing items"
    response = client.post(f"/errand/{ACTION}", json=body)
    assert response.status_code in (401, 403)
    credit.assert_not_called()
