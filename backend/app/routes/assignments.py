import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User, Employee, ManagerEmployeeAssignment
from app.middleware.auth import get_current_user, require_role

router = APIRouter()
security_logger = logging.getLogger("security")


# --- Pydantic schemas ---

class AssignmentCreate(BaseModel):
    manager_user_id: int
    employee_id: int


class EmployeeShort(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    position: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentResponse(BaseModel):
    id: int
    manager_user_id: int
    employee_id: int
    assigned_at: datetime
    employee: Optional[EmployeeShort] = None

    class Config:
        from_attributes = True


# --- Helper ---

def _admin_required(current_user: User = Depends(require_role('admin'))) -> User:
    return current_user


# GET /api/assignments
@router.get("", response_model=List[AssignmentResponse])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    assignments = (
        db.query(ManagerEmployeeAssignment)
        .options(joinedload(ManagerEmployeeAssignment.employee))
        .all()
    )
    return assignments


# GET /api/assignments/manager/:managerId
@router.get("/manager/{manager_id}", response_model=List[AssignmentResponse])
def get_manager_assignments(
    manager_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admins can see any manager's assignments; managers can see their own
    if current_user.role != 'admin' and current_user.id != manager_id:
        raise HTTPException(status_code=403, detail="Access denied")

    assignments = (
        db.query(ManagerEmployeeAssignment)
        .options(joinedload(ManagerEmployeeAssignment.employee))
        .filter(ManagerEmployeeAssignment.manager_user_id == manager_id)
        .all()
    )
    return assignments


# POST /api/assignments
@router.post("", response_model=AssignmentResponse, status_code=201)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    manager = db.query(User).filter(User.id == data.manager_user_id).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager user not found")
    if manager.role != 'manager':
        raise HTTPException(status_code=400, detail="User is not a manager")

    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = db.query(ManagerEmployeeAssignment).filter(
        ManagerEmployeeAssignment.manager_user_id == data.manager_user_id,
        ManagerEmployeeAssignment.employee_id == data.employee_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee already assigned to this manager")

    assignment = ManagerEmployeeAssignment(
        manager_user_id=data.manager_user_id,
        employee_id=data.employee_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    security_logger.info(
        "Assignment created: manager=%s employee=%s by %s",
        data.manager_user_id,
        data.employee_id,
        current_user.username,
    )
    return assignment


# DELETE /api/assignments/:id
@router.delete("/{assignment_id}", status_code=200)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    assignment = db.query(ManagerEmployeeAssignment).filter(
        ManagerEmployeeAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    security_logger.info(
        "Assignment deleted: id=%s by %s", assignment_id, current_user.username
    )
    return {"message": "Assignment removed successfully"}
