import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50)
    role: str = Field(..., pattern="^(admin|manager|employee)$")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Username must be alphanumeric with optional _.-"""
        if not re.match(r'^[a-zA-Z0-9_.-]+$', v):
            raise ValueError('Username can only contain letters, numbers, and _.-')
        return v


class UserCreate(UserBase):
    """Schema for creating new user"""
    password: str = Field(..., min_length=8)
    employee_id: Optional[int] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Enforce strong password requirements"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """Schema for updating existing user"""
    role: Optional[str] = Field(None, pattern="^(admin|manager|employee)$")
    employee_id: Optional[int] = None
    # Note: Password updates handled separately for security


class UserResponse(UserBase):
    """Schema for user response (no password)"""
    id: int
    employee_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True  # For Pydantic v2 (was orm_mode in v1)


class UserWithEmployee(UserResponse):
    """User response with linked employee details"""
    employee: Optional[dict] = None

    class Config:
        from_attributes = True
