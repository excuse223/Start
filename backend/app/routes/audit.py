from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import AuditLog, User
from app.middleware.auth import require_role

router = APIRouter()


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


def _admin_only(current_user: User = Depends(require_role('admin'))) -> User:
    return current_user


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
