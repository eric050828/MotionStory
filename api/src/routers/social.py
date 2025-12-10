"""
Social Router (T257-T261)
社交互動 API：好友動態牆、按讚與留言
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    ActivityCreate,
    ActivityResponse,
    LikeResponse,
    CommentCreate,
    CommentResponse,
)
from ..services import SocialService

router = APIRouter(prefix="/social", tags=["Social"])


# POST /social/activities - 發布動態
@router.post("/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    request: ActivityCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    發布社群動態

    將運動記錄、成就解鎖或挑戰完成分享到社群
    """
    service = SocialService(db)

    try:
        activity = await service.create_activity(
            user_id=current_user_id,
            activity_type=request.activity_type,
            reference_id=request.reference_id,
            content=request.content,
            image_url=request.image_url,
            caption=request.caption
        )
        return activity
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T257: GET /social/feed
@router.get("/feed")
async def get_feed(
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T257: 取得好友動態牆

    取得好友的運動記錄、成就與挑戰動態
    使用 Cursor-based Pagination，單次載入 20 筆
    效能目標: < 200ms
    """
    service = SocialService(db)

    result = await service.get_feed(
        user_id=current_user_id,
        cursor=cursor,
        limit=limit
    )

    # 將 Pydantic 模型轉換為 dict 以確保正確序列化 (包含 image_url, caption)
    return {
        "activities": [activity.model_dump(mode='json') for activity in result.get("activities", [])],
        "next_cursor": result.get("next_cursor"),
        "has_more": result.get("has_more", False)
    }


# GET /social/my-activities - 取得個人動態列表 (必須在 /activities/{activity_id} 之前定義)
@router.get("/my-activities")
async def get_my_activities(
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得個人發布的動態列表

    支援 Cursor-based Pagination
    """
    service = SocialService(db)

    result = await service.get_my_activities(
        user_id=current_user_id,
        cursor=cursor,
        limit=limit
    )

    return {
        "activities": [activity.model_dump(mode='json') for activity in result.get("activities", [])],
        "next_cursor": result.get("next_cursor"),
        "has_more": result.get("has_more", False)
    }


# T258: POST /activities/{activity_id}/like
@router.post("/activities/{activity_id}/like", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
async def like_activity(
    activity_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T258: 按讚動態

    對指定動態按讚，對方收到通知
    """
    service = SocialService(db)

    try:
        like = await service.like_activity(
            user_id=current_user_id,
            activity_id=activity_id
        )
        return like
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T259: DELETE /activities/{activity_id}/like
@router.delete("/activities/{activity_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_activity(
    activity_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T259: 取消按讚

    取消對指定動態的按讚
    """
    service = SocialService(db)

    await service.unlike_activity(
        user_id=current_user_id,
        activity_id=activity_id
    )


# T260: POST /activities/{activity_id}/comment
@router.post("/activities/{activity_id}/comment", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    activity_id: str,
    request: CommentCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T260: 留言鼓勵

    對好友動態留言（最多 200 字）
    頻率限制: 1 分鐘最多 10 則留言
    敏感詞彙自動過濾
    """
    service = SocialService(db)

    try:
        comment = await service.add_comment(
            user_id=current_user_id,
            activity_id=activity_id,
            content=request.content,
            parent_id=request.parent_id
        )
        return comment
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T261: GET /activities/{activity_id}/comments
@router.get("/activities/{activity_id}/comments")
async def get_comments(
    activity_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T261: 取得留言列表

    取得指定動態的所有留言
    """
    service = SocialService(db)

    comments, total_count = await service.get_comments(
        activity_id=activity_id,
        limit=limit,
        offset=offset
    )

    return {
        "comments": comments,
        "total_count": total_count
    }


# PUT /social/activities/{activity_id} - 更新動態
@router.put("/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    caption: Optional[str] = None,
    image_url: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    更新動態的 caption 或 image_url

    只能更新自己發布的動態
    """
    service = SocialService(db)

    try:
        activity = await service.update_activity(
            user_id=current_user_id,
            activity_id=activity_id,
            caption=caption,
            image_url=image_url
        )
        return activity
    except ValueError as e:
        if "not found" in str(e).lower() or "permission" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# DELETE /social/activities/{activity_id} - 刪除動態
@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    刪除動態

    只能刪除自己發布的動態
    會同時刪除相關的按讚和留言
    """
    service = SocialService(db)

    try:
        await service.delete_activity(
            user_id=current_user_id,
            activity_id=activity_id
        )
    except ValueError as e:
        if "not found" in str(e).lower() or "permission" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
