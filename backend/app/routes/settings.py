from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from app.database import get_db
from app.models import Setting, User
from app.middleware.auth import require_role

router = APIRouter()

DEFAULT_SETTINGS = {
    "company_name": ("Work Hours Manager", "Company name displayed in the system"),
    "company_logo_url": ("", "URL to company logo"),
    "currency": ("USD", "Currency used for billing"),
    "timezone": ("UTC", "Default timezone"),
    "date_format": ("DD/MM/YYYY", "Date format"),
    "default_work_hours": ("8", "Default work hours per day"),
    "overtime_threshold": ("8", "Hours per day before overtime kicks in"),
    "session_timeout_minutes": ("60", "Session timeout in minutes"),
    "min_password_length": ("12", "Minimum required password length"),
}


class SettingResponse(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    settings: Dict[str, str]


def _admin_only(current_user: User = Depends(require_role('admin'))) -> User:
    return current_user


def _ensure_defaults(db: Session):
    for key, (default_val, description) in DEFAULT_SETTINGS.items():
        existing = db.query(Setting).filter(Setting.key == key).first()
        if not existing:
            setting = Setting(key=key, value=default_val, description=description)
            db.add(setting)
    db.commit()


@router.get("", response_model=List[SettingResponse])
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    _ensure_defaults(db)
    return db.query(Setting).order_by(Setting.key).all()


@router.put("")
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    _ensure_defaults(db)
    for key, value in data.settings.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = value
            setting.updated_by = current_user.id
        else:
            setting = Setting(key=key, value=value, updated_by=current_user.id)
            db.add(setting)
    db.commit()
    return {"message": "Settings updated successfully"}
