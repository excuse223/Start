from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models import Employee, WorkLog

router = APIRouter()

# Pydantic schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    hourly_rate: Optional[float] = None
    overtime_rate: Optional[float] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    pass

class LastEntry(BaseModel):
    date: date
    work_hours: float

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    last_entry: Optional[LastEntry] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[EmployeeResponse])
def get_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all employees"""
    employees = db.query(Employee).offset(skip).limit(limit).all()
    if not employees:
        return []

    emp_ids = [emp.id for emp in employees]

    # Fetch the latest work_date per employee in one query
    latest_date_sq = (
        db.query(
            WorkLog.employee_id.label('employee_id'),
            func.max(WorkLog.work_date).label('max_date'),
        )
        .filter(WorkLog.employee_id.in_(emp_ids))
        .group_by(WorkLog.employee_id)
        .subquery()
    )

    # Fetch the actual work logs matching each employee's latest date
    latest_logs = (
        db.query(WorkLog)
        .join(
            latest_date_sq,
            (WorkLog.employee_id == latest_date_sq.c.employee_id) &
            (WorkLog.work_date == latest_date_sq.c.max_date),
        )
        .all()
    )

    last_log_by_emp = {log.employee_id: log for log in latest_logs}

    result = []
    for emp in employees:
        last_log = last_log_by_emp.get(emp.id)
        last_entry = None
        if last_log:
            last_entry = LastEntry(date=last_log.work_date, work_hours=float(last_log.work_hours))
        emp_resp = EmployeeResponse(
            id=emp.id,
            first_name=emp.first_name,
            last_name=emp.last_name,
            email=emp.email,
            hourly_rate=emp.hourly_rate,
            overtime_rate=emp.overtime_rate,
            created_at=emp.created_at,
            updated_at=emp.updated_at,
            last_entry=last_entry,
        )
        result.append(emp_resp)
    return result

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get employee by ID"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    """Create a new employee"""
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db)):
    """Update an employee"""
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for key, value in employee.model_dump().items():
        setattr(db_employee, key, value)
    
    # The updated_at field is automatically updated by SQLAlchemy onupdate
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """Delete an employee"""
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_employee)
    db.commit()
    return None
