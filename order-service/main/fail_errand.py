from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, StringConstraints
from sqlalchemy import func, update

from main.cancel_errand import release_reserved_credits
from main.create_errand import verified_claims
from main.database import SessionLocal
from main.models import Errand, ErrandStatus


router = APIRouter()


class FailErrandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    errand_id: UUID
    failure_reason: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class FailErrandResponse(BaseModel):
    id: UUID
    status: ErrandStatus
    failed_at: datetime
    failure_reason: str


@router.post("/errand/fail", response_model=FailErrandResponse)
def fail_errand_request(
    request: FailErrandRequest,
    claims: dict = Depends(verified_claims),
) -> FailErrandResponse:
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
                status=ErrandStatus.FAILED,
                failed_at=func.clock_timestamp(),
                failure_reason=request.failure_reason,
            )
            .returning(
                Errand.id, Errand.status, Errand.failed_at,
                Errand.credit_value, Errand.failure_reason,
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
                    detail="Only the requester can report failure",
                )
            raise HTTPException(
                status_code=409,
                detail="Errand cannot be reported as failed: it is not ACCEPTED, has expired, or has no assigned courier",
            )

        credit_success = release_reserved_credits(
            transitioned["credit_value"], str(requester_id),
        )
        if not credit_success:
            raise HTTPException(
                status_code=503, detail="Could not release reserved credits"
            )

        response = FailErrandResponse(
            id=transitioned["id"],
            status=transitioned["status"],
            failed_at=transitioned["failed_at"],
            failure_reason=transitioned["failure_reason"],
        )

    # Commit happens before returning a successful response.
    return response
