"""Security middleware: security headers, HTTPS enforcement, and request logging."""
import logging
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

security_logger = logging.getLogger("security")

# Security headers equivalent to helmet.js defaults
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",  # Modern browsers: disable legacy XSS filter
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'"
    ),
    "Cache-Control": "no-store",
    "Pragma": "no-cache",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response (helmet.js equivalent)."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
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
