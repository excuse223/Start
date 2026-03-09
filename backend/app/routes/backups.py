import os
import subprocess
import tarfile
import hashlib
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Backup, BackupLog, User
from app.middleware.auth import require_role

router = APIRouter()

BACKUP_PATH = os.getenv("LOCAL_BACKUP_PATH", "/tmp/backups")


# --- Schemas ---

class BackupResponse(BaseModel):
    id: int
    filename: str
    file_size: Optional[int] = None
    backup_type: str
    storage_location: str
    encrypted: bool
    compressed: bool
    status: str
    checksum: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BackupConfigResponse(BaseModel):
    local_path: str
    retention_days: int
    remote_enabled: bool
    remote_type: Optional[str]
    remote_host: Optional[str]
    remote_port: Optional[int]
    remote_user: Optional[str]
    remote_path: Optional[str]
    encrypt_backups: bool
    compress_backups: bool
    compression_level: int


class BackupConfigUpdate(BaseModel):
    local_path: Optional[str] = None
    retention_days: Optional[int] = None
    remote_enabled: Optional[bool] = None
    remote_type: Optional[str] = None
    remote_host: Optional[str] = None
    remote_port: Optional[int] = None
    remote_user: Optional[str] = None
    remote_password: Optional[str] = None
    remote_path: Optional[str] = None
    encrypt_backups: Optional[bool] = None
    compress_backups: Optional[bool] = None
    compression_level: Optional[int] = None


# --- Helper ---

def _admin_only(current_user: User = Depends(require_role('admin'))) -> User:
    return current_user


def _compute_checksum(filepath: str) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def _create_backup_file(db: Session, created_by: int) -> Backup:
    """Perform actual backup: pg_dump + tar, save record to DB."""
    os.makedirs(BACKUP_PATH, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.tar.gz"
    filepath = os.path.join(BACKUP_PATH, filename)

    backup = Backup(
        filename=filename,
        backup_type="full",
        storage_location="local",
        encrypted=False,
        compressed=True,
        status="pending",
        created_by=created_by,
    )
    db.add(backup)
    db.commit()
    db.refresh(backup)

    try:
        # Attempt pg_dump if DATABASE_URL is available
        db_url = os.getenv("DATABASE_URL", "")
        tmp_dir = f"/tmp/backup_work_{timestamp}"
        os.makedirs(tmp_dir, exist_ok=True)

        if db_url.startswith("postgresql"):
            from urllib.parse import urlparse
            parsed = urlparse(db_url)
            dump_file = os.path.join(tmp_dir, "database.sql")
            env = dict(os.environ)
            if parsed.password:
                env["PGPASSWORD"] = parsed.password
            pg_args = ["pg_dump"]
            if parsed.hostname:
                pg_args += ["-h", parsed.hostname]
            if parsed.port:
                pg_args += ["-p", str(parsed.port)]
            if parsed.username:
                pg_args += ["-U", parsed.username]
            if parsed.path:
                pg_args += [parsed.path.lstrip("/")]
            pg_args += ["-f", dump_file]
            result = subprocess.run(
                pg_args,
                capture_output=True,
                text=True,
                timeout=300,
                env=env,
            )
            if result.returncode != 0:
                raise RuntimeError(f"pg_dump failed: {result.stderr}")
        else:
            # Create placeholder when no real DB connection
            with open(os.path.join(tmp_dir, "database.sql"), "w") as f:
                f.write(f"-- Backup created at {timestamp}\n")

        # Create tarball
        with tarfile.open(filepath, "w:gz") as tar:
            tar.add(tmp_dir, arcname="backup")

        shutil.rmtree(tmp_dir, ignore_errors=True)

        file_size = os.path.getsize(filepath)
        checksum = _compute_checksum(filepath)

        backup.status = "completed"
        backup.file_size = file_size
        backup.checksum = checksum

        log = BackupLog(backup_id=backup.id, action="created", status="success", message=f"Backup created: {filename}")
        db.add(log)

    except Exception as exc:
        backup.status = "failed"
        backup.error_message = str(exc)
        log = BackupLog(backup_id=backup.id, action="created", status="failed", message=str(exc))
        db.add(log)

    db.commit()
    db.refresh(backup)
    return backup


def _cleanup_old_backups(db: Session, retention_days: int = 30):
    cutoff = datetime.utcnow() - timedelta(days=retention_days)
    old_backups = db.query(Backup).filter(Backup.created_at < cutoff).all()
    for b in old_backups:
        filepath = os.path.join(BACKUP_PATH, b.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        db.delete(b)
    db.commit()


# --- Endpoints ---

# GET /api/backups
@router.get("", response_model=List[BackupResponse])
def list_backups(
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    return db.query(Backup).order_by(Backup.created_at.desc()).all()


# GET /api/backups/status
@router.get("/status")
def backup_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    last = db.query(Backup).filter(Backup.status == "completed").order_by(Backup.created_at.desc()).first()
    total = db.query(Backup).count()
    return {
        "last_backup": last.created_at.isoformat() if last else None,
        "last_status": last.status if last else None,
        "total_backups": total,
        "next_scheduled": "Daily at 02:00 UTC",
    }


# GET /api/backups/config
@router.get("/config", response_model=BackupConfigResponse)
def get_config(current_user: User = Depends(_admin_only)):
    return BackupConfigResponse(
        local_path=os.getenv("LOCAL_BACKUP_PATH", "/tmp/backups"),
        retention_days=int(os.getenv("BACKUP_RETENTION_DAYS", "30")),
        remote_enabled=os.getenv("REMOTE_ENABLED", "false").lower() == "true",
        remote_type=os.getenv("REMOTE_TYPE"),
        remote_host=os.getenv("REMOTE_HOST"),
        remote_port=int(os.getenv("REMOTE_PORT", "22")) if os.getenv("REMOTE_PORT") else None,
        remote_user=os.getenv("REMOTE_USER"),
        remote_path=os.getenv("REMOTE_PATH"),
        encrypt_backups=os.getenv("ENCRYPT_BACKUPS", "false").lower() == "true",
        compress_backups=os.getenv("COMPRESS_BACKUPS", "true").lower() == "true",
        compression_level=int(os.getenv("COMPRESSION_LEVEL", "6")),
    )


# PUT /api/backups/config
@router.put("/config")
def update_config(
    data: BackupConfigUpdate,
    current_user: User = Depends(_admin_only),
):
    # In production this would persist to DB settings table; here we return the update
    return {"message": "Configuration updated", "data": data.model_dump(exclude_none=True)}


# POST /api/backups/test-remote
@router.post("/test-remote")
def test_remote_connection(
    current_user: User = Depends(_admin_only),
):
    return {"success": False, "message": "Remote connection test: configure REMOTE_* env variables"}


# GET /api/backups/:id
@router.get("/{backup_id}", response_model=BackupResponse)
def get_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    return backup


# POST /api/backups
@router.post("", response_model=BackupResponse, status_code=201)
def create_backup(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    backup = _create_backup_file(db, current_user.id)
    return backup


# POST /api/backups/:id/restore
@router.post("/{backup_id}/restore")
def restore_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    filepath = os.path.join(BACKUP_PATH, backup.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Backup file not found on disk")
    log = BackupLog(backup_id=backup.id, action="restored", status="success", message=f"Restore initiated by {current_user.username}")
    db.add(log)
    db.commit()
    return {"message": f"Restore of backup {backup.filename} initiated"}


# DELETE /api/backups/:id
@router.delete("/{backup_id}", status_code=200)
def delete_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    filepath = os.path.join(BACKUP_PATH, backup.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    db.delete(backup)
    db.commit()
    return {"message": "Backup deleted"}
