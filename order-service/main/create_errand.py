import os
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID, uuid4

import jwt
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints
from starlette.concurrency import run_in_threadpool

from main.database import SessionLocal
from main.models import Errand, ErrandStatus


router = APIRouter()
bearer_scheme = HTTPBearer()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8081")
SUPPLIER_SERVICE_URL = os.getenv("SUPPLIER_SERVICE_URL", "http://localhost:8080")
JWT_ISSUER = os.getenv("JWT_ISSUER", "campuscouriers-user-service")
jwk_client = PyJWKClient(f"{USER_SERVICE_URL}/.well-known/jwks.json")


class CreateErrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: ErrandStatus
    requester_id: UUID
    courier_id: UUID | None
    supplier_id: UUID
    required_item: str
    credit_value: int
    delivery_building_id: UUID
    delivery_floor: str | None
    delivery_description: str | None
    expires_at: datetime
    created_at: datetime


class CreateErrandRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supplier_id: UUID
    required_item: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    credit_value: int = Field(gt=0, strict=True)
    delivery_building_id: UUID
    delivery_floor: str | None = Field(default=None, max_length=20)
    delivery_description: str | None = Field(default=None, max_length=500)
    expires_at: AwareDatetime


async def verify_supplier(supplier_id: str, access_token: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(
                f"{SUPPLIER_SERVICE_URL}/suppliers/{supplier_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="Supplier Service is unavailable",
        ) from exc

    if response.status_code == 404:
        return False

    if response.status_code in (401, 403):
        raise HTTPException(status_code=response.status_code, detail="Supplier Service rejected access")

    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="Could not verify supplier_id")

    return True




async def verify_credit_value(credit_value: int, requester_id: str) -> bool:
    # TODO: Verify the available balance through Credit Service.
    return True


async def reserve_credits(credit_value: int, requester_id: str) -> bool:
    # TODO: Atomically reserve credits through Credit Service.
    return True


def verified_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(credentials.credentials)
        return jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256"],
            issuer=JWT_ISSUER,
            options={"require": ["sub", "exp", "iss"]},
        )
    except jwt.PyJWKClientConnectionError as exc:
        raise HTTPException(status_code=503, detail="User Service keys are unavailable") from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def validate_expiry(expires_at: datetime, now: datetime) -> None:
    if expires_at <= now:
        message = "expires_at must be in the future"
    elif expires_at > now + timedelta(days=7):
        message = "expires_at must not exceed seven days from the current time"
    else:
        return

    raise HTTPException(
        status_code=422,
        detail=[{"loc": ["body", "expires_at"], "msg": message, "type": "value_error"}],
    )


def insert_errand(request: CreateErrandRequest, requester_id: UUID) -> CreateErrandResponse:
    now = datetime.now(timezone.utc)
    validate_expiry(request.expires_at, now)

    errand = Errand(
        id=uuid4(),
        status=ErrandStatus.OPEN,
        requester_id=requester_id,
        courier_id=None,
        supplier_id=request.supplier_id,
        required_item=request.required_item,
        credit_value=request.credit_value,
        delivery_building_id=request.delivery_building_id,
        delivery_floor=request.delivery_floor,
        delivery_description=request.delivery_description,
        expires_at=request.expires_at.astimezone(timezone.utc),
        created_at=now,
    )
    with SessionLocal.begin() as db:
        db.add(errand)
        db.flush()
        response = CreateErrandResponse.model_validate(errand)
    return response


@router.post(
    "/errand/create",
    response_model=CreateErrandResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_errand_request(
    request: CreateErrandRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    claims: dict = Depends(verified_claims),
) -> CreateErrandResponse:
    try:
        requester_id = UUID(claims["sub"])
    except (KeyError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(status_code=401, detail="Access token contains an invalid user ID") from exc

    validate_expiry(request.expires_at, datetime.now(timezone.utc))

    supplier_valid = await verify_supplier(
        str(request.supplier_id),
        credentials.credentials,
    )
    if not supplier_valid:
        raise HTTPException(status_code=422, detail="Supplier does not exist or is unavailable")

    sufficient_credit = await verify_credit_value(request.credit_value, str(requester_id))
    if not sufficient_credit:
        raise HTTPException(status_code=409, detail="Insufficient credit balance")

    # External checks may take time: verify expiry again before reservation.
    validate_expiry(request.expires_at, datetime.now(timezone.utc))

    credits_reserved = await reserve_credits(request.credit_value, str(requester_id))
    if not credits_reserved:
        raise HTTPException(status_code=409, detail="Could not reserve credits")

    return await run_in_threadpool(
        insert_errand, request, requester_id,
    )
