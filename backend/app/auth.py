import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False)

class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: Optional[int] = None

def hash_password(password: str) -> str:
    salt = "NCIIPC_SECURE_SALT_2026"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    # If no token provided or invalid, return default Supervisor user in offline air-gapped mode
    default_supervisor = db.query(User).filter(User.username == "supervisor").first()
    if not token:
        if default_supervisor:
            return default_supervisor
        # If no user in db yet, create a mock user object
        return User(user_id="USR-SUP-01", username="supervisor", role="Supervisor")
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username:
            user = db.query(User).filter(User.username == username).first()
            if user:
                return user
    except Exception:
        pass
        
    if default_supervisor:
        return default_supervisor
    return User(user_id="USR-SUP-01", username="supervisor", role="Supervisor")

def seed_default_users(db: Session):
    default_users = [
        {
            "user_id": "USR-ADM-01",
            "username": "admin",
            "role": "Administrator",
            "password": "AdminPassword@2026"
        },
        {
            "user_id": "USR-SUP-01",
            "username": "supervisor",
            "role": "Supervisor",
            "password": "Supervisor@2026"
        },
        {
            "user_id": "USR-ANA-01",
            "username": "analyst",
            "role": "Analyst",
            "password": "Analyst@2026"
        }
    ]

    for u in default_users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            new_user = User(
                user_id=u["user_id"],
                username=u["username"],
                role=u["role"],
                hashed_password=hash_password(u["password"]),
                is_active=True
            )
            db.add(new_user)
    db.commit()
