import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.claude import ClaudeClient
from app.retrieval import Retriever
from app.schemas import QueryRequest, QueryResponse


app = FastAPI(title="RAG Service")
allowed_origins = [
    origin.strip()
    for origin in os.getenv("RAG_CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)
retriever = Retriever()
claude = ClaudeClient()


@app.post("/query", response_model=QueryResponse)
def query_chunks(request: QueryRequest) -> QueryResponse:
    chunks = retriever.find_relevant_chunks(request.query, request.top_k)
    answer = claude.answer(request.query, chunks)
    return QueryResponse(answer=answer)
