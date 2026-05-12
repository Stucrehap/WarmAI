from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserResponse, UserCreate
from auth import get_current_user

router = APIRouter()

# 获取用户资料
@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

# 更新用户资料
@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 更新用户信息
    for key, value in user_update.dict(exclude={"password"}).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user

# 获取指定用户信息
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
