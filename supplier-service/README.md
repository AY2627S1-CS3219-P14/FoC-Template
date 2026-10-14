# Supplier Service

Spring Boot service for managing Friend on Campus suppliers, campus pickup locations, and supplier categories.

## Prerequisites

- Java 17
- Maven 3.9+ or the included Maven wrapper
- A running Docker environment with Docker Compose:
  - Windows/macOS: Docker Desktop (includes Docker Compose)
  - Linux: Docker Desktop, or Docker Engine with the Docker Compose plugin

Verify Java and Maven before starting:

```powershell
java -version
mvn -version
```

`java -version` and the Java runtime reported by `mvn -version` should both be Java 17.

## Start the service locally

The development PostgreSQL database is defined in the repository root `compose.yaml`. Copy `.env.example` to `.env` if `.env` does not exist.

### 1. Start PostgreSQL

From the repository root:

```powershell
docker compose up -d supplier-db
```

The container runs PostgreSQL on port `5432` internally and exposes it at `localhost:5433` for applications running on the host.

### 2. Configure the Spring process

The root `.env` is read by Docker Compose, but it is not automatically loaded when Spring is started directly through Maven. Set the variables in the same terminal that will start Spring.

Windows PowerShell:

```powershell
$env:DB_HOST="localhost"; $env:DB_PORT="5433"; $env:DB_NAME="campuscouriers_supplier"; $env:DB_USERNAME="supplier"; $env:DB_PASSWORD="password"
```

macOS/Linux (bash or zsh):

```bash
DB_HOST=localhost DB_PORT=5433 DB_NAME=campuscouriers_supplier DB_USERNAME=supplier DB_PASSWORD=password
```

These values must match the Supplier database values in the root `.env`.

### 3. Start Spring Boot

```
cd supplier-service
```

Windows:

```powershell
# Maven Wrapper (recommended)
.\mvnw.cmd spring-boot:run

OR

# System-installed Maven
mvn spring-boot:run
```

macOS/Linux:

```bash
# Maven Wrapper (recommended)
./mvnw spring-boot:run

OR

# System-installed Maven
mvn spring-boot:run
```

The service starts at [http://localhost:8080](http://localhost:8080).

## Seed the initial supplier data

The importer reads `src/main/resources/seed/supplier-seed-data.csv` and runs at
startup when `SUPPLIER_SEED_ENABLED=true`. It creates missing categories,
buildings, and suppliers. Existing suppliers are skipped, so the same file can
be imported again without creating duplicates. Disable seeding after the import.

### Windows PowerShell

From the repository root, start PostgreSQL:

```powershell
cd C:\path\to\CS3219
docker compose --env-file .env up -d supplier-db
docker compose --env-file .env stop supplier-service
```

For a clean import, delete existing suppliers before deleting the referenced
buildings and categories. Skip this command when testing the importer's
idempotent rerun behavior.

```powershell
docker compose --env-file .env exec -T supplier-db `
  psql -U supplier -d campuscouriers_supplier `
  -v ON_ERROR_STOP=1 `
  -c "BEGIN; DELETE FROM suppliers; DELETE FROM buildings; DELETE FROM categories; COMMIT;"
```

Run the supplier service as a one-off container with seeding enabled:

```powershell
docker compose --env-file .env run --rm `
  -e SUPPLIER_SEED_ENABLED=true `
  -e SUPPLIER_SEED_FILE=classpath:seed/supplier-seed-data.csv `
  supplier-service
```

Wait for the `Supplier seed import complete` log message, then press `Ctrl+C`.
The one-off container is removed, but the committed records remain in PostgreSQL.

From the repository root, verify the stored counts. `psql` runs inside the
PostgreSQL container; it does not need to be installed on Windows.

```powershell
docker compose --env-file .env exec -T supplier-db `
  psql -U supplier -d campuscouriers_supplier `
  -c "SELECT (SELECT COUNT(*) FROM suppliers) AS suppliers, (SELECT COUNT(*) FROM buildings) AS buildings, (SELECT COUNT(*) FROM categories) AS categories;"
```

Start the normal long-running service with seeding disabled (the default):

```powershell
docker compose --env-file .env up -d supplier-service
```

### macOS/Linux (bash or zsh)

From the repository root, start PostgreSQL:

```bash
cd /path/to/CS3219
docker compose --env-file .env up -d supplier-db
docker compose --env-file .env stop supplier-service
```

For a clean import, clear suppliers, buildings, and categories in foreign-key-safe
order. Skip this command when testing an idempotent rerun.

```bash
docker compose --env-file .env exec -T supplier-db \
  psql -U supplier -d campuscouriers_supplier \
  -v ON_ERROR_STOP=1 \
  -c "BEGIN; DELETE FROM suppliers; DELETE FROM buildings; DELETE FROM categories; COMMIT;"
```

Run the supplier service as a one-off container with seeding enabled:

```bash
docker compose --env-file .env run --rm \
  -e SUPPLIER_SEED_ENABLED=true \
  -e SUPPLIER_SEED_FILE=classpath:seed/supplier-seed-data.csv \
  supplier-service
```

Wait for the `Supplier seed import complete` log message, then press `Ctrl+C`.
The one-off container is removed, but the committed records remain in PostgreSQL.
Verify the persisted counts from the repository root:

```bash
cd ..
docker compose --env-file .env exec -T supplier-db \
  psql -U supplier -d campuscouriers_supplier \
  -c "SELECT (SELECT COUNT(*) FROM suppliers) AS suppliers, (SELECT COUNT(*) FROM buildings) AS buildings, (SELECT COUNT(*) FROM categories) AS categories;"
```

Start the normal long-running service with seeding disabled (the default):

```bash
docker compose --env-file .env up -d supplier-service
```


## Run the tests

Start the Docker environment, then run:

Windows:

```powershell
# Maven Wrapper (recommended)
.\mvnw.cmd clean test

OR

# System-installed Maven
mvn clean test
```

macOS/Linux:

```bash
# Maven Wrapper (recommended)
./mvnw clean test

OR

# System-installed Maven
mvn clean test
```

The tests use Testcontainers to start a temporary PostgreSQL 16 database. They do not use the persistent `supplier-db` development container or its data.

## Stop the development database

From the repository root:

```powershell
docker compose stop supplier-db
```

The named Docker volume preserves database data between restarts. Do not run `docker compose down --volumes` unless the development data should be deleted.

## Troubleshooting

### Connection to `localhost:5432` refused

The Supplier database is exposed on host port `5433`. Set the Spring process variable before starting the service:

Windows PowerShell:

```powershell
$env:DB_PORT = "5433"
```

macOS/Linux:

```bash
export DB_PORT=5433
```

### `DB_USERNAME` or `DB_PASSWORD` cannot be resolved

Set both variables in the same terminal used to run Maven:

Windows PowerShell:

```powershell
$env:DB_USERNAME = "supplier"
$env:DB_PASSWORD = "password"
```

macOS/Linux:

```bash
export DB_USERNAME=supplier
export DB_PASSWORD=password
```

### Tests cannot find Docker

Start the Docker environment and wait until its engine is running before executing the tests. On Windows/macOS this normally means starting Docker Desktop; on Linux, start Docker Desktop or the Docker Engine service used by the machine.
