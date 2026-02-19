"""Shared rate limiter instance used by the app and individual route handlers."""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Global rate limiter: 100 requests per minute per IP (default for all API routes)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
