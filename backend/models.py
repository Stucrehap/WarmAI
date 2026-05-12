from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    student_id = Column(String(20), unique=True, index=True)
    university = Column(String(100))
    major = Column(String(100))
    grade = Column(String(20))
    bio = Column(Text)
    interests = Column(JSON, default=[])
    avatar_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id_1 = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_id_2 = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_score = Column(Float)
    status = Column(String(20), default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)
