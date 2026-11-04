# Notification service

Consumes committed errand outbox events from Kafka and stores notifications in PostgreSQL.
SSE delivery and public notification endpoints are not implemented yet.

| Kafka topic | Recipient | Notification type |
| --- | --- | --- |
| `errand.accepted` | `requesterId` | `ERRAND_ACCEPTED` |
| `errand.completed` | `courierId` | `ERRAND_COMPLETED` |
| `errand.failed` | `courierId` | `ERRAND_FAILED` |

Events are plain JSON with `errandId`, `requesterId`, `courierId` (UUIDs),
and positive integer `creditValue`. Additional payload fields are ignored.
The UTF-8 `eventId` Kafka header must contain the original outbox UUID;
see `../debezium/connectors/order-outbox.json`.
Cancellation and ready-for-collection events are not consumed.

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
The three source topics and their three-partition DLTs are declared automatically.
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
within one topic partition, so do not infer a total order across the three event topics.

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
