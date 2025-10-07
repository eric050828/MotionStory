"""
Achievements Router
成就列表、檢查、分享卡片
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict
from bson import ObjectId

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    AchievementResponse,
    AchievementTypeInfo,
    ShareCardCreateRequest,
    ShareCardResponse,
)
from ..services import AchievementService

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("", response_model=Dict)
async def list_achievements(
    limit: int = 20,
    skip: int = 0,
    achievement_type: str = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    列出使用者的成就

    - limit: 每頁數量
    - skip: 跳過數量
    - achievement_type: 篩選成就類型
    """
    query = {"user_id": ObjectId(current_user_id)}

    if achievement_type:
        query["achievement_type"] = achievement_type

    achievements = await db.achievements.find(query).sort(
        "achieved_at", -1
    ).skip(skip).limit(limit).to_list(length=limit)

    total = await db.achievements.count_documents(query)

    return {
        "achievements": [AchievementResponse(**a) for a in achievements],
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.post("/check", response_model=List[AchievementResponse])
async def check_achievements(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    手動觸發成就檢查

    - 檢查所有可能的成就
    - 回傳新觸發的成就列表
    """
    achievement_service = AchievementService(db)

    # 取得最新的運動記錄
    latest_workout = await db.workouts.find_one(
        {"user_id": ObjectId(current_user_id), "is_deleted": False},
        sort=[("start_time", -1)]
    )

    if not latest_workout:
        return []

    from ..models import WorkoutInDB
    workout = WorkoutInDB(**latest_workout)

    # 檢查成就
    achievements = await achievement_service.check_achievements(
        current_user_id, workout
    )

    return achievements


@router.get("/types", response_model=Dict)
async def get_achievement_types(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得所有成就類型列表

    - 包含成就類型、標題、描述、慶祝等級
    """
    achievement_service = AchievementService(db)

    achievement_types = await achievement_service.get_achievement_types()

    return {
        "achievement_types": achievement_types
    }


@router.post("/{achievement_id}/share-card", response_model=ShareCardResponse, status_code=status.HTTP_201_CREATED)
async def create_share_card(
    achievement_id: str,
    request: ShareCardCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    生成成就分享卡片

    - 生成圖片並上傳至 Cloudflare R2
    - 回傳分享卡片 URL
    """
    # 驗證成就存在且屬於當前使用者
    achievement = await db.achievements.find_one({
        "_id": ObjectId(achievement_id),
        "user_id": ObjectId(current_user_id)
    })

    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found"
        )

    from ..models import ShareCardInDB
    from datetime import datetime, timedelta, timezone

    # 建立分享卡片記錄
    share_card = ShareCardInDB(
        achievement_id=ObjectId(achievement_id),
        user_id=ObjectId(current_user_id),
        achievement_type=achievement["achievement_type"],
        template=request.template,
        title=achievement["metadata"].get("title", "成就達成"),
        description=achievement["metadata"].get("description", ""),
        metadata=achievement["metadata"],
        card_url=f"https://r2.motionstory.app/share-cards/{achievement_id}.png",  # TODO: 實際生成圖片
        r2_key=f"share-cards/{achievement_id}.png",
        includes_location=False,  # 根據隱私設定
        includes_detailed_stats=True,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )

    result = await db.share_cards.insert_one(share_card.dict(by_alias=True))
    share_card.id = result.inserted_id

    return ShareCardResponse(**share_card.dict(by_alias=True))
