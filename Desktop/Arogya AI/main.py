"""
FastAPI application entry point for OPD Report Simplifier.
"""

import os
from contextlib import asynccontextmanager

import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

from routes.explain import router as explain_router
from routes.upload import router as upload_router

# Load environment variables from .env if present
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown hooks."""
    # Ensure upload directory exists
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    yield


app = FastAPI(
    title="OPD Report Simplifier API",
    description="Extract text from PDF and image OPD reports",
    version="1.0.0",
    lifespan=lifespan,
)

@app.exception_handler(RequestValidationError)
async def _validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Log 422 details to aid debugging of schema/enum mismatches."""
    logger.warning(
        "422 Unprocessable Entity on %s %s — errors: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    for err in exc.errors():
        print(
            f"  422 validation error: loc={err.get('loc')} "
            f"type={err.get('type')!r} msg={err.get('msg')!r} "
            f"input={err.get('input')!r}"
        )
    return JSONResponse(
        status_code=422,
        content={"success": False, "detail": exc.errors()},
    )

# CORS — allow frontend origins from env or default to local dev
_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in _cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(explain_router, prefix="/api", tags=["explain"])


@app.get("/health")
async def health_check():
    """Liveness probe for load balancers and monitoring."""
    return {"status": "ok", "service": "opd-report-simplifier"}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
