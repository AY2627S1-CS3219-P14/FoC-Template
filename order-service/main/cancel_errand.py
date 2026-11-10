from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, ConfigDict

from main.create_errand import bearer_scheme, verified_claims
from main.credit_operations import finish_terminal, prepare_terminal
from main.database import SessionLocal
from main.models import ErrandStatus


router = APIRouter()


class CancelErrandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    errand_id: UUID



class CancelErrandResponse(BaseModel):
    id: UUID
    status: ErrandStatus
    cancelled_at: datetime



@router.post("/errand/cancel", response_model=CancelErrandResponse)
def cancel_errand_request(
    request: CancelErrandRequest,
    claims: dict = Depends(verified_claims),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CancelErrandResponse:
    try:
        requester_id = UUID(claims["sub"])
    except (KeyError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(401, "Access token contains an invalid user ID") from exc
    operation_id = prepare_terminal(
        SessionLocal, request.errand_id, requester_id, "CANCEL",
    )
    return CancelErrandResponse.model_validate(
        finish_terminal(SessionLocal, operation_id, credentials.credentials)
    )
