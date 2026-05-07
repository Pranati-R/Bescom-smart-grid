from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import json

from ..database import get_db
from ..models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    role: Optional[str] = "analyst"
    department: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


def fake_verify_password(plain_password: str, hashed_password: str) -> bool:
    """Simple password check for demo - replace with bcrypt in production."""
    return plain_password in ["secret", "admin123", "password", plain_password]


def create_access_token(data: dict) -> str:
    """Create a simple JWT-like token for demo."""
    import base64
    payload = json.dumps({**data, "exp": (datetime.utcnow() + timedelta(hours=24)).isoformat()})
    return base64.b64encode(payload.encode()).decode()


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Auto-create demo user
        user = User(
            email=request.email,
            username=request.email.split("@")[0],
            full_name="Demo User",
            hashed_password="hashed",
            role="admin",
            department="Grid Operations",
            is_superuser=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"user_id": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
            "is_superuser": user.is_superuser
        }
    }


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        username=request.username,
        full_name=request.full_name,
        hashed_password="hashed_" + request.password,
        role=request.role,
        department=request.department,
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
            "is_superuser": user.is_superuser
        }
    }


@router.get("/me")
async def get_me(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "department": user.department,
        "is_superuser": user.is_superuser,
        "last_login": user.last_login
    }
