from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# 用户相关Schema
class UserBase(BaseModel):
    username: str
    email: EmailStr
    student_id: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    grade: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[List[str]] = []

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# 匹配相关Schema
class MatchResponse(BaseModel):
    id: int
    user_id_1: int
    user_id_2: int
    match_score: float
    status: str
    created_at: datetime
    matched_user: UserResponse

    class Config:
        from_attributes = True

# 消息相关Schema
class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True

# Token相关Schema
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
