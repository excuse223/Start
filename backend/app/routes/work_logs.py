from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
from app.database import get_db
from app.models import WorkLog, Employee

router = APIRouter()

# Pydantic schemas
class WorkLogBase(BaseModel):
    employee_id: int
    work_date: date
    work_hours: Decimal = Decimal("0.0")
    overtime_hours: Decimal = Decimal("0.0")
    vacation_hours: Decimal = Decimal("0.0")
    sick_leave_hours: Decimal = Decimal("0.0")
    other_hours: Decimal = Decimal("0.0")
    absent_hours: Decimal = Decimal("0.0")
    notes: Optional[str] = None

    @field_validator('work_hours', 'overtime_hours', 'vacation_hours', 'sick_leave_hours', 'other_hours', 'absent_hours')
    @classmethod
    def validate_hours(cls, v):
        if v < 0:
            raise ValueError('Hours cannot be negative')
        return v

class WorkLogCreate(WorkLogBase):
    pass

class WorkLogUpdate(WorkLogBase):
    pass

class WorkLogResponse(WorkLogBase):
    id: int
    created_at: datetime
    updated_at: datetime
    warning: Optional[str] = None
    
    class Config:
        from_attributes = True

def validate_total_hours(work_log: WorkLogBase) -> Optional[str]:
    """Validate total hours and return warning if > 12"""
    total = (work_log.work_hours + work_log.overtime_hours + 
             work_log.vacation_hours + work_log.sick_leave_hours + 
             work_log.other_hours + work_log.absent_hours)
    
    if total > 12:
        return f"Warning: Total hours ({total}) exceeds 12 hours per day"
    return None

@router.get("", response_model=List[WorkLogResponse])
def get_work_logs(
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get work logs with optional filters"""
    query = db.query(WorkLog)
    
    if employee_id:
        query = query.filter(WorkLog.employee_id == employee_id)
    
    if start_date:
        query = query.filter(WorkLog.work_date >= start_date)
    
    if end_date:
        query = query.filter(WorkLog.work_date <= end_date)
    
    work_logs = query.offset(skip).limit(limit).all()
    return work_logs

@router.get("/summary")
def get_work_logs_summary(db: Session = Depends(get_db)):
    """Get summary of all work logs"""
    work_logs = db.query(WorkLog).all()
    
    if not work_logs:
        return {
            "total_work_hours": 0,
            "total_overtime_hours": 0,
            "total_vacation_hours": 0,
            "total_sick_leave_hours": 0,
            "total_absent_hours": 0,
            "total_other_hours": 0,
            "total_logs": 0
        }
    
    total_work = 0
    total_overtime = 0
    total_vacation = 0
    total_sick = 0
    total_absent = 0
    total_other = 0
    
    # Convert Decimal to float for JSON serialization
    for log in work_logs:
        total_work += float(log.work_hours)
        total_overtime += float(log.overtime_hours)
        total_vacation += float(log.vacation_hours)
        total_sick += float(log.sick_leave_hours)
        total_absent += float(log.absent_hours)
        total_other += float(log.other_hours)
    
    return {
        "total_work_hours": total_work,
        "total_overtime_hours": total_overtime,
        "total_vacation_hours": total_vacation,
        "total_sick_leave_hours": total_sick,
        "total_absent_hours": total_absent,
        "total_other_hours": total_other,
        "total_logs": len(work_logs)
    }

@router.get("/{work_log_id}", response_model=WorkLogResponse)
def get_work_log(work_log_id: int, db: Session = Depends(get_db)):
    """Get work log by ID"""
    work_log = db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    if not work_log:
        raise HTTPException(status_code=404, detail="Work log not found")
    return work_log

@router.post("", response_model=WorkLogResponse, status_code=201)
def create_work_log(work_log: WorkLogCreate, db: Session = Depends(get_db)):
    """Create a new work log"""
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == work_log.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check for existing log for same employee and date
    existing_log = db.query(WorkLog).filter(
        and_(WorkLog.employee_id == work_log.employee_id, 
             WorkLog.work_date == work_log.work_date)
    ).first()
    
    if existing_log:
        raise HTTPException(
            status_code=400, 
            detail="Work log already exists for this employee and date. Use PUT to update."
        )
    
    # Validate total hours
    warning = validate_total_hours(work_log)
    
    # Create work log
    db_work_log = WorkLog(**work_log.model_dump())
    db.add(db_work_log)
    db.commit()
    db.refresh(db_work_log)
    
    # Add warning to response if applicable
    response = WorkLogResponse.model_validate(db_work_log)
    response.warning = warning
    
    return response

@router.put("/{work_log_id}", response_model=WorkLogResponse)
def update_work_log(work_log_id: int, work_log: WorkLogUpdate, db: Session = Depends(get_db)):
    """Update a work log"""
    db_work_log = db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    if not db_work_log:
        raise HTTPException(status_code=404, detail="Work log not found")
    
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == work_log.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check for conflicts with other logs
    existing_log = db.query(WorkLog).filter(
        and_(
            WorkLog.employee_id == work_log.employee_id,
            WorkLog.work_date == work_log.work_date,
            WorkLog.id != work_log_id
        )
    ).first()
    
    if existing_log:
        raise HTTPException(
            status_code=400,
            detail="Another work log already exists for this employee and date"
        )
    
    # Validate total hours
    warning = validate_total_hours(work_log)
    
    # Update work log
    for key, value in work_log.model_dump().items():
        setattr(db_work_log, key, value)
    
    # The updated_at field is automatically updated by SQLAlchemy onupdate
    db.commit()
    db.refresh(db_work_log)
    
    # Add warning to response if applicable
    response = WorkLogResponse.model_validate(db_work_log)
    response.warning = warning
    
    return response

@router.delete("/{work_log_id}", status_code=204)
def delete_work_log(work_log_id: int, db: Session = Depends(get_db)):
    """Delete a work log"""
    db_work_log = db.query(WorkLog).filter(WorkLog.id == work_log_id).first()
    if not db_work_log:
        raise HTTPException(status_code=404, detail="Work log not found")
    
    db.delete(db_work_log)
    db.commit()
    return None
