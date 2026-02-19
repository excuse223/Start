from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging
import os

from app.routes import employees, work_logs, reports
from app.routes import auth
from app.database import engine, Base
from app.middleware.security import (
    SecurityHeadersMiddleware,
    HttpsEnforcementMiddleware,
    SecurityLoggingMiddleware,
)
from app.limiter import limiter
from config.security import validate_all, get_allowed_origins
from utils.logger import get_logger

# Initialise logging first so all subsequent log calls are captured
_log = get_logger("app")

# Validate security configuration on startup
_env = os.getenv("NODE_ENV", os.getenv("APP_ENV", "development"))
validate_all(env=_env)

app = FastAPI(
    title="Work Hours Management System",
    description="Work hours management and billing system",
    version="1.0.1"
)

# --- Middleware (order matters: first added = outermost wrapper) ---

# Security headers (helmet.js equivalent) — must be first so every response gets headers
app.add_middleware(SecurityHeadersMiddleware)

# HTTPS enforcement
_force_https = os.getenv("FORCE_HTTPS", "false").lower() == "true"
app.add_middleware(HttpsEnforcementMiddleware, force_https=_force_https)

# Security event logging
app.add_middleware(SecurityLoggingMiddleware)

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS — use whitelist from environment in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Include routers
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(work_logs.router, prefix="/api/work-logs", tags=["work-logs"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Work Hours Management System API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    _log.info("404 Not Found: %s %s", request.method, request.url.path)
    return JSONResponse(status_code=404, content={"detail": "Not found"})

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    _log.error("Unhandled error: %s %s — %s", request.method, request.url.path, exc)
    if _env == "production":
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# Create tables on startup (for development - use Alembic for production)
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    from init_db import init_database
    init_database()
