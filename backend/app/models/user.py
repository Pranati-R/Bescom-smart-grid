from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(200))
    hashed_password = Column(String(300), nullable=False)
    role = Column(String(50), default="analyst")
    department = Column(String(100))
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    preferences = Column(Text, default="{}")
