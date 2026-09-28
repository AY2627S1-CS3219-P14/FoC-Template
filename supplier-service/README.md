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
