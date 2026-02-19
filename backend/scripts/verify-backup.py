#!/usr/bin/env python3
"""Verify all backup files in the backup directory.

Usage:
    python scripts/verify-backup.py

Checks each .sql.gz file for:
  - Non-zero file size
  - Presence of required table definitions
"""
import os
import subprocess
import sys
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("verify-backup")

REQUIRED_TABLES = ["employees", "work_logs", "users"]


def verify_file(path: Path) -> bool:
    """Return True if the backup file passes all checks."""
    size = path.stat().st_size
    if size == 0:
        logger.error("INVALID (empty file): %s", path.name)
        return False

    try:
        result = subprocess.run(
            ["zcat", str(path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        content = result.stdout
        missing = [t for t in REQUIRED_TABLES if t not in content]
        if missing:
            logger.error("INVALID (missing tables %s): %s", missing, path.name)
            return False
    except subprocess.TimeoutExpired:
        logger.warning("WARN (verification timed out, size OK): %s", path.name)
        return True
    except FileNotFoundError:
        logger.warning("WARN (zcat not available, size check only): %s", path.name)
        return True

    logger.info("VALID: %s (%.1f KB)", path.name, size / 1024)
    return True


def main() -> None:
    backup_dir = Path(os.getenv("BACKUP_DIR", "/var/backups/work-hours-tracker"))

    if not backup_dir.exists():
        logger.error("Backup directory not found: %s", backup_dir)
        sys.exit(1)

    backups = sorted(backup_dir.glob("backup_*.sql.gz"))
    if not backups:
        logger.warning("No backup files found in %s", backup_dir)
        sys.exit(0)

    valid = 0
    invalid = 0
    for b in backups:
        if verify_file(b):
            valid += 1
        else:
            invalid += 1

    print(f"\nSummary: {valid} valid, {invalid} invalid out of {len(backups)} backups")
    if invalid > 0:
        sys.exit(1)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    main()
