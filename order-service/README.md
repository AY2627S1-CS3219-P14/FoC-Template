# Order Service

This folder contains one FastAPI order service:

- `main/create_errand.py`: `POST /errand/create` validates the request, verifies the JWT and supplier, checks and reserves credits using placeholders, and saves an open errand to PostgreSQL.
- `main/accept_errand.py`: `POST /errand/accept` atomically assigns an open, unexpired errand to the authenticated courier.
- `main/cancel_errand.py`: `POST /errand/cancel` lets the requester cancel an open, unexpired errand and calls a credit-release placeholder.
- `main/complete_errand.py`: `POST /errand/complete` lets the requester confirm completion of an accepted, unexpired errand and calls a credit-transfer placeholder.
- `main/fail_errand.py`: `POST /errand/fail` lets the requester report failure of an accepted, unexpired errand with a required reason and calls the credit-release placeholder.
- `main/app.py`: registers the route modules in one FastAPI application.

## Install dependencies

From this folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Run the tests

```powershell
pytest
```

## Run a service

Run the order service:

```powershell
uvicorn main.app:app --reload --port 8002
```

Interactive API documentation is available at:

- `http://127.0.0.1:8002/docs`

Apply the database migrations before creating errands. From the repository root:

```powershell
docker compose up -d --build order-service
docker compose exec order-service alembic upgrade head
```

When running Python directly on the host, set `DB_HOST=localhost`, `DB_PORT=5435`,
`DB_NAME=campuscouriers_order`, `DB_USERNAME=order_service`, and `DB_PASSWORD` to
the configured database password. Docker Compose supplies these settings inside
the container. Python does not automatically load the root `.env` file.

The errand route forwards the bearer token to the Supplier Service's
`GET /suppliers/{id}` endpoint. Replace the example supplier and building UUIDs
with real identifiers. `required_item` is a required, nonblank description of the
requested item(s), stored as PostgreSQL `TEXT` and returned in the creation response.
The expiry must be timezone-aware, strictly in the future, and no more than seven
days from the current time (F2.1.2). Invalid expiry returns 422 identifying `expires_at`,
before credits are reserved. F2.1.5 is intentionally not implemented.

```powershell
$requestBody = @{
  supplier_id = "22222222-2222-4222-8222-222222222222"
  required_item = "Two sandwiches and one coffee"
  credit_value = 10
  delivery_building_id = "11111111-1111-4111-8111-111111111111"
  delivery_floor = "3"
  delivery_description = "Outside room 03-12"
  expires_at = [DateTimeOffset]::UtcNow.AddDays(1).ToString("o")
} | ConvertTo-Json

curl.exe -X POST http://127.0.0.1:8002/errand/create `
  -H "Authorization: Bearer <access-token>" `
  -H "Content-Type: application/json" `
  -d $requestBody
```

Migration `0003_add_required_item` adds the required column without a placeholder
default. It applies directly to an empty table. If existing errands are present,
backfill their real item descriptions with a staged migration before enforcing
the required column; do not delete data to make the migration succeed.

A successful request returns HTTP 201 with the created errand, its requester UUID,
supplier UUID, and `OPEN` status. The requester comes from the verified JWT; clients
cannot supply requester, courier, or status fields. Invalid input or an unavailable
supplier returns 422. Insufficient credits or a rejected reservation returns 409;
an unavailable Supplier Service returns 503.

`verify_credit_value` and `reserve_credits` currently return `True` without contacting
Credit Service. Reservation is called only after validation, supplier verification,
and balance verification succeed. Delivery building UUID syntax is validated, but
building existence is not yet checked. When real reservations are added, failed
database inserts must release reserved credits, and retries need idempotent handling.

## Accept an errand

Send a bearer token and only the errand UUID in the JSON body:

```json
{"errand_id": "550e8400-e29b-41d4-a716-446655440000"}
```

`POST /errand/accept` returns 200 with `id`, `status`, `courier_id`, and `accepted_at`.
The courier UUID comes from the verified JWT. Missing/invalid/extra body fields
return 422, self-acceptance returns 403, an unknown errand returns 404, and a
non-open, expired, or already assigned errand returns 409. Acceptance executes as
one conditional PostgreSQL update so concurrent couriers cannot both succeed.
Expired errands are rejected here; changing them to EXPIRED and releasing credits
belongs to the separate expiry workflow. No schema migration is needed for acceptance.

The acceptance tests run locally with SQLite for endpoint behavior. To also test
simultaneous acceptance with real PostgreSQL, run from the order-service directory:

```powershell
$env:TEST_ORDER_DATABASE_URL="postgresql+psycopg://order_service:password@localhost:5435/campuscouriers_order"
python -m pytest -q test/test_accept_errand.py
```

This PostgreSQL test creates and removes a uniquely named test schema. It does not
modify existing errands. The database user needs permission to create schemas.

## Cancel an errand

`POST /errand/cancel` accepts only `{"errand_id": "<errand UUID>"}` and a bearer
token. It returns 200 with `id`, `status: CANCELLED`, and `cancelled_at` after commit.
Only the requester can cancel an OPEN, unexpired, unassigned errand. Unauthorized
ownership returns 403, unknown errands return 404, unavailable errands return 409,
and invalid request bodies return 422. Repeated or concurrent cancellation cannot
invoke credit release twice after a successful cancellation. Acceptance and cancellation
compete through conditional updates to the same PostgreSQL row.

`release_reserved_credits(credit_value, requester_id)` currently returns `True`
without changing any balance. A `False` result returns 503 and rolls back cancellation;
an exception also rolls back the database update. Before implementing a real external
credit release, add reservation identity, idempotent release and failure recovery:
a database rollback cannot undo a release already performed by another service.
No additional schema migration is needed for this endpoint.

Run `python -m pytest -q test/test_cancel_errand.py` from this directory. Set
`TEST_ORDER_DATABASE_URL` as above to also test concurrent cancellation and
cancellation versus acceptance using an isolated PostgreSQL schema.

## Complete or fail an errand

Only the requester may terminate an ACCEPTED, unexpired errand with an assigned
courier. Both endpoints obtain the requester UUID from the verified bearer token.

`POST /errand/complete` accepts only `{"errand_id": "<errand UUID>"}`. It sets
COMPLETED and `completed_at`, calls `transfer_reserved_credits(credit_value,
requester_id, courier_id)`, and returns 200 with `id`, `status`, and `completed_at`.

`POST /errand/fail` accepts `{"errand_id": "<errand UUID>", "failure_reason":
"Missing items"}`. The reason is required, trimmed, nonblank, and limited to 500
characters. It sets FAILED, `failed_at`, and `failure_reason`, calls the shared
credit-release placeholder, and returns 200 with those fields and `id`.

Both return 403 for another user (including the courier), 404 for an unknown errand,
409 for an invalid state/expired deadline/missing courier, and 422 for invalid inputs.
A reported credit failure returns 503 and rolls back the state transition. Credit
operations remain placeholders. Real external operations require reservation identity,
idempotency and recovery if the credit operation succeeds but database commit fails.
Repeated or competing completion/failure requests cannot both commit successfully.

No schema migration is needed. Run `python -m pytest -q test` for the service suite.
Set `TEST_ORDER_DATABASE_URL` to also run PostgreSQL terminal-state concurrency tests.
The separate sibling integration-test suite has not been changed. Courier visibility
of completion confirmation and automatic expiry remain separate features.
