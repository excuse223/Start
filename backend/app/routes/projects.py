from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.models import Project, Employee, User
from app.middleware.auth import get_current_user, require_role

router = APIRouter()


# --- Schemas ---

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[date] = None
    status: str = "planning"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[date] = None
    status: Optional[str] = None


class EmployeeShort(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    client: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[date] = None
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    employees: List[EmployeeShort] = []

    class Config:
        from_attributes = True


# --- Helpers ---

def _require_admin_or_manager(current_user: User = Depends(require_role('admin', 'manager'))) -> User:
    return current_user


# GET /api/projects
@router.get("", response_model=List[ProjectResponse])
def list_projects(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project)
    if status_filter:
        query = query.filter(Project.status == status_filter)
    return query.order_by(Project.created_at.desc()).all()


# GET /api/projects/:id
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# POST /api/projects
@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin_or_manager),
):
    project = Project(
        **data.model_dump(),
        created_by=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


# PUT /api/projects/:id
@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin_or_manager),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


# DELETE /api/projects/:id
@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('admin')),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None


# GET /api/projects/:id/employees
@router.get("/{project_id}/employees", response_model=List[EmployeeShort])
def get_project_employees(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.employees


class EmployeeAssign(BaseModel):
    employee_id: int


# POST /api/projects/:id/employees
@router.post("/{project_id}/employees", status_code=200)
def assign_employee_to_project(
    project_id: int,
    data: EmployeeAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin_or_manager),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee in project.employees:
        raise HTTPException(status_code=400, detail="Employee already assigned to this project")
    project.employees.append(employee)
    db.commit()
    return {"message": "Employee assigned to project"}


# DELETE /api/projects/:id/employees/:emp_id
@router.delete("/{project_id}/employees/{employee_id}", status_code=200)
def remove_employee_from_project(
    project_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin_or_manager),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee or employee not in project.employees:
        raise HTTPException(status_code=404, detail="Employee not found in project")
    project.employees.remove(employee)
    db.commit()
    return {"message": "Employee removed from project"}
