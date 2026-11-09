import asyncio
import re
from datetime import datetime, timedelta
from math import ceil
from statistics import median
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from main.auth import AuthenticatedUser, authenticated_user
from main.integrations import fetch_completed_history, fetch_supplier_catalog
from main.llm import BUSINESS_TIMEZONE, MAX_CREDITS, generate_extraction
from main.ratelimit import draft_rate_limiter_from_env
from main.schemas import (
    BuildingCandidate,
    DraftRequest,
    DraftResponse,
    ErrandHistoryItem,
    LLMExtraction,
    SupplierCandidate,
)


router = APIRouter()
draft_rate_limiter = draft_rate_limiter_from_env()

HISTORY_CONTEXT_SIZE = 100
DEFAULT_BASE_CREDITS = 5
MAX_DEADLINE = timedelta(days=7)
UTC = ZoneInfo("UTC")
# How far after a deadline marker ("by", "before", ...) to look for clock times.
MARKER_LOOKAHEAD = 48

DEADLINE_MARKER_PATTERN = re.compile(
    r"\b(?:by|before|until|due|deadline|no later than|at)\b",
    re.IGNORECASE,
)
DATE_PATTERN = re.compile(
    r"\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b"
    r"|\b\d{4}-\d{2}-\d{2}\b"
    r"|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b"
    r"|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|"
    r"dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b"
    r"|\b\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|"
    r"may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|"
    # The optional year keeps "12 Nov 2026" from being read as the time 20:26.
    r"nov(?:ember)?|dec(?:ember)?)(?:,?\s+20\d{2})?\b",
    re.IGNORECASE,
)
CLOCK_PATTERN = re.compile(
    r"\b(?:"
    # 24-hour without a separator: 1700, 0930, 1700hrs, 1700 h
    # (Spaces sit inside the optional suffix so a match never ends in trailing
    # whitespace, which would push it outside a date span it belongs to.)
    r"(?:[01]\d|2[0-3])[0-5]\d(?:\s*(?:hrs?|h))?"
    # 5, 5pm, 5.30pm, 5:30 p.m., 17:30, 17.30, 17:30hrs
    r"|(?:[01]?\d|2[0-3])(?:[:.][0-5]\d)?(?:\s*(?:[ap]\.?m\.?|hrs?|h))?"
    r"|noon|midnight"
    r")\b",
    re.IGNORECASE,
)
RELATIVE_DEADLINE_PATTERN = re.compile(
    r"\b(?:in|within)\s+(\d+)\s+(minutes?|mins?|hours?|hrs?)\b",
    re.IGNORECASE,
)


def _urgency_multiplier(minutes_until_deadline: float) -> float:
    if minutes_until_deadline <= 30:
        return 2
    if minutes_until_deadline <= 120:
        return 1.5
    return 1


def _clock_values(text: str) -> set[tuple[int, int]]:
    """Every (hour, minute) a clock token could mean.

    A bare hour such as "5" or "5:30" is ambiguous, so both the AM and PM
    readings are returned; the LLM picks the intended one and the backend only
    checks it was mentioned. Times that are clearly 24-hour (1700, 1700hrs,
    08:00 with a leading zero, 17:30, 00:30) have a single reading.
    """
    value = text.strip().casefold()
    if value == "noon":
        return {(12, 0)}
    if value == "midnight":
        return {(0, 0)}

    four_digit = re.fullmatch(r"(\d{2})(\d{2})\s*(?:hrs?|h)?", value)
    if four_digit is not None:
        hour, minute = int(four_digit.group(1)), int(four_digit.group(2))
        return {(hour, minute)} if hour <= 23 and minute <= 59 else set()

    clock = re.fullmatch(r"(\d{1,2})(?:[:.](\d{2}))?\s*(?:([ap])\.?m\.?|(hrs?|h))?", value)
    if clock is None:
        return set()
    hour_text, minute_text, meridiem, twenty_four_hour_suffix = clock.groups()
    hour = int(hour_text)
    minute = int(minute_text or "0")
    if hour > 23 or minute > 59:
        return set()
    if meridiem:
        if not 1 <= hour <= 12:
            return set()
        return {(hour % 12 + (12 if meridiem == "p" else 0), minute)}
    if twenty_four_hour_suffix or hour_text.startswith("0") or hour == 0 or hour > 12:
        return {(hour, minute)}
    return {(hour % 12, minute), (hour % 12 + 12, minute)}


def _clock_candidates(message: str) -> set[tuple[int, int]]:
    """Clock times the message mentions after a deadline marker.

    This set is deliberately generous (it may include e.g. "level 2" read as a
    time). It only has to contain the real deadline so that the LLM's choice can
    be verified; the LLM is what tells floors and times apart.
    """
    date_spans = [match.span() for match in DATE_PATTERN.finditer(message)]
    candidates: set[tuple[int, int]] = set()
    for marker in DEADLINE_MARKER_PATTERN.finditer(message):
        # "at" usually introduces a place ("at The Deck"), so after "at" only a
        # clock time immediately following it counts ("at 5pm").
        immediate_only = marker.group(0).casefold() == "at"
        window_end = min(len(message), marker.end() + MARKER_LOOKAHEAD)
        for match in CLOCK_PATTERN.finditer(message, marker.end(), window_end):
            if immediate_only and message[marker.end():match.start()].strip():
                break
            if any(start <= match.start() and match.end() <= end for start, end in date_spans):
                continue
            candidates |= _clock_values(match.group(0))
            if immediate_only:
                break
    return candidates


def _relative_deadlines(message: str, now: datetime) -> list[datetime]:
    """Deadlines computed in code from phrases such as "within 30 minutes"."""
    deadlines = []
    for match in RELATIVE_DEADLINE_PATTERN.finditer(message):
        amount = int(match.group(1))
        minutes = amount * 60 if match.group(2).casefold().startswith("h") else amount
        if minutes > MAX_DEADLINE.total_seconds() / 60:
            continue
        deadlines.append(now.astimezone(UTC) + timedelta(minutes=minutes))
    return deadlines


def _parse_explicit_deadline(value: str | None, message: str, now: datetime) -> datetime | None:
    """Accept the LLM's deadline only if the message actually states it.

    - Clock deadlines: the LLM's local hour:minute must be one the message
      mentions after a deadline marker. With no date in the message, the
      deadline is today.
    - Relative deadlines: the time is computed in code (now + duration), so the
      LLM cannot shift it.
    """
    if value is None:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=BUSINESS_TIMEZONE)

    parsed_local = parsed.astimezone(BUSINESS_TIMEZONE)
    relative = _relative_deadlines(message, now)
    if (parsed_local.hour, parsed_local.minute) in _clock_candidates(message):
        if DATE_PATTERN.search(message):
            deadline = parsed_local
        else:
            local_now = now.astimezone(BUSINESS_TIMEZONE)
            deadline = parsed_local.replace(
                year=local_now.year, month=local_now.month, day=local_now.day
            )
    elif relative:
        deadline = min(relative, key=lambda candidate: abs(candidate - parsed))
    else:
        return None

    deadline = deadline.astimezone(UTC)
    now_utc = now.astimezone(UTC)
    if deadline <= now_utc or deadline > now_utc + MAX_DEADLINE:
        return None
    return deadline


def _history_context(
    items: list[dict],
    suppliers: list[SupplierCandidate],
) -> list[dict[str, object]]:
    supplier_names = {supplier.id: supplier.name for supplier in suppliers}
    result: list[dict[str, object]] = []
    for item in items[:HISTORY_CONTEXT_SIZE]:
        try:
            history = ErrandHistoryItem.model_validate(item)
        except ValidationError as exc:
            raise HTTPException(502, "Order Service returned invalid history data") from exc
        lead_minutes = max(
            0,
            int((history.expires_at - history.created_at).total_seconds() // 60),
        )
        result.append(
            {
                "history_index": len(result),
                "item": history.required_item[:100],
                "supplier_id": str(history.supplier_id),
                "supplier_name": supplier_names.get(history.supplier_id),
                "credit_value": history.credit_value,
                "deadline_lead_minutes": lead_minutes,
            }
        )
    return result


def _base_credit(entry: dict[str, object]) -> float:
    """A past errand's credit with its own urgency premium removed.

    Without this, urgent past errands inflate the median and the current
    request's urgency multiplier is applied on top of it a second time.
    """
    multiplier = _urgency_multiplier(float(entry["deadline_lead_minutes"]))
    return int(entry["credit_value"]) / multiplier


def _response(
    extraction: LLMExtraction,
    message: str,
    suppliers: list[SupplierCandidate],
    buildings: list[BuildingCandidate],
    history_context: list[dict[str, object]],
    history_count: int,
    now: datetime,
) -> DraftResponse:
    supplier_names = {candidate.id: candidate.name for candidate in suppliers}
    supplier_id = extraction.supplier_id if extraction.supplier_id in supplier_names else None
    building_names = {candidate.id: candidate.name for candidate in buildings}
    building_id = (
        extraction.delivery_building_id
        if extraction.delivery_building_id in building_names
        else None
    )
    item = extraction.required_item.strip() if extraction.required_item else None
    floor = extraction.delivery_floor.strip() if extraction.delivery_floor else None
    description = (
        extraction.delivery_description.strip() if extraction.delivery_description else None
    )
    deadline = _parse_explicit_deadline(extraction.expires_at, message, now)

    selected_indices = sorted(
        {index for index in extraction.similar_history_indices if 0 <= index < len(history_context)}
    )
    similar_credits = [_base_credit(history_context[index]) for index in selected_indices]
    all_credits = [_base_credit(entry) for entry in history_context]
    reference_credits = similar_credits or all_credits
    historical_base = (
        min(MAX_CREDITS, max(1, ceil(median(reference_credits))))
        if reference_credits
        else DEFAULT_BASE_CREDITS
    )

    multiplier = 1.0
    if deadline is not None:
        minutes = (deadline - now.astimezone(UTC)).total_seconds() / 60
        multiplier = _urgency_multiplier(minutes)
    urgency_adjusted = ceil(historical_base * multiplier)
    credits = min(MAX_CREDITS, urgency_adjusted)

    if similar_credits:
        reason = (
            f"Based on the median of {len(similar_credits)} similar completed errands "
            f"({historical_base} credits before urgency)."
        )
    elif all_credits:
        reason = (
            f"No similar completed errands were identified; used the median of "
            f"{len(all_credits)} completed errands ({historical_base} credits before urgency)."
        )
    else:
        reason = f"No completed errands were available; used the {DEFAULT_BASE_CREDITS}-credit default."
    if multiplier > 1:
        reason = f"{reason} Applied {multiplier:g}x for the deadline."
    if credits < urgency_adjusted:
        reason = f"{reason} Capped at {MAX_CREDITS} credits."

    return DraftResponse(
        supplier_id=supplier_id,
        supplier_name=supplier_names.get(supplier_id),
        required_item=item or None,
        delivery_building_id=building_id,
        delivery_building_name=building_names.get(building_id),
        delivery_floor=floor,
        delivery_description=description,
        expires_at=deadline,
        historical_base_credit=historical_base,
        credit_value=credits,
        credit_reason=reason,
        completed_history_count=history_count,
    )


def rate_limited_user(
    user: Annotated[AuthenticatedUser, Depends(authenticated_user)],
) -> AuthenticatedUser:
    # Runs after authentication, so the limit is per verified user ID, and
    # before any downstream or LLM call is made.
    draft_rate_limiter.check(user.user_id)
    return user


@router.post("/errands/draft", response_model=DraftResponse)
async def create_errand_draft(
    request: DraftRequest,
    user: Annotated[AuthenticatedUser, Depends(rate_limited_user)],
) -> DraftResponse:
    (suppliers, buildings), (history_count, history_items) = await asyncio.gather(
        fetch_supplier_catalog(user.access_token),
        fetch_completed_history(user.access_token, user.user_id),
    )
    now = datetime.now(tz=BUSINESS_TIMEZONE)
    history_context = _history_context(history_items, suppliers)
    extraction = await generate_extraction(
        request.message,
        now,
        suppliers,
        buildings,
        history_context,
    )
    return _response(
        extraction,
        request.message,
        suppliers,
        buildings,
        history_context,
        history_count,
        now,
    )
