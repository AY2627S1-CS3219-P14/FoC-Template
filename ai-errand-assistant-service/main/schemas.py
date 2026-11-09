from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints


class DraftRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=1000)]


class DraftResponse(BaseModel):
    supplier_id: UUID | None
    supplier_name: str | None
    required_item: str | None
    delivery_building_id: UUID | None
    delivery_building_name: str | None
    delivery_floor: str | None
    delivery_description: str | None
    expires_at: AwareDatetime | None
    historical_base_credit: int = Field(ge=1, le=25)
    credit_value: int = Field(ge=1, le=25)
    credit_reason: str
    completed_history_count: int


class SupplierCandidate(BaseModel):
    id: UUID
    name: str
    building: str
    floor: str | None = None
    description: str | None = None


class BuildingCandidate(BaseModel):
    id: UUID
    name: str


class LLMExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    supplier_id: UUID | None
    required_item: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)
    ] | None
    delivery_building_id: UUID | None
    delivery_floor: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None
    delivery_description: Annotated[
        str, StringConstraints(strip_whitespace=True, max_length=500)
    ] | None
    expires_at: str | None
    # Not range-checked here: one bad index from the LLM must not fail the whole
    # draft. Out-of-range and duplicate indices are dropped in routes._response.
    similar_history_indices: list[int] = Field(default_factory=list)


class ErrandHistoryItem(BaseModel):
    supplier_id: UUID
    required_item: str
    credit_value: int
    created_at: datetime
    expires_at: datetime
