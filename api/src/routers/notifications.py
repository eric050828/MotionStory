"""
Notifications Router (T269-T273)
通知系統 API：通知管理與偏好設定
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Literal, Dict

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import NotificationResponse, NotificationPreferences
from ..services import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# T269: GET /notifications
@router.get("")
async def get_notifications(
    notification_type: Literal["friend_request", "friend_activity", "interaction", "challenge_update", "all"] = Query("all", alias="type"),
    read_status: Literal["read", "unread", "all"] = Query("all"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T269: 取得通知清單

    取得使用者的通知記錄
    - 支援類型篩選與分頁
    - 顯示最近 30 天的通知
    """
    service = NotificationService(db)

    result = await service.get_notifications(
        user_id=current_user_id,
        notification_type=notification_type,
        read_status=read_status,
        limit=limit,
        offset=offset
    )

    return result


# T270: POST /notifications/{notification_id}/read
@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_as_read(
    notification_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T270: 標記通知為已讀

    標記指定通知為已讀狀態
    """
    service = NotificationService(db)

    await service.mark_as_read(
        user_id=current_user_id,
        notification_id=notification_id
    )

    return {"message": "Notification marked as read"}


# T271: POST /notifications/read-all
@router.post("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_as_read(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T271: 全部標記為已讀

    將所有未讀通知標記為已讀
    """
    service = NotificationService(db)

    marked_count = await service.mark_all_as_read(user_id=current_user_id)

    return {"marked_count": marked_count}


# T272: DELETE /notifications/{notification_id}
@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T272: 刪除通知

    刪除指定通知
    """
    service = NotificationService(db)

    await service.delete_notification(
        user_id=current_user_id,
        notification_id=notification_id
    )


# T273: GET /notifications/preferences & PUT /notifications/preferences
@router.get("/preferences")
async def get_notification_preferences(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T273: 取得通知偏好設定

    取得使用者的通知偏好設定
    """
    service = NotificationService(db)

    preferences = await service.get_notification_preferences(user_id=current_user_id)

    return preferences


@router.put("/preferences")
async def update_notification_preferences(
    request: Dict,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T273: 更新通知偏好設定

    更新使用者的通知偏好
    - 可分別控制各類通知開關
    - 支援免打擾時段設定
    - 支援通知頻率控制
    """
    service = NotificationService(db)

    try:
        preferences = await service.update_notification_preferences(
            user_id=current_user_id,
            preferences=request
        )
        return preferences
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Additional: GET /notifications/unread-count
@router.get("/unread-count")
async def get_unread_notification_count(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得未讀通知數量

    快速查詢未讀通知總數（用於角標顯示）
    """
    service = NotificationService(db)

    result = await service.get_unread_count(user_id=current_user_id)

    return result
