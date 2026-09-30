# Initial Supplier Data Import - Handoff

## Goal

Implement a one-time, repeatable importer for `data/csv/supplier-seed-data.csv`.
The file currently contains 21 suppliers. The importer should create categories
and buildings as they are encountered, so they do not need to be inserted
beforehand.

This is seed/bootstrap functionality, not a public CSV-upload endpoint.

## Agreed domain mapping

| CSV column | Destination | Handling |
| --- | --- | --- |
| `Name` | Supplier `name` | Required; trim/collapse whitespace; maximum 60 characters |
| `Type` | Category | Resolve case-insensitively or create as `ACTIVE` |
| `Building` | Building | Resolve by normalized name or create as `ACTIVE` |
| `Floor` | Supplier `floor` | Optional; maximum 20 characters |
| `Location Description` | Supplier `description` | Optional; maximum 500 characters |
| `StartingTime` | Supplier `openingTime` | Parse strict `HHmmhrs` into `LocalTime` |
| `ClosingTime` | Supplier `closingTime` | Parse strict `HHmmhrs` into `LocalTime` |
| `ImageURL` | Supplier `imageUrl` | Optional; blank becomes `null` |
| `Latitude` | None | Ignore |
| `Longitude` | None | Ignore |

Supplier duplicate identity is the normalized `(name, building)` pair. Floor is
not part of duplicate identity.

## Recommended implementation shape

Add a dedicated package such as `importer` containing:

- `SupplierSeedImporter`: owns the transactional import workflow.
- `SupplierSeedCsvReader`: reads and parses CSV rows.
- `SupplierSeedRow`: typed representation of one CSV record.
- `SupplierSeedImportException`: reports the row number and reason for failure.
- An `ApplicationRunner` or `CommandLineRunner` that runs only when an explicit
  configuration flag is enabled.

Use a maintained CSV parser such as Apache Commons CSV instead of manually
splitting on commas. Descriptions and future fields may contain commas or quoted
text.

Suggested configuration:

```properties
supplier.seed.enabled=${SUPPLIER_SEED_ENABLED:false}
supplier.seed.file=${SUPPLIER_SEED_FILE:classpath:seed/supplier-seed-data.csv}
```

Keep seeding disabled during normal startup. Enable it deliberately for a clean
environment or deployment bootstrap. Ensure the CSV is available inside the
application/container, either as a classpath resource or a mounted file.

## Import workflow

Run the entire import in one transaction:

1. Open the configured CSV and validate the expected headers.
2. Read each row while retaining its one-based CSV line number.
3. Normalize and validate every value using the same limits and normalization
   rules as the create APIs.
4. Resolve the category by normalized name.
   - Reuse it if it exists and is `ACTIVE`.
   - Create it as `ACTIVE` if it does not exist.
   - Fail if the matching category exists but is retired.
5. Resolve the building by normalized name using the same rules.
   - Reuse it if it exists and is `ACTIVE`.
   - Create it as `ACTIVE` if it does not exist.
   - Fail if the matching building exists but is retired.
6. Check for an existing supplier using normalized `(name, building)`.
   - If it already exists, leave it unchanged and count the row as skipped.
   - Otherwise create an `ACTIVE` supplier.
7. Flush before committing so database constraint violations are reported by
   the importer.
8. Log a summary containing total rows, created suppliers, skipped suppliers,
   created categories, and created buildings.

If any row is malformed or violates a rule, throw an exception containing the
row number and field/reason. The transaction must roll back all categories,
buildings, and suppliers created during that run. Do not continue with a
partially imported dataset.

## Idempotency and concurrency

Running the importer again against the same database must create no duplicate
records. Use repository lookups before insertion and retain database unique
constraints as the final safeguard:

- Category: normalized name unique.
- Building: normalized name unique.
- Supplier: normalized `(name, building)` unique.

The importer should not overwrite an existing supplier during a rerun. Changes
to seed data should be handled deliberately in a later migration/import policy,
not silently applied during startup.

Only one importer instance should run during deployment. Database constraints
still protect against duplicates if two instances accidentally start together,
but deployment/bootstrap configuration should avoid concurrent seed runs.

## Dataset cleanup decisions needed during implementation

Normalize known building spelling variants before lookup so they do not create
separate buildings:

- `Com2` and `Com 2` should resolve to one agreed display name, preferably
  `COM2`.
- `COM3` should retain consistent capitalization.
- One CSV value appears as `Prince George�s Park`, with a malformed apostrophe;
  normalize it to `Prince George's Park` before lookup.

Prefer a small explicit alias map for these known data corrections. Do not make
general normalization so aggressive that genuinely different building names
collapse into one record.

Times such as `0000hrs` and `2359hrs` are valid. A closing time earlier than an
opening time may represent overnight opening and should not automatically be
rejected unless the team decides otherwise. The current entity stores only one
opening and closing time and has no separate overnight flag.

The current GitHub `blob` image URLs are not direct image URLs. Initially they
may be stored as supplied, or changed to approved direct/service-managed URLs in
a separate cleanup task. Image handling must not block importing the core data.

## Tests to add

- CSV parsing test for valid `HHmmhrs` times, blanks, quoted commas, and invalid
  values.
- Importer service test proving categories and buildings are created on demand.
- Test proving repeated category/building names are reused.
- Test proving a second full import is a no-op for suppliers.
- Test proving `(name, building)` duplicates are skipped even when case or
  whitespace differs.
- Test proving the known building aliases resolve to one building.
- PostgreSQL Testcontainers integration test for the complete 21-row file.
- Rollback test proving one invalid row leaves no partial seed data.
- Disabled-runner test proving ordinary application startup does not seed.

## Completion criteria

- A clean PostgreSQL database imports all 21 valid supplier rows.
- Categories and buildings are created automatically during the import.
- Known building aliases do not produce duplicates.
- Latitude and longitude are ignored.
- A second run produces zero new suppliers.
- Any invalid row rolls back the complete run with a useful row-level error.
- Normal service startup does not run the importer unless explicitly enabled.
- All existing tests and the new importer tests pass.

## Current repository constraints

- The service currently uses `spring.jpa.hibernate.ddl-auto=update`; Flyway has
  not yet been introduced.
- Names are limited to 60 characters.
- Supplier `floor`, `description`, and `imageUrl` limits are 20, 500, and 500
  characters respectively.
- Categories, buildings, and suppliers use UUID identifiers and status enums.
- The importer should reuse the existing `NameNormalizer`, repositories, entity
  constructors, and duplicate semantics rather than creating parallel rules.
