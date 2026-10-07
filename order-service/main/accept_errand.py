from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, update

from main.create_errand import verified_claims
from main.database import SessionLocal
from main.models import Errand, ErrandStatus


router = APIRouter()


class AcceptErrandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    errand_id: UUID


class AcceptErrandResponse(BaseModel):
    id: UUID
    status: ErrandStatus
    courier_id: UUID
    accepted_at: datetime


@router.post("/errand/accept", response_model=AcceptErrandResponse)
def accept_errand_request(
    request: AcceptErrandRequest,
    claims: dict = Depends(verified_claims),
) -> AcceptErrandResponse:
    try:
        courier_id = UUID(claims["sub"])
    except (KeyError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status_code=401, detail="Access token contains an invalid user ID"
        ) from exc

    with SessionLocal.begin() as db:
        # The predicates and state transition execute together under the row lock.
        # clock_timestamp() uses real database time even after waiting for a lock.
        statement = (
            update(Errand)
            .where(
                Errand.id == request.errand_id,
                Errand.status == ErrandStatus.OPEN,
                Errand.courier_id.is_(None),
                Errand.requester_id != courier_id,
                Errand.expires_at > func.clock_timestamp(),
            )
            .values(
                status=ErrandStatus.ACCEPTED,
                courier_id=courier_id,
                accepted_at=func.clock_timestamp(),
            )
            .returning(Errand.id, Errand.status, Errand.courier_id, Errand.accepted_at)
        )
        accepted = db.execute(statement).mappings().one_or_none()

        if accepted is None:
            # This read only explains failure; it does not authorize acceptance.
            existing = db.get(Errand, request.errand_id)
            if existing is None:
                raise HTTPException(status_code=404, detail="Errand not found")
            if existing.requester_id == courier_id:
                raise HTTPException(status_code=403, detail="You cannot accept your own errand")
            raise HTTPException(
                status_code=409,
                detail="Errand is not available: it is no longer OPEN, has expired, or already has a courier",
            )

        response = AcceptErrandResponse.model_validate(dict(accepted))

    # Successful context exit commits before the HTTP response is returned.
    return response
