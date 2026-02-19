"""Centralised logging configuration with rotating file handlers."""
import logging
import logging.handlers
import os
from pathlib import Path

_configured = False


def get_logger(name: str = "app") -> logging.Logger:
    """Return a logger, configuring handlers the first time this is called."""
    global _configured
    if not _configured:
        _configure_logging()
        _configured = True
    return logging.getLogger(name)


def _configure_logging() -> None:
    env = os.getenv("NODE_ENV", os.getenv("APP_ENV", "development"))
    log_level_str = os.getenv("LOG_LEVEL", "INFO" if env == "production" else "DEBUG")
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)

    log_file_path = os.getenv("LOG_FILE_PATH", "/var/log/work-hours-tracker")

    root = logging.getLogger()
    root.setLevel(log_level)

    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    # Console handler (always in development, also in production for stdout capture by pm2)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(fmt)
    console_handler.setLevel(log_level)
    root.addHandler(console_handler)

    # File handlers only when the log directory exists (production)
    log_dir = Path(log_file_path)
    if log_dir.exists() and log_dir.is_dir():
        # combined.log — all messages, 14-day retention
        _add_rotating_handler(root, log_dir / "combined.log", log_level, fmt, backup_count=14)
        # error.log — errors only, 30-day retention
        _add_rotating_handler(root, log_dir / "error.log", logging.ERROR, fmt, backup_count=30)
        # security.log — security events, 90-day retention
        security_logger = logging.getLogger("security")
        _add_rotating_handler(security_logger, log_dir / "security.log", logging.DEBUG, fmt, backup_count=90)


def _add_rotating_handler(
    logger: logging.Logger,
    path: Path,
    level: int,
    fmt: logging.Formatter,
    backup_count: int,
) -> None:
    handler = logging.handlers.TimedRotatingFileHandler(
        str(path),
        when="midnight",
        backupCount=backup_count,
        encoding="utf-8",
    )
    handler.setLevel(level)
    handler.setFormatter(fmt)
    logger.addHandler(handler)
