#!/usr/bin/env python3
"""Automated database backup using pg_dump.

Usage:
    python scripts/backup.py

Environment variables:
    DATABASE_URL        PostgreSQL connection URL
    BACKUP_DIR          Directory to store backups (default: /var/backups/work-hours-tracker)
    BACKUP_RETENTION_DAYS  Days to keep backups (default: 7)
    BACKUP_REMOTE_ENABLED  Set to 'true' to enable SCP remote sync
    BACKUP_REMOTE_HOST  Remote host for SCP (user@host)
    BACKUP_REMOTE_PATH  Remote path for SCP
"""
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("backup")


def _parse_db_url(url: str) -> dict:
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "dbname": parsed.path.lstrip("/"),
    }


def create_backup(backup_dir: Path) -> Path:
    """Create a pg_dump backup and return the file path."""
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        logger.error("DATABASE_URL is not set")
        sys.exit(1)

    db = _parse_db_url(db_url)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"backup_{timestamp}.sql.gz"

    env = os.environ.copy()
    if db["password"]:
        env["PGPASSWORD"] = db["password"]

    cmd = [
        "pg_dump",
        "-h", db["host"],
        "-p", db["port"],
        "-U", db["user"],
        db["dbname"],
    ]

    logger.info("Creating backup: %s", backup_file)
    try:
        with open(backup_file, "wb") as f:
            dump = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
            gzip = subprocess.Popen(["gzip"], stdin=dump.stdout, stdout=f, stderr=subprocess.PIPE)
            dump.stdout.close()
            gzip_out, gzip_err = gzip.communicate()
            dump.wait()

        if dump.returncode != 0:
            _, dump_err = dump.communicate()
            logger.error("pg_dump failed: %s", dump_err.decode())
            backup_file.unlink(missing_ok=True)
            sys.exit(1)

        logger.info("Backup created: %s (%.1f KB)", backup_file, backup_file.stat().st_size / 1024)
        return backup_file
    except FileNotFoundError:
        logger.error("pg_dump not found. Install postgresql-client.")
        sys.exit(1)


def verify_backup(backup_file: Path) -> bool:
    """Verify a backup file is non-empty and contains expected table definitions."""
    if not backup_file.exists():
        logger.error("Backup file not found: %s", backup_file)
        return False

    size = backup_file.stat().st_size
    if size == 0:
        logger.error("Backup file is empty: %s", backup_file)
        return False

    # Check the compressed backup contains expected table markers
    try:
        result = subprocess.run(
            ["zcat", str(backup_file)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        content = result.stdout
        required_tables = ["employees", "work_logs", "users"]
        missing = [t for t in required_tables if t not in content]
        if missing:
            logger.warning("Backup may be incomplete — missing tables: %s", missing)
            return False
        logger.info("Backup verified OK: %s", backup_file)
        return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        # zcat not available or timeout — accept size check only
        logger.warning("Could not verify backup contents (zcat unavailable), size check passed")
        return True


def clean_old_backups(backup_dir: Path, retention_days: int) -> None:
    """Delete backup files older than retention_days."""
    cutoff = datetime.utcnow() - timedelta(days=retention_days)
    for f in sorted(backup_dir.glob("backup_*.sql.gz")):
        mtime = datetime.utcfromtimestamp(f.stat().st_mtime)
        if mtime < cutoff:
            f.unlink()
            logger.info("Deleted old backup: %s", f)


def sync_remote(backup_file: Path) -> None:
    """Optionally sync the backup to a remote host via SCP."""
    remote_host = os.getenv("BACKUP_REMOTE_HOST", "")
    remote_path = os.getenv("BACKUP_REMOTE_PATH", "~/backups/")
    if not remote_host:
        logger.warning("BACKUP_REMOTE_HOST is not set; skipping remote sync")
        return
    cmd = ["scp", str(backup_file), f"{remote_host}:{remote_path}"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        logger.info("Remote sync successful: %s -> %s:%s", backup_file, remote_host, remote_path)
    else:
        logger.error("Remote sync failed: %s", result.stderr)


def list_backups(backup_dir: Path) -> list[Path]:
    """Return sorted list of all backup files."""
    return sorted(backup_dir.glob("backup_*.sql.gz"))


def main() -> None:
    backup_dir = Path(os.getenv("BACKUP_DIR", "/var/backups/work-hours-tracker"))
    retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", "7"))
    remote_enabled = os.getenv("BACKUP_REMOTE_ENABLED", "false").lower() == "true"

    backup_dir.mkdir(parents=True, exist_ok=True)

    backup_file = create_backup(backup_dir)
    valid = verify_backup(backup_file)
    if not valid:
        logger.error("Backup verification failed for %s", backup_file)
        sys.exit(1)

    if remote_enabled:
        sync_remote(backup_file)

    clean_old_backups(backup_dir, retention_days)

    logger.info("Backup completed successfully")
    backups = list_backups(backup_dir)
    logger.info("Available backups (%d):", len(backups))
    for b in backups:
        logger.info("  %s (%.1f KB)", b.name, b.stat().st_size / 1024)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    main()
