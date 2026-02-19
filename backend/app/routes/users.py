import re
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User, Employee
from app.middleware.auth import get_current_user, require_role

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_logger = logging.getLogger("security")

_USERNAME_RE = re.compile(r'^[a-zA-Z0-9._-]{3,50}$')
_PASSWORD_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$')


# --- Pydantic schemas ---

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    employee_id: Optional[int] = None

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not _USERNAME_RE.match(v):
            raise ValueError('Username must be 3-50 chars, alphanumeric + dots/underscores/hyphens')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError('Password must be at least 8 chars with uppercase, lowercase, and number')
        return v

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ('admin', 'manager', 'employee'):
            raise ValueError('Role must be admin, manager, or employee')
        return v


class UserUpdate(BaseModel):
    role: Optional[str] = None
    employee_id: Optional[int] = None

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('admin', 'manager', 'employee'):
            raise ValueError('Role must be admin, manager, or employee')
        return v


class PasswordChange(BaseModel):
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not _PASSWORD_RE.match(v):
            raise ValueError('Password must be at least 8 chars with uppercase, lowercase, and number')
        return v


class EmployeeShort(BaseModel):
    id: int
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    employee_id: Optional[int]
    employee: Optional[EmployeeShort]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Helper ---

def _admin_required(current_user: User = Depends(require_role('admin'))) -> User:
    return current_user


# GET /api/users
@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    return db.query(User).all()


# GET /api/users/:id
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# POST /api/users
@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    if data.employee_id is not None:
        employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=400, detail="Employee not found")

    user = User(
        username=data.username,
        password_hash=pwd_context.hash(data.password),
        role=data.role,
        employee_id=data.employee_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    security_logger.info("User created: %s by %s", user.username, current_user.username)
    return user


# PUT /api/users/:id
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    if current_user.id == user_id and data.role is not None and data.role != current_user.role:
        raise HTTPException(status_code=400, detail="Cannot change own role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.role is not None:
        user.role = data.role
    if data.employee_id is not None:
        employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
        if not employee:
            raise HTTPException(status_code=400, detail="Employee not found")
        user.employee_id = data.employee_id
    elif 'employee_id' in data.model_fields_set:
        user.employee_id = None

    db.commit()
    db.refresh(user)
    security_logger.info("User updated: %s by %s", user.username, current_user.username)
    return user


# DELETE /api/users/:id
@router.delete("/{user_id}", status_code=200)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_required),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == 'admin':
        admin_count = db.query(User).filter(User.role == 'admin').count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin")

    db.delete(user)
    db.commit()
    security_logger.info("User deleted: %s by %s", user.username, current_user.username)
    return {"message": "User deleted successfully"}


# PUT /api/users/:id/password
@router.put("/{user_id}/password", status_code=200)
def change_user_password(
    user_id: int,
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != 'admin' and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = pwd_context.hash(data.new_password)
    db.commit()
    security_logger.info("Password changed for user %s by %s", user.username, current_user.username)
    return {"message": "Password updated successfully"}
