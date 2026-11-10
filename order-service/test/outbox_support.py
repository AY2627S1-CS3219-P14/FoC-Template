"""Reads the outbox rows Debezium would relay to Kafka."""

from sqlalchemy import select

from main.models import OutboxEvent


def outbox_events(factory):
    with factory() as db:
        return db.scalars(select(OutboxEvent)).all()


def assert_single_event(factory, event_type, errand_id):
    events = outbox_events(factory)
    assert [(e.aggregatetype, e.aggregateid, e.type) for e in events] == [
        ("errand", str(errand_id), event_type)
    ]
    return events[0].payload
# AI Assistance Disclosure:
# Tool: OpenAI Codex (model not recorded), dates: 2026-10-02–2026-10-22
# Scope: Implementation, debugging, refactoring, and test assistance for Order Service modules; architecture and decision-rationale assistance is not attributed.
# Author review: I reviewed, adapted, and tested the code for the project requirements.

