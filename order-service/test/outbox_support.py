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
