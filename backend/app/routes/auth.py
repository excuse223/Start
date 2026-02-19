from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
import os

from app.database import get_db
from app.models import User
from app.middleware.auth import get_current_user

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Pydantic schemas ---

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    employee_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse


def _create_token(user: User) -> str:
    secret_key = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production-min-32-chars")
    algorithm = os.getenv("ALGORITHM", "HS256")
    expires_in = os.getenv("JWT_EXPIRES_IN", "7d")

    # Parse simple duration strings like "7d", "24h", "60m"
    unit = expires_in[-1]
    try:
        amount = int(expires_in[:-1])
    except ValueError:
        amount = 7
        unit = "d"

    if unit == "d":
        delta = timedelta(days=amount)
    elif unit == "h":
        delta = timedelta(hours=amount)
    elif unit == "m":
        delta = timedelta(minutes=amount)
    else:
        delta = timedelta(days=7)

    payload = {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "employee_id": user.employee_id,
        "exp": datetime.now(timezone.utc) + delta,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


# POST /api/auth/login
@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not request.username or not request.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username and password required")

    user = db.query(User).filter(User.username == request.username).first()
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = _create_token(user)
    return TokenResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


# GET /api/auth/me
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# POST /api/auth/logout
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # JWT logout is handled client-side by discarding the token
    return {"message": "Logged out successfully"}
