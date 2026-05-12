from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Match
from schemas import UserResponse, MatchResponse
from auth import get_current_user
from services.ai_match import calculate_match_score

router = APIRouter()

# 喜欢某个用户
@router.post("/like/{user_id}")
async def like_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 检查目标用户是否存在
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot like yourself")

    # 检查是否已经匹配过
    existing_match = db.query(Match).filter(
        ((Match.user_id_1 == current_user.id) & (Match.user_id_2 == user_id)) |
        ((Match.user_id_1 == user_id) & (Match.user_id_2 == current_user.id))
    ).first()

    if existing_match:
        raise HTTPException(status_code=400, detail="Already interacted with this user")

    # 计算匹配分数
    match_score = await calculate_match_score(current_user, target_user)

    # 创建匹配记录
    new_match = Match(
        user_id_1=current_user.id,
        user_id_2=user_id,
        match_score=match_score,
        status="pending"
    )
    db.add(new_match)
    db.commit()

    return {"message": "Like recorded", "match_score": match_score}

# 跳过某个用户
@router.post("/pass/{user_id}")
async def pass_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 检查目标用户是否存在
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 创建拒绝记录
    new_match = Match(
        user_id_1=current_user.id,
        user_id_2=user_id,
        match_score=0.0,
        status="rejected"
    )
    db.add(new_match)
    db.commit()

    return {"message": "Pass recorded"}

# 获取推荐列表
@router.get("/recommendations", response_model=List[UserResponse])
async def get_recommendations(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 获取已经交互过的用户ID
    interacted_users = db.query(Match.user_id_2).filter(
        Match.user_id_1 == current_user.id
    ).all()
    interacted_ids = [u[0] for u in interacted_users]
    interacted_ids.append(current_user.id)  # 排除自己

    # 获取推荐用户
    recommendations = db.query(User).filter(
        User.id.notin_(interacted_ids),
        User.is_active == True
    ).offset(skip).limit(limit).all()

    return recommendations

# 获取匹配成功列表
@router.get("/matches", response_model=List[MatchResponse])
async def get_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 获取所有匹配成功的记录
    matches = db.query(Match).filter(
        ((Match.user_id_1 == current_user.id) | (Match.user_id_2 == current_user.id)) &
        (Match.status == "accepted")
    ).all()

    # 添加匹配用户信息
    result = []
    for match in matches:
        matched_user_id = match.user_id_2 if match.user_id_1 == current_user.id else match.user_id_1
        matched_user = db.query(User).filter(User.id == matched_user_id).first()
        match_dict = {
            "id": match.id,
            "user_id_1": match.user_id_1,
            "user_id_2": match.user_id_2,
            "match_score": match.match_score,
            "status": match.status,
            "created_at": match.created_at,
            "matched_user": matched_user
        }
        result.append(match_dict)

    return result
