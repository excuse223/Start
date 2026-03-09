from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import WorkLog, Employee
from app.middleware.auth import get_current_user, User

router = APIRouter()


class DayEntry(BaseModel):
    date: date
    work_hours: float
    overtime_hours: float
    vacation_hours: float
    sick_leave_hours: float
    notes: Optional[str] = None


class CalendarResponse(BaseModel):
    year: int
    month: int
    employee_id: Optional[int]
    days: List[DayEntry]


@router.get("", response_model=CalendarResponse)
def get_calendar(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # If employee_id not provided, use current user's linked employee
    if employee_id is None and current_user.employee_id:
        employee_id = current_user.employee_id

    query = db.query(WorkLog).filter(
        WorkLog.work_date >= date(year, month, 1),
    )

    import calendar
    last_day = calendar.monthrange(year, month)[1]
    query = query.filter(WorkLog.work_date <= date(year, month, last_day))

    if employee_id:
        query = query.filter(WorkLog.employee_id == employee_id)
    elif current_user.role != 'admin':
        # Non-admin without employee link sees nothing
        query = query.filter(WorkLog.employee_id == -1)

    logs = query.order_by(WorkLog.work_date).all()

    days = [
        DayEntry(
            date=log.work_date,
            work_hours=float(log.work_hours or 0),
            overtime_hours=float(log.overtime_hours or 0),
            vacation_hours=float(log.vacation_hours or 0),
            sick_leave_hours=float(log.sick_leave_hours or 0),
            notes=log.notes,
        )
        for log in logs
    ]

    return CalendarResponse(year=year, month=month, employee_id=employee_id, days=days)
