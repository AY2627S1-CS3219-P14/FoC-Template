# Notification service

Consumes committed errand outbox events from Kafka and stores notifications in PostgreSQL.
Authenticated HTTP endpoints expose saved notifications and stream new ones over SSE.

| Kafka topic | Recipient | Notification type |
| --- | --- | --- |
| `errand.accepted` | `requesterId` | `ERRAND_ACCEPTED` |
| `errand.delivered` | `requesterId` | `ERRAND_DELIVERED` |
| `errand.completed` | `courierId` | `ERRAND_COMPLETED` |
| `errand.failed` | `courierId` | `ERRAND_FAILED` |
| `credit.received` | `userId` (courier) | `CREDIT_RECEIVED` |
| `credit.released` | `userId` (requester) | `CREDIT_RELEASED` |

Errand events are plain JSON with `errandId`, `requesterId`, `courierId` (UUIDs),
and positive integer `creditValue`. Additional payload fields are ignored.
The UTF-8 `eventId` Kafka header must contain the original outbox UUID;
see `../debezium/connectors/order-outbox.json`.
Delivery notifications confirm that the assigned courier marked the errand delivered.
Completion notifications confirm the requester's action; they do not claim that credits
were transferred. The credit service publishes separate events after its credit changes commit.

Credit alerts use `userId` as the recipient, `orderId` as the notification's `errandId`, and
the positive available-balance change `amount` in the message. The payload's `eventId`
identifies the credit record and deduplicates republished records. The Kafka header ID
identifies the outbox row. Every committed release can generate an alert because the event
does not distinguish releases completed inline from those completed later.

## Run locally

Requires JDK 17+, Docker Desktop running Linux containers, and the database
variables from the repository's `.env.example` in its root `.env`.

From the repository root:

```powershell
docker compose up -d kafka notification-db
cd notification-service
.\mvnw.cmd spring-boot:run
```

Compose recreates Kafka if needed to expose its new external listener. Existing Docker
clients still use `kafka:19092`; the locally running service uses `localhost:9092`.
The source topics and their three-partition DLTs are declared automatically.
Actual order events require the order service, its database, and Debezium to be running
as described in `../debezium/README.md`.

| Environment variable | Local default |
| --- | --- |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5436` |
| `DB_NAME` | `campuscouriers_notification` |
| `DB_USERNAME` | `notification_service` |
| `DB_PASSWORD` | `password` (local development only) |

Spring does not load the root `.env`; these settings use defaults or the process environment.
If containerized later, set `KAFKA_BOOTSTRAP_SERVERS=kafka:19092`, `DB_HOST=notification-db`,
`DB_PORT=5432`, and matching database credentials.

## Notification API reference

The local base URL is `http://localhost:8003`. Send `Authorization: Bearer <access-token>`
with every request. The service uses the token's subject to scope notifications to the
signed-in account. A missing, invalid, or expired token returns `401`.

Configure `USER_SERVICE_URL` (default `http://localhost:8081`), `JWT_ISSUER` (default
`campuscouriers-user-service`), and `NOTIFICATION_CORS_ALLOWED_ORIGINS` (comma-separated,
default `http://localhost:5173`) as needed.

| Method and path | Purpose | Success |
| --- | --- | --- |
| `GET /notifications?limit=20` | Fetch recent notifications | `200` with `{"items":[...]}` |
| `GET /notifications/stream` | Subscribe to live notifications | `200` with `Content-Type: text/event-stream` |
| `GET /notifications/unread-count` | Count unread notification cards for the caller | `200` with `{"count":2}` |
| `PATCH /notifications/{id}/read` | Mark one notification as read | `204` with an empty body |
| `POST /notifications/read-all` | Mark all of the caller's unread notifications as read | `204` with an empty body |

### `GET /notifications`

`limit` is optional and defaults to 20. Integers from 1 through 100 are accepted.
An out-of-range or non-integer value returns `400`. Results are sorted by `createdAt`
descending, with `id` descending as a tie-breaker. An empty result is `{"items":[]}`.

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "ERRAND_ACCEPTED",
      "errandId": "9f5c3201-aeb9-4a3b-8acd-817043c059d4",
      "message": "Someone has accepted your errand.",
      "createdAt": "2026-11-06T08:00:00Z",
      "readAt": null
    }
  ]
}
```

Both IDs are UUIDs. `readAt` is `null` until the notification is read, then contains a
timestamp. The topic table above lists the supported notification types.

### `GET /notifications/stream`

Send `Accept: text/event-stream`. The stream sends `connected` when it opens, then
`notification` events as newly saved notifications arrive. The SSE `id` matches the JSON
notification's `id`. Heartbeats are comments and can be ignored by the client.

```text
event:connected
data:{}

id:550e8400-e29b-41d4-a716-446655440000
event:notification
data:{"id":"550e8400-e29b-41d4-a716-446655440000","type":"ERRAND_ACCEPTED","errandId":"9f5c3201-aeb9-4a3b-8acd-817043c059d4","message":"Someone has accepted your errand.","createdAt":"2026-11-06T08:00:00Z","readAt":null}

:heartbeat

```

After each `connected` event, fetch history and merge it with live notifications by `id`.
The requested history window determines how far back catch-up can recover. The stream
accepts the `Last-Event-ID` header, with catch-up handled by the history request. When the
token expires, refresh it before reconnecting. Live connections are held in memory, so
run one notification-service instance for live delivery.

### `GET /notifications/unread-count`

The count includes the caller's unread notifications across all history. The latest
completion and credit receipt for the same errand form one card, which counts as unread
until both records are read. Other notifications each count separately.

```json
{"count": 2}
```

### `PATCH /notifications/{id}/read` and `POST /notifications/read-all`

Both requests take an empty body. For the single-item endpoint, use the notification UUID
from history or SSE. A malformed UUID returns `400`. An unknown or another user's
notification UUID returns `404`. An already-read notification still returns `204` and
keeps its original `readAt` timestamp.

`POST /notifications/read-all` also returns `204` when the caller has zero unread
notifications. After either action, refresh history or the unread count as needed.

### Local requests with curl

In PowerShell, set `$token` to a valid access token from the user service, then run:

```powershell
$base = 'http://localhost:8003'
$auth = "Authorization: Bearer $token"
curl.exe -H $auth "$base/notifications?limit=20"
curl.exe -N -H $auth -H 'Accept: text/event-stream' "$base/notifications/stream"
curl.exe -H $auth "$base/notifications/unread-count"
curl.exe -i -X PATCH -H $auth "$base/notifications/$notificationId/read"
curl.exe -i -X POST -H $auth "$base/notifications/read-all"
```

Set `$notificationId` from a history response before the `PATCH` request. Run the stream
command in a separate terminal or stop it with Ctrl+C before issuing more requests.

## Persistence and failure handling

Hibernate `ddl-auto=update` creates the entity table and its unique constraint on startup.
PostgreSQL `INSERT ... ON CONFLICT (source_event_id, recipient_id, type) DO NOTHING`
handles duplicate and concurrent deliveries without hiding unrelated SQL failures.

The database transaction commits before the listener returns. Record acknowledgement
then commits the Kafka offset. A crash between these steps may redeliver the event;
the unique constraint prevents duplicate notifications. This is at-least-once processing,
not a distributed transaction between PostgreSQL and Kafka.

Temporary processing failures get two retries, one second apart (three attempts total).
Malformed events go directly to `<source-topic>.notification-dlt`; persistent failures
go there after retries. DLT publication must succeed before the source offset advances.
DLTs retain the original key, value, event headers, and diagnostic headers. They are
not consumed automatically. Monitor them and replay repaired records to the source
topic with the original `eventId` after resolving the cause. A long database outage can
therefore move events to DLTs; storage resumes through operator replay.

The dedicated consumer group is `notification-service`. A new group starts at the earliest
retained records; existing groups resume at their committed offsets. Kafka only orders
within one topic partition, so do not infer a total order across event topics.

Inspect stored notifications from the repository root:

```powershell
docker compose exec notification-db psql -U notification_service -d campuscouriers_notification -c "SELECT recipient_id, type, message, source_event_id FROM notifications ORDER BY created_at DESC;"
```

## Tests

```powershell
.\mvnw.cmd test
```

Testcontainers starts isolated Kafka and PostgreSQL containers on random ports; tests do
not use the development database. Docker is required. Tests cover recipient mapping,
offset commits, duplicate and concurrent delivery, constraint errors, malformed messages,
temporary database failure recovery, and persistent failures going to a DLT.
The suite also exercises authenticated history and read actions, user isolation, SSE
delivery to multiple tabs, rollback and duplicate suppression, and token expiry.
