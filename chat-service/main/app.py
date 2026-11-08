import asyncio
import contextlib
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from main.kafka_consumer import consume_lifecycle_events
from main.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    stop = asyncio.Event()
    task = None
    if os.getenv("KAFKA_CONSUMER_ENABLED", "false").lower() == "true":
        task = asyncio.create_task(consume_lifecycle_events(stop))
    try:
        yield
    finally:
        if task is not None:
            stop.set()
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task


allowed_origins = [
    origin.strip()
    for origin in os.getenv("CHAT_CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI(title="Chat Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(router)

