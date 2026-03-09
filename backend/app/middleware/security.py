"""Security middleware: security headers, HTTPS enforcement, and request logging."""
import logging
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

security_logger = logging.getLogger("security")

# Security headers equivalent to helmet.js defaults (excludes CSP, which is built dynamically)
_BASE_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",  # Modern browsers: disable legacy XSS filter
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cache-Control": "no-store",
    "Pragma": "no-cache",
}


def _build_csp() -> str:
    """Build Content-Security-Policy with dynamic connect-src for Codespaces."""
    connect_sources = ["'self'"]

    codespace_name = os.getenv("CODESPACE_NAME")
    if codespace_name:
        domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
        for port in ["3000", "5173", "8000"]:
            connect_sources.append(f"https://{codespace_name}-{port}.{domain}")

    # Also allow any explicitly configured API URL
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins:
        for origin in allowed_origins.split(","):
            origin = origin.strip()
            if origin and origin not in connect_sources:
                connect_sources.append(origin)

    connect_src = " ".join(connect_sources)

    return (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        f"connect-src {connect_src}"
    )


# Build CSP once at module load time; env vars are static for the process lifetime.
_CONTENT_SECURITY_POLICY: str = _build_csp()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response (helmet.js equivalent)."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Don't add security headers to CORS preflight responses
        if request.method == "OPTIONS":
            return response

        for header, value in _BASE_SECURITY_HEADERS.items():
            response.headers[header] = value

        response.headers["Content-Security-Policy"] = _CONTENT_SECURITY_POLICY

        return response


class HttpsEnforcementMiddleware(BaseHTTPMiddleware):
    """Redirect HTTP to HTTPS when FORCE_HTTPS=true."""

    def __init__(self, app, force_https: bool = False):
        super().__init__(app)
        self._force = force_https

    async def dispatch(self, request: Request, call_next) -> Response:
        if self._force:
            forwarded_proto = request.headers.get("x-forwarded-proto", "")
            if forwarded_proto == "http":
                url = request.url.replace(scheme="https")
                return RedirectResponse(url=str(url), status_code=301)
        return await call_next(request)


class SecurityLoggingMiddleware(BaseHTTPMiddleware):
    """Log security-relevant events (4xx/5xx responses with IP and path)."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        status_code = response.status_code
        if status_code in (401, 403, 429):
            client_ip = _get_client_ip(request)
            security_logger.warning(
                "Security event: status=%d method=%s path=%s ip=%s",
                status_code,
                request.method,
                request.url.path,
                client_ip,
            )
        return response


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For when behind a proxy."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
