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

## Frontend API

Send `Authorization: Bearer <access-token>` to every endpoint. The service verifies the JWT
using the user service's public keys and derives the recipient from its subject. Configure
`USER_SERVICE_URL` (default `http://localhost:8081`), `JWT_ISSUER` (default
`campuscouriers-user-service`), and `NOTIFICATION_CORS_ALLOWED_ORIGINS` (comma-separated,
default `http://localhost:5173`) as needed.

| Request | Successful response |
| --- | --- |
| `GET /notifications?limit=20` | `200` with `{"items":[...]}` ordered newest first. Limit defaults to 20 and accepts 1–100. |
| `GET /notifications/stream` | `200 text/event-stream` with an initial `connected` event, heartbeat comments, and `notification` events. |
| `GET /notifications/unread-count` | `200` with `{"count":2}`. |
| `PATCH /notifications/{id}/read` | `204`, including if already read. A missing or another user's ID returns `404`. |
| `POST /notifications/read-all` | `204` after marking the caller's unread notifications as read. |

The notification object has `id`, `type`, `errandId`, `message`, `createdAt`, and `readAt`
(`null` when unread). SSE uses the same object as JSON data and sets the SSE ID to the
notification ID. After each `connected` event, fetch recent history and merge by ID.
This recovers missed alerts within the requested history window. The stream accepts
reconnect requests carrying `Last-Event-ID`, with catch-up handled by the history endpoint.
Live connections are held in memory, so deploy one notification-service instance for live delivery.
Reconnect with a fresh token when the current one expires. Read-status changes are
available through the HTTP endpoints. Refresh history or the count after marking read.

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
