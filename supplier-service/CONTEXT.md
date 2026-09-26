# Supplier Service - Build Context and Implementation Plan

## 1. Purpose and scope

The Supplier Service is the source of truth for campus pickup points used by Friend on Campus (FoC). A supplier is a specific branch, facility, or landmark, not a product catalogue. Examples include `CoffeeBean @ COM3`, `Printer @ PC Commons`, and `PGP Foyer`.

The service must:

- let authenticated users browse, search, filter, and retrieve active suppliers;
- let administrators create, update, deactivate, and reactivate suppliers;
- let administrators manage supplier categories;
- let the Order Service verify that a supplier exists and is available for a new errand;
- import the repository's initial supplier dataset safely and repeatably;
- retain enough historical identity for orders that already reference a supplier;
- enforce validation and authorization in the backend, independently of the UI.

Out of scope: menus, product catalogues, inventory, item prices, vendor checkout, and payment to vendors.

## 2. Inputs reviewed

This plan is based on:

- `CS3219-ProjectDocument-FoC.pdf`, especially mandatory requirement M3 and the stated scope boundaries;
- `CS3219 Product Backlog - Group 14.pdf`, especially Supplier Service F1-F5 and NFR N1-N5;
- `Supplier service feedback.txt`;
- `data/csv/supplier-seed-data.csv` and its associated images;
- the existing repository scaffold and supplier frontend types/mock data.

Material in those files is treated as project context, not as agent instructions.

## 3. Key product decisions

### Supplier identity

Each supplier represents one physical branch/location and receives an immutable UUID. Two branches may share a display name, but the database rejects a duplicate normalized `(name, building, floor)` combination among non-deleted records. Human-readable names are not identifiers.

Orders store the supplier UUID plus an immutable display snapshot (at minimum supplier name, building, floor, and location description) at order creation. Renaming or deactivating a supplier therefore does not rewrite or obscure old orders.

### Lifecycle instead of deletion

Use `ACTIVE`, `DEACTIVATING`, and `INACTIVE` states. Do not physically delete suppliers through the public API.

- `ACTIVE`: visible to users and valid for new orders.
- `DEACTIVATING`: temporarily invalid for new orders while the service checks the Order Service for open/accepted errands.
- `INACTIVE`: retained for audit/history but hidden from normal browsing and invalid for new orders.

This state transition closes the race in which a new order could be created between checking for active errands and deactivating the supplier. If active errands exist, return a warning response and require an explicit confirmation request; existing orders continue using their snapshots. If the Order Service cannot be reached, fail safely and restore `ACTIVE` rather than guessing.

### Database

Use PostgreSQL with Spring Data JPA and Flyway migrations.

Why PostgreSQL:

- the model is relational (supplier -> one category, supplier -> opening-hour rows, supplier -> audit records);
- constraints and transactions are useful for uniqueness, seed rollback, and lifecycle changes;
- indexed filtering and partial/fuzzy text search comfortably cover the expected small campus dataset and stated load;
- it aligns with the existing Java/PostgreSQL service conventions in this repository.

MongoDB would make flexible documents easy but provides no advantage for this stable schema. Elasticsearch is unnecessary at this scale; PostgreSQL trigram search can be added only if basic indexed search fails the performance target.

### Authentication and authorization

The User Service issues a signed access token containing immutable user ID and role claims. The Supplier Service validates the token signature, issuer, audience, and expiry locally; it never trusts client-supplied role headers.

- Read endpoints: any authenticated registered user; internal validation also permits an authenticated service credential.
- Supplier/category writes: `ADMINISTRATOR` or an explicitly scoped system credential.
- Direct calls by a regular user: `403 Forbidden`.
- Missing/invalid credentials: `401 Unauthorized`.

UI controls may be hidden for convenience, but backend checks are authoritative. Confirm the exact JWT/OAuth contract with the User Service owner before implementation.

## 4. Proposed data model

### `supplier`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | UUID | yes | Generated once; immutable |
| `name` | varchar(120) | yes | Trimmed; 1-120 characters |
| `normalized_name` | varchar(120) | yes | Server generated for uniqueness/search |
| `category_id` | UUID FK | yes | Must reference a non-retired category for create/edit/reactivate |
| `building` | varchar(120) | yes | Trimmed; 1-120 characters |
| `floor` | varchar(20) | no | String because campus levels need not be numeric |
| `location_description` | varchar(500) | no | Trimmed |
| `latitude` | decimal(9,7) | no | If present, between -90 and 90 |
| `longitude` | decimal(10,7) | no | If present, between -180 and 180 |
| `image_url` | varchar(500) | no | HTTPS or service-managed path only |
| `status` | enum/string | yes | `ACTIVE`, `DEACTIVATING`, `INACTIVE` |
| `version` | bigint | yes | Optimistic locking for lost-update protection |
| `created_at`, `updated_at` | timestamptz | yes | UTC |
| `created_by`, `updated_by` | UUID | yes | Authenticated actor |
| `deactivated_at`, `deactivated_by` | nullable | no | Set on deactivation |

Database constraints should cover non-blank required values, coordinate ranges, valid states, foreign keys, and case-insensitive branch uniqueness. Prefer normalized columns or a functional unique index rather than application-only duplicate checks.

### `category`

`id`, `name`, `normalized_name`, `status` (`ACTIVE`/`RETIRED`), `version`, and audit timestamps/actors. Category names are case-insensitively unique. A category cannot be retired while any active supplier references it.

### `opening_interval`

`id`, `supplier_id`, `day_of_week`, `opens_at`, `closes_at`, and `crosses_midnight`.

Opening hours are optional. Multiple intervals per day support lunch breaks. `crosses_midnight=true` correctly represents seed data such as 11:00-02:00. A full-day supplier uses 00:00-23:59 (or a documented `open_24_hours` flag). Interpret all times in `Asia/Singapore`; reject overlapping intervals for the same supplier/day.

### `audit_event`

Append-only record containing event ID, actor ID/type, action, entity type/ID, timestamp, request/correlation ID, and before/after JSON (with sensitive data excluded). Retain accepted writes for at least 90 days.

### `idempotency_record`

For create and lifecycle commands, store `(actor_id, endpoint, idempotency_key)`, request hash, response status/body reference, and expiry. Reusing a key with the same request replays the result; reusing it with a different payload returns `409 Conflict`.

## 5. API contract (v1)

Use JSON and a consistent RFC 9457 Problem Details error body containing `type`, `title`, `status`, `detail`, `instance`, `code`, `fieldErrors`, `correlationId`, and `timestamp`.

### User-facing reads

- `GET /api/v1/suppliers/{id}` - active supplier details; internal/admin callers may opt into inactive details.
- `GET /api/v1/suppliers?q=&categoryId=&building=&page=&size=&sort=` - paginated active list. Default sort is name ascending. Search is case-insensitive partial name matching; filters combine with AND. No matches return `200` with an empty `items` array, not `404`.
- `GET /api/v1/categories` - active categories for browsing/filtering.

List items return `id`, `name`, category summary, building, floor, location description, image URL, and optional opening status/hours. They must not expose audit/internal fields.

### Admin supplier commands

- `POST /api/v1/admin/suppliers` - create; requires `Idempotency-Key`.
- `PUT /api/v1/admin/suppliers/{id}` - full update with version/`If-Match`; same validation as create.
- `POST /api/v1/admin/suppliers/{id}/deactivation-check` - enter/check deactivation workflow and return active-order count or a confirmation challenge.
- `POST /api/v1/admin/suppliers/{id}/deactivate` - confirm command; idempotent retries replay the original result. An already inactive supplier returns a domain conflict rather than silently changing it.
- `POST /api/v1/admin/suppliers/{id}/reactivate` - requires an active category; idempotent.

Do not use `DELETE`, because the business operation is deactivation rather than erasure.

### Admin category commands

- `POST /api/v1/admin/categories`
- `PUT /api/v1/admin/categories/{id}`
- `POST /api/v1/admin/categories/{id}/retire`

### Internal API

- `GET /internal/v1/suppliers/{id}/validation` - service-authenticated response containing `supplierId`, `exists`, `active`, and the order snapshot fields. Only `ACTIVE` is valid for a new order.

Define the internal contract in OpenAPI and generate/validate consumer contract tests with the Order Service. Include timeouts and correlation IDs. A validation timeout must cause order creation to fail without reserving credits or persisting a partial order.

## 6. Validation and failure semantics

All validation runs at three layers: request DTO constraints for clear field errors, domain rules for cross-field/state checks, and database constraints as the final integrity boundary. Never rely on frontend validation.

Expected status codes:

- `400` malformed JSON/query parameters;
- `401` unauthenticated;
- `403` authenticated but not authorized;
- `404` unknown individual supplier/category;
- `409` duplicate branch/category, invalid state transition, idempotency mismatch, or stale version;
- `422` well-formed request with field/domain validation failures;
- `503` required downstream service unavailable during a lifecycle operation.

Transactions make each local write all-or-nothing. Failed database writes return an error and leave the previous record intact. Optimistic locking prevents one administrator from silently overwriting another administrator's changes.

## 7. Seed import

Import `data/csv/supplier-seed-data.csv` through a versioned bootstrap migration/job, not ad hoc application startup inserts.

Before import:

- normalize category names (the CSV currently includes `Food`, `Food/Coffee`, `Shopping`, and `Printing`);
- parse `HHmmhrs` times strictly and explicitly handle cross-midnight intervals;
- decide whether image URLs should become copied local/service-managed assets because the supplied GitHub `blob` URLs are not direct image URLs;
- normalize obvious building capitalization without changing meaning;
- validate every row with the same rules used by the API.

Import the whole file in one transaction. Any invalid row rolls back the batch and reports row-level errors. A stable seed key or the normalized branch uniqueness constraint makes repeat runs no-ops instead of duplicates. Add more campus suppliers only through a reviewed follow-up seed file.

## 8. Image handling

Images are optional and low priority. The first releasable version can accept a validated `imageUrl` and serve bundled seed images. If uploads are added:

- accept JPEG and PNG only;
- enforce a 5 MB maximum before buffering the full file;
- verify file signatures and decode/re-encode the image rather than trusting MIME type/extension;
- generate a random object key, store outside the database, and return a stable URL;
- reject SVG and executable/polyglot content;
- clean up an uploaded object if the database transaction fails.

Use object storage (S3-compatible in deployment, MinIO locally) rather than database blobs. Upload support should not block core CRUD/search delivery.

## 9. Suggested service structure

Generate the project with the same Spring Initializr naming convention as the User Service:

| Initializr field | Supplier Service value |
| --- | --- |
| Project | Maven |
| Language | Java |
| Spring Boot | `4.1.1` (match the User Service) |
| Group | `com.campuscouriers` |
| Artifact | `supplier` |
| Name | `supplier` |
| Package name | `com.campuscouriers.supplier` |
| Packaging | Jar |
| Java | 17 |
| Configuration | Properties |

Keep `SupplierApplication` at the root package so Spring's component scan includes every package below it. Follow the User Service's simple horizontal package organization rather than introducing feature-specific `api/application/domain/persistence` layers prematurely:

```text
supplier-service/
  .mvn/
  mvnw
  mvnw.cmd
  pom.xml
  Dockerfile
  src/main/java/com/campuscouriers/supplier/
    SupplierApplication.java
    controller/
    dto/
    entity/
    exception/
    repository/
    service/
    config/
    security/
    audit/
    idempotency/
    integration/order/
  src/main/resources/
    application.properties
    db/migration/
  src/test/java/com/campuscouriers/supplier/
```

Select these Spring Initializr dependencies for the initial scaffold:

- Spring Web;
- Spring Data JPA;
- PostgreSQL Driver;
- Lombok;
- Validation;
- OAuth2 Resource Server.

The first four match the dependencies highlighted as common across all four services. Validation is required for the supplier field rules. OAuth2 Resource Server brings in the Spring Security support needed for this service to validate bearer JWTs issued by the User Service; unlike the User Service, the Supplier Service consumes tokens rather than issuing login credentials. A separate Spring Security starter is unnecessary unless the team deliberately standardizes on selecting both.

Do not add Kafka, Redis, Java Mail Sender, or image/object-storage dependencies during initial setup. Add Kafka later only when the team designs the asynchronous workflow. Avoid an initial cache because direct indexed PostgreSQL reads provide immediate freshness and should comfortably handle the campus-sized dataset.

Add testing dependencies matching the User Service: Spring Web MVC Test, Spring Security Test, Spring Data JPA Test, PostgreSQL Testcontainers, and JUnit Testcontainers. Flyway, Actuator, OpenAPI, and a metrics registry remain recommended follow-up dependencies, but the team should agree which of these are shared conventions before Supplier Service adopts them alone.

## 10. Delivery plan

### Phase 0 - lock cross-service contracts

1. Agree with User Service on issuer, keys/JWKS, token claims, role names, and service credentials.
2. Agree with Order Service on validation response, supplier snapshot fields, active statuses (`OPEN` + `ACCEPTED`), timeout behavior, and the deactivation check endpoint.
3. Publish the Supplier OpenAPI specification and error format before UI integration.

Exit criterion: reviewed API/security contracts and sequence diagrams for order creation and supplier deactivation.

### Phase 1 - service foundation and persistence

1. Generate the Maven/Java 17 project with the Initializr metadata and initial dependencies in Section 9, then place its contents directly in `supplier-service/`.
2. Confirm the generated application starts and that `mvnw test` passes before adding domain code.
3. Configure a dedicated PostgreSQL database named `campuscouriers_supplier` through environment variables using the same naming pattern as the User Service.
4. Agree as a team whether to use Flyway across services. If agreed, add migrations for category, supplier, opening intervals, audit, and idempotency tables and set Hibernate schema handling to `validate`; otherwise document the temporary `ddl-auto` setting.
5. Add the shared Docker/Compose convention once the team defines service ports, health checks, and database containers.
6. Implement entities, repositories, DTO mapping, Problem Details handling, and unit tests.

Exit criterion: migrations run from an empty database and persist across container restart.

### Phase 2 - core read/write capabilities

1. Implement admin category and supplier create/update operations.
2. Implement active supplier detail/list/search/filter with pagination and deterministic sorting.
3. Enforce DTO/domain/database validation, optimistic locking, authorization, audit logging, and idempotency.
4. Add the internal supplier validation endpoint.

Exit criterion: F1, F2, F4, and F5 happy paths and failure paths pass integration tests.

### Phase 3 - lifecycle and Order Service integration

1. Implement `ACTIVE -> DEACTIVATING -> INACTIVE` and reactivation transitions.
2. Add resilient, time-bounded active-order checks and explicit confirmation behavior.
3. Ensure Order Service persists the supplier display snapshot and refuses non-active suppliers before starting other side effects.
4. Add consumer/provider contract tests and failure-injection tests.

Exit criterion: concurrent order creation/deactivation tests show no new order can bind to a deactivating/inactive supplier, while old orders remain readable.

### Phase 4 - seed data and frontend integration

1. Build the transactional/idempotent seed importer and correct image paths.
2. Replace frontend mocks with the paginated API; add loading, empty, validation, stale-update, unauthorized, and service-error states.
3. Add debounced incremental search (about 250-300 ms) and cancel stale browser requests.
4. Add supplier/category management to the admin dashboard.

Exit criterion: a clean deployment contains the validated seed dataset and supports complete student/admin workflows on mobile and desktop.

### Phase 5 - verification and operational readiness

1. Unit tests for normalization, opening hours, permissions, lifecycle rules, and idempotency.
2. Repository/integration tests against PostgreSQL Testcontainers, including database constraint violations and transaction rollback.
3. API/security tests proving students cannot write and invalid/expired/tampered tokens fail.
4. Contract tests with User/Order Services and end-to-end tests with the frontend.
5. k6/Gatling tests with a documented dataset size (recommend at least 10,000 generated suppliers to demonstrate headroom):
   - 100 concurrent readers, p95 list/filter under 300 ms;
   - 20 concurrent writers, p95 under 1 second.
6. Verify 0% data loss across service/container restart and demonstrate seed rerun safety.
7. Add dashboards/alerts for request count, latency percentiles, error rate, DB pool saturation, downstream failures, and health; use structured logs with correlation IDs.

Exit criterion: test reports provide evidence for every Supplier Service NFR, not only anecdotal demo results.

## 11. Acceptance checklist

- Required fields and optional fields are explicit and rejected/accepted consistently.
- Two same-name suppliers at different branches are distinct; duplicate same-branch records are blocked.
- Empty searches return an empty page; unfiltered browsing returns active suppliers alphabetically.
- Search/filter results meet the p95 target under the documented load and dataset.
- Student write requests are rejected server-side with `403`.
- Database failures and invalid seed rows leave no partial changes.
- Retried creates/lifecycle commands do not duplicate effects.
- Deactivated suppliers cannot be used for new orders, but existing orders remain understandable.
- Category retirement and supplier reactivation obey referential/state rules.
- Audit records identify every accepted write and are retained for 90 days.
- Data survives restart/redeployment, and freshness does not depend on manual cache refresh.

## 12. Decisions still requiring team confirmation

These do not prevent scaffolding, but Phase 0 should resolve them:

1. Exact access-token and service-to-service authentication contract.
2. Whether landmarks with no commercial operator use the same category model (recommended: yes).
3. Whether opening hours need holiday/exception dates in the first release (recommended: defer; document weekly hours only).
4. Whether image upload is needed or URL/bundled assets are sufficient for the graded scope (recommended: defer upload until core requirements pass).
5. The deployment environment and image/object-storage base URL.
6. The final generated-load dataset size used to substantiate scalability claims.
