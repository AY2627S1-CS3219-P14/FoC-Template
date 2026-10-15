from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, update

from main.create_errand import verified_claims
from main.database import SessionLocal
from main.models import Errand, ErrandStatus


router = APIRouter()


class CompleteErrandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    errand_id: UUID


class CompleteErrandResponse(BaseModel):
    id: UUID
    status: ErrandStatus
    completed_at: datetime


def transfer_reserved_credits(
    credit_value: int, requester_id: str, courier_id: str,
) -> bool:
    # TODO: Transfer this errand's reservation through Credit Service.
    # Real integration needs reservation identity, idempotency, and recovery.
    return True


@router.post("/errand/complete", response_model=CompleteErrandResponse)
def complete_errand_request(
    request: CompleteErrandRequest,
    claims: dict = Depends(verified_claims),
) -> CompleteErrandResponse:
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
                Errand.status == ErrandStatus.ACCEPTED,
                Errand.courier_id.is_not(None),
                Errand.expires_at > func.clock_timestamp(),
            )
            .values(
                status=ErrandStatus.COMPLETED,
                completed_at=func.clock_timestamp(),
            )
            .returning(
                Errand.id, Errand.status, Errand.completed_at,
                Errand.credit_value, Errand.courier_id,
            )
        )
        transitioned = db.execute(statement).mappings().one_or_none()
        if transitioned is None:
            existing = db.get(Errand, request.errand_id)
            if existing is None:
                raise HTTPException(status_code=404, detail="Errand not found")
            if existing.requester_id != requester_id:
                raise HTTPException(
                    status_code=403,
                    detail="Only the requester can confirm completion",
                )
            raise HTTPException(
                status_code=409,
                detail="Errand cannot be completed: it is not ACCEPTED, has expired, or has no assigned courier",
            )

        credit_success = transfer_reserved_credits(
            transitioned["credit_value"], str(requester_id),
            str(transitioned["courier_id"]),
        )
        if not credit_success:
            raise HTTPException(
                status_code=503, detail="Could not transfer reserved credits"
            )

        response = CompleteErrandResponse(
            id=transitioned["id"],
            status=transitioned["status"],
            completed_at=transitioned["completed_at"],
        )

    # Commit happens before returning a successful response.
    return response
