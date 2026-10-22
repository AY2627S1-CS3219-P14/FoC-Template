"""Errand events published through the transactional outbox.

Each event is added to the caller's session, so it is relayed to Kafka (by Debezium)
if and only if the errand change it describes commits. The Kafka topic is the event
type and the message key is the errand ID, keeping each errand's events in order.
Payload field names are camelCase, matching the other services' events.
"""

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import Session

from main.models import OutboxEvent


ERRAND_AGGREGATE = "errand"


class ErrandEvent(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    errand_id: UUID
    requester_id: UUID
    credit_value: int


class ErrandCreatedEvent(ErrandEvent):
    supplier_id: UUID
    expires_at: datetime
    created_at: datetime


class ErrandAcceptedEvent(ErrandEvent):
    courier_id: UUID
    accepted_at: datetime


class ErrandCancelledEvent(ErrandEvent):
    cancelled_at: datetime


class ErrandCompletedEvent(ErrandEvent):
    courier_id: UUID
    completed_at: datetime


class ErrandFailedEvent(ErrandEvent):
    courier_id: UUID
    failure_reason: str
    failed_at: datetime


EVENT_TYPES: dict[type[ErrandEvent], str] = {
    ErrandCreatedEvent: "errand.created",
    ErrandAcceptedEvent: "errand.accepted",
    ErrandCancelledEvent: "errand.cancelled",
    ErrandCompletedEvent: "errand.completed",
    ErrandFailedEvent: "errand.failed",
}


def append_errand_event(db: Session, event: ErrandEvent) -> None:
    db.add(OutboxEvent(
        id=uuid4(),
        aggregatetype=ERRAND_AGGREGATE,
        aggregateid=str(event.errand_id),
        type=EVENT_TYPES[type(event)],
        payload=event.model_dump(mode="json", by_alias=True),
    ))
