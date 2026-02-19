#!/usr/bin/env python3
"""Restore a database backup created by backup.py.

Usage:
    python scripts/restore.py [backup_file]

If backup_file is not given, lists available backups and prompts interactively.
"""
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("restore")


def _parse_db_url(url: str) -> dict:
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "postgres",
        "password": parsed.password or "",
        "dbname": parsed.path.lstrip("/"),
    }


def list_backups(backup_dir: Path) -> list[Path]:
    return sorted(backup_dir.glob("backup_*.sql.gz"))


def select_backup(backup_dir: Path) -> Path:
    """Interactively select a backup file from the available list."""
    backups = list_backups(backup_dir)
    if not backups:
        logger.error("No backups found in %s", backup_dir)
        sys.exit(1)

    print("\nAvailable backups:")
    for i, b in enumerate(backups, 1):
        size_kb = b.stat().st_size / 1024
        print(f"  [{i}] {b.name}  ({size_kb:.1f} KB)")

    print(f"\nEnter backup number to restore [1-{len(backups)}], or 'q' to quit: ", end="")
    choice = input().strip()
    if choice.lower() == "q":
        logger.info("Restore cancelled by user")
        sys.exit(0)

    try:
        idx = int(choice) - 1
        if idx < 0 or idx >= len(backups):
            raise ValueError
        return backups[idx]
    except ValueError:
        logger.error("Invalid selection")
        sys.exit(1)


def restore_backup(backup_file: Path) -> None:
    """Restore database from a gzip-compressed SQL backup."""
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        logger.error("DATABASE_URL is not set")
        sys.exit(1)

    db = _parse_db_url(db_url)

    print(f"\nWARNING: This will overwrite the database '{db['dbname']}' on {db['host']}.")
    print(f"Backup file: {backup_file}")
    print("Type 'yes' to confirm: ", end="")
    confirm = input().strip().lower()
    if confirm != "yes":
        logger.info("Restore cancelled by user")
        sys.exit(0)

    env = os.environ.copy()
    if db["password"]:
        env["PGPASSWORD"] = db["password"]

    logger.info("Restoring from %s ...", backup_file)
    try:
        gunzip = subprocess.Popen(
            ["zcat", str(backup_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        psql = subprocess.Popen(
            ["psql", "-h", db["host"], "-p", db["port"], "-U", db["user"], db["dbname"]],
            stdin=gunzip.stdout,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )
        gunzip.stdout.close()
        psql_out, psql_err = psql.communicate()
        gunzip.wait()

        if psql.returncode != 0:
            logger.error("Restore failed: %s", psql_err.decode())
            sys.exit(1)

        logger.info("Restore completed successfully")
    except FileNotFoundError as e:
        logger.error("Required tool not found: %s. Install postgresql-client.", e)
        sys.exit(1)


def main() -> None:
    backup_dir = Path(os.getenv("BACKUP_DIR", "/var/backups/work-hours-tracker"))

    if len(sys.argv) > 1:
        backup_file = Path(sys.argv[1])
        if not backup_file.exists():
            logger.error("Backup file not found: %s", backup_file)
            sys.exit(1)
    else:
        backup_file = select_backup(backup_dir)

    restore_backup(backup_file)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    main()
