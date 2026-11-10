# RAG Service

This folder contains the RAG database setup and the one-off job used to import
reviewed knowledge chunks.

## Chunk file

Add or edit chunks in [`ingestion/chunks.csv`](ingestion/chunks.csv). The file
must contain exactly one column named `chunk_text`:

```csv
chunk_text
"Users can register for an account before using account-based platform features."
"A courier can view open errands and accept one to complete."
```

## Populate the database

From the repository root, start the database:

```powershell
docker compose up -d rag-database
```

Run the indexing job:

```powershell
docker compose --profile jobs run --rm rag-index
```

The job reads `ingestion/chunks.csv`, generates 384-dimensional embeddings
with `all-MiniLM-L6-v2`, clears the existing `chunks` table, resets the numeric
IDs, and inserts the complete CSV contents in one transaction.

Because the table is fully replaced on every import, this command is also the
procedure for updating the database after changing `chunks.csv`.

If the importer code or dependencies changed, rebuild its image first:

```powershell
docker compose build rag-index
docker compose --profile jobs run --rm rag-index
```

If only the CSV changed, run the indexing command without rebuilding.
