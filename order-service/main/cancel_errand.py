from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, update

from main.create_errand import verified_claims
from main.database import SessionLocal
from main.models import Errand, ErrandStatus


router = APIRouter()


class CancelErrandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    errand_id: UUID


class CancelErrandResponse(BaseModel):
    id: UUID
    status: ErrandStatus
    cancelled_at: datetime


def release_reserved_credits(credit_value: int, requester_id: str) -> bool:
    # TODO: Release this errand's reservation through Credit Service.
    # Real integration needs a reservation/errand ID, idempotency, and recovery.
    return True


@router.post("/errand/cancel", response_model=CancelErrandResponse)
def cancel_errand_request(
    request: CancelErrandRequest,
    claims: dict = Depends(verified_claims),
) -> CancelErrandResponse:
    try:
        requester_id = UUID(claims["sub"])
    except (KeyError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status_code=401, detail="Access token contains an invalid user ID"
        ) from exc

    with SessionLocal.begin() as db:
        statement = (
            update(Errand)
            .where(
                Errand.id == request.errand_id,
                Errand.requester_id == requester_id,
                Errand.status == ErrandStatus.OPEN,
                Errand.courier_id.is_(None),
                Errand.expires_at > func.clock_timestamp(),
            )
            .values(
                status=ErrandStatus.CANCELLED,
                cancelled_at=func.clock_timestamp(),
            )
            .returning(Errand.id, Errand.status, Errand.cancelled_at, Errand.credit_value)
        )
        cancelled = db.execute(statement).mappings().one_or_none()

        if cancelled is None:
            existing = db.get(Errand, request.errand_id)
            if existing is None:
                raise HTTPException(status_code=404, detail="Errand not found")
            if existing.requester_id != requester_id:
                raise HTTPException(status_code=403, detail="You can only cancel your own errand")
            raise HTTPException(
                status_code=409,
                detail="Errand cannot be cancelled: it is no longer OPEN, has expired, or already has a courier",
            )

        credits_released = release_reserved_credits(
            cancelled["credit_value"], str(requester_id)
        )
        if not credits_released:
            # Roll back the state change on a reported release failure.
            raise HTTPException(status_code=503, detail="Could not release reserved credits")

        response = CancelErrandResponse(
            id=cancelled["id"],
            status=cancelled["status"],
            cancelled_at=cancelled["cancelled_at"],
        )

    return response
