"""Security configuration and validation for production deployments."""
import os
import sys
import logging

logger = logging.getLogger(__name__)

# Insecure default values that must be replaced in production
_DEFAULT_JWT_SECRETS = {
    "your-super-secret-jwt-key-change-in-production-min-32-chars",
    "secret",
    "default",
    "changeme",
}

_DEFAULT_ADMIN_PASSWORDS = {"admin123", "admin", "password", "changeme"}
_DEFAULT_DB_PASSWORDS = {"postgres", "password", "changeme"}


def validate_jwt_secret(env: str = "production") -> str:
    """Validate JWT_SECRET meets minimum security requirements."""
    secret = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production-min-32-chars")
    issues = []

    if len(secret) < 32:
        issues.append("JWT_SECRET must be at least 32 characters")
    if secret in _DEFAULT_JWT_SECRETS:
        issues.append("JWT_SECRET must not be a default/example value")

    if issues:
        msg = "JWT_SECRET validation failed: " + "; ".join(issues)
        if env == "production":
            logger.critical(msg)
            sys.exit(1)
        else:
            logger.warning(msg)

    return secret


def validate_admin_password(env: str = "production") -> None:
    """Validate DEFAULT_ADMIN_PASSWORD is not a known-weak default."""
    password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
    if password in _DEFAULT_ADMIN_PASSWORDS:
        msg = "DEFAULT_ADMIN_PASSWORD must not be a default/example value"
        if env == "production":
            logger.critical(msg)
            sys.exit(1)
        else:
            logger.warning(msg)


def validate_database_url(env: str = "production") -> None:
    """Validate DATABASE_URL does not use a default/insecure password."""
    url = os.getenv("DATABASE_URL", "")
    for weak_password in _DEFAULT_DB_PASSWORDS:
        # Check if the URL contains ":password@" or ":postgres@" etc.
        if f":{weak_password}@" in url:
            msg = f"DATABASE_URL contains an insecure default password ('{weak_password}')"
            if env == "production":
                logger.critical(msg)
                sys.exit(1)
            else:
                logger.warning(msg)
            return


def validate_all(env: str = "production") -> None:
    """Run all security validations. Exits in production if any check fails."""
    validate_jwt_secret(env)
    validate_admin_password(env)
    validate_database_url(env)


def get_allowed_origins() -> list[str]:
    """Return list of allowed CORS origins from environment."""
    origins_str = os.getenv("ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in origins_str.split(",") if o.strip()] if origins_str else []

    # Always include localhost for development
    localhost_origins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
    for lo in localhost_origins:
        if lo not in origins:
            origins.append(lo)

    # Auto-detect GitHub Codespaces
    codespace_name = os.getenv("CODESPACE_NAME")
    if codespace_name:
        domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
        for port in ["3000", "5173", "8080"]:
            cs_origin = f"https://{codespace_name}-{port}.{domain}"
            if cs_origin not in origins:
                origins.append(cs_origin)

    return origins
