# AI Errand Assistant Service

This FastAPI service turns a short natural-language request into a **draft** for
the existing Order Service create-errand form. It does not create errands or
reserve credits; users can review and edit the returned fields before submitting.

## Run with Docker Compose

Set one provider key in the repository-root `.env` and choose the provider:

```env
AI_ASSISTANT_LLM_PROVIDER=OPENAI
OPENAI_API_KEY=<your-key>
```

Or use Claude:

```env
AI_ASSISTANT_LLM_PROVIDER=ANTHROPIC
ANTHROPIC_API_KEY=<your-key>
```

The other provider key may remain empty. Keep provider keys in `.env`; do not
commit them or expose them as frontend `VITE_` variables. Start the service:

```powershell
docker compose up -d --build ai-errand-assistant-service
```

It is available to the host at `http://localhost:8005`. Compose connects to
Supplier Service and Order Service using their internal service URLs. Configure
`OPENAI_MODEL` or `ANTHROPIC_MODEL` to override the defaults.

## API

`POST /errands/draft` requires a valid user bearer token (RS256, verified
against User Service's JWKS and issuer). The same token is forwarded to Supplier
Service to retrieve active suppliers and buildings, and to Order Service to
retrieve the completed errands the caller **requested** (errands they delivered
as a courier are excluded). The two lookups run in parallel. Up to the latest
100 completed errand summaries (including item, supplier, credit, and deadline
lead time) are sent to the LLM to find similar past errands.

Each user may make `AI_DRAFT_RATE_LIMIT` draft requests (default 10) per
`AI_DRAFT_RATE_WINDOW_SECONDS` (default 60); further requests get `429` with a
`Retry-After` header. The limit is held in memory per process, and `0` disables
it. The supplier/building catalog is the same for every user, so it is cached
for `CATALOG_CACHE_SECONDS` (default 60; `0` disables).

`GET /health` is an unauthenticated liveness check used by the container
`HEALTHCHECK`.

Request:

```http
POST /errands/draft
Authorization: Bearer <user-access-token>
Content-Type: application/json

{"message":"pickup iced milo at the Deck by today 5pm and bring it to COM3 L2"}
```

The JSON response includes `supplier_id`, `required_item`,
`delivery_building_id`, `delivery_floor`, `delivery_description`, `expires_at`,
`historical_base_credit`, `credit_value`, `credit_reason`, and
`completed_history_count`. Catalog IDs are checked against Supplier Service;
uncertain or missing values are returned as `null`, not as chat-style follow-up
questions. The LLM selects the closest catalog supplier/building
when the message describes a pickup or destination location; it returns `null`
when the request gives no such location.

### Deadlines

The LLM decides which time in the message is the deadline (so "level 2" is not
mistaken for 2 o'clock). The backend then checks the LLM did not invent one:

- **Clock deadlines** ("by 5pm", "before 17:30", "at 5pm"): the LLM's time must be
  one the message mentions after a deadline word (`by`, `before`, `until`, `due`,
  `deadline`, `no later than`, `at`). After `at`, only a time directly following
  it counts, since "at" usually introduces a place. A time without am/pm (for
  example "by 5") may mean either 05:00 or 17:00; the LLM chooses, preferring
  09:00–20:59. If the day is omitted, the deadline is today, and it is left unset
  if that time has already passed.
- **Relative deadlines** ("within 30 minutes", "in 2 hours"): the time is computed
  by the backend as now + duration rather than taken from the LLM.

A date without a clock time, or an inferred deadline, is left unset. Deadlines
are interpreted in `BUSINESS_TIMEZONE` (default `Asia/Singapore`) and must be
within the next seven days.

### Credits

The LLM compares the requested item and supplier with completed errands and
selects the similar-history entries; the backend does all arithmetic. Each past
errand's urgency premium is first removed (its credit is divided by 2 if it was
posted with 30 minutes or less to its deadline, or by 1.5 if two hours or less),
so urgent past errands do not inflate the base and urgency is not counted twice.
`historical_base_credit` is the median of those adjusted credits for the
selected errands, or across all history if none are selected; with no completed
history it defaults to 5. The backend then applies urgency for this request: 2x
for a deadline within 30 minutes, 1.5x within two hours (rounded up), or no
multiplier otherwise. The final suggestion is capped at 25. `credit_reason`
explains whether similar history, all history, or the default was used.

The suggestion is not checked against the user's balance; the frontend and
Order Service enforce that when the errand is created.

Provider/configuration failures return an explicit HTTP error. The endpoint
does not silently skip unavailable history or supplier catalog data.

## Local development

From `ai-errand-assistant-service`:

```powershell
python -m pip install -r requirements.txt
$env:USER_SERVICE_URL="http://localhost:8081"
$env:SUPPLIER_SERVICE_URL="http://localhost:8082"
$env:ORDER_SERVICE_URL="http://localhost:8002"
$env:AI_ASSISTANT_LLM_PROVIDER="OPENAI"
$env:OPENAI_API_KEY="<your-key>"
python -m uvicorn main.app:app --reload --port 8005
```

Run the unit tests with:

```powershell
python -m pytest -q
```
