import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from main.create_errand import router as create_errand_router
from main.accept_errand import router as accept_errand_router
from main.cancel_errand import router as cancel_errand_router
from main.complete_errand import router as complete_errand_router
from main.fail_errand import router as fail_errand_router
from main.get_errands import router as get_errands_router


cors_allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ORDER_CORS_ALLOWED_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Order Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(create_errand_router)
app.include_router(accept_errand_router)
app.include_router(cancel_errand_router)
app.include_router(complete_errand_router)
app.include_router(fail_errand_router)
app.include_router(get_errands_router)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
