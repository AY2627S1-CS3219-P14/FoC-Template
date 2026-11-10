from datetime import datetime
from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict, StringConstraints

from main.create_errand import bearer_scheme, verified_claims
from main.credit_operations import finish_terminal, prepare_terminal
from main.database import SessionLocal
from main.models import ErrandStatus


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
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> FailErrandResponse:
    try:
        requester_id = UUID(claims["sub"])
    except (KeyError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(401, "Access token contains an invalid user ID") from exc
    operation_id = prepare_terminal(
        SessionLocal, request.errand_id, requester_id, "FAIL", request.failure_reason,
    )
    return FailErrandResponse.model_validate(
        finish_terminal(SessionLocal, operation_id, credentials.credentials)
    )
