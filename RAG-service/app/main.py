from fastapi import FastAPI

from app.claude import ClaudeClient
from app.retrieval import Retriever
from app.schemas import QueryRequest, QueryResponse


app = FastAPI(title="RAG Service")
retriever = Retriever()
claude = ClaudeClient()


@app.post("/query", response_model=QueryResponse)
def query_chunks(request: QueryRequest) -> QueryResponse:
    chunks = retriever.find_relevant_chunks(request.query, request.top_k)
    answer = claude.answer(request.query, chunks)
    return QueryResponse(answer=answer)
