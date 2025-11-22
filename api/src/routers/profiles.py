"""
Profiles Router (T272-T273)
使用者個人檔案 API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import UserResponse, UserUpdate

router = APIRouter(prefix="/profiles", tags=["Profiles"])


# T272: GET /profiles/{user_id}
@router.get("/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T272: 取得使用者個人檔案

    取得指定使用者的公開資訊
    - 好友可看到完整資訊
    - 非好友只能看到基本資訊（依隱私設定）
    """
    # 驗證 user_id 格式
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

    # 查詢使用者
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 檢查是否被封鎖
    is_blocked = await db.blocklist.count_documents({
        "$or": [
            {"user_id": ObjectId(current_user_id), "blocked_user_id": ObjectId(user_id)},
            {"user_id": ObjectId(user_id), "blocked_user_id": ObjectId(current_user_id)}
        ]
    }) > 0

    if is_blocked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 檢查是否為好友
    is_friend = await db.friendships.count_documents({
        "$or": [
            {"user_id": ObjectId(current_user_id), "friend_id": ObjectId(user_id)},
            {"user_id": ObjectId(user_id), "friend_id": ObjectId(current_user_id)}
        ],
        "status": "accepted"
    }) > 0

    is_self = current_user_id == user_id

    # 取得運動統計
    total_workouts = await db.workouts.count_documents({
        "user_id": ObjectId(user_id),
        "is_deleted": False
    })

    # 取得最後運動時間
    last_workout = await db.workouts.find_one(
        {"user_id": ObjectId(user_id), "is_deleted": False},
        sort=[("start_time", -1)]
    )

    # 取得成就數量
    achievement_count = await db.achievements.count_documents({
        "user_id": ObjectId(user_id)
    })

    # 取得好友數量
    friend_count = await db.friendships.count_documents({
        "$or": [
            {"user_id": ObjectId(user_id)},
            {"friend_id": ObjectId(user_id)}
        ],
        "status": "accepted"
    })

    # 基本資訊
    profile = {
        "user_id": str(user["_id"]),
        "display_name": user.get("display_name", ""),
        "avatar_url": user.get("avatar_url"),
        "created_at": user.get("created_at"),
        "is_friend": is_friend,
        "is_self": is_self
    }

    # 隱私設定檢查
    privacy = user.get("privacy_settings", {})
    public_profile = privacy.get("public_profile", False)

    # 好友或自己或公開檔案可以看到更多資訊
    if is_friend or is_self or public_profile:
        profile.update({
            "total_workouts": total_workouts,
            "achievement_count": achievement_count,
            "friend_count": friend_count,
            "last_workout_at": last_workout["start_time"] if last_workout else None,
        })

        # 詳細統計（僅好友和自己）
        if (is_friend or is_self) and privacy.get("share_detailed_stats", True):
            # 計算累計距離
            pipeline = [
                {"$match": {"user_id": ObjectId(user_id), "is_deleted": False}},
                {"$group": {"_id": None, "total_distance": {"$sum": "$distance_km"}}}
            ]
            result = await db.workouts.aggregate(pipeline).to_list(1)
            total_distance = result[0]["total_distance"] if result else 0

            profile["total_distance_km"] = total_distance

    return profile


# T273: PUT /profiles/me
@router.put("/me")
async def update_my_profile(
    request: UserUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T273: 更新個人檔案

    更新當前使用者的個人資訊
    """
    # 構建更新資料
    update_data = {}

    if request.display_name is not None:
        update_data["display_name"] = request.display_name

    if request.avatar_url is not None:
        update_data["avatar_url"] = request.avatar_url

    if request.privacy_settings is not None:
        update_data["privacy_settings"] = request.privacy_settings.dict()

    if request.preferences is not None:
        update_data["preferences"] = request.preferences.dict()

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    update_data["updated_at"] = datetime.now(timezone.utc)

    # 更新使用者
    result = await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 取得更新後的使用者資料
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})

    return {
        "user_id": str(user["_id"]),
        "display_name": user.get("display_name", ""),
        "avatar_url": user.get("avatar_url"),
        "privacy_settings": user.get("privacy_settings", {}),
        "preferences": user.get("preferences", {}),
        "updated_at": user.get("updated_at")
    }


# Additional: GET /profiles/me
@router.get("/me")
async def get_my_profile(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得當前使用者的完整個人檔案
    """
    return await get_user_profile(
        user_id=current_user_id,
        current_user_id=current_user_id,
        db=db
    )
