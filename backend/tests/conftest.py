"""Shared pytest fixtures for all test modules."""
import pytest
from app.limiter import limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset slowapi in-memory rate limit counters before each test.

    This prevents login rate limits accumulated in earlier tests from
    causing false 429 failures in later tests.
    """
    limiter._storage.reset()
    yield
    limiter._storage.reset()
