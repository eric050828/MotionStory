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
    ActivityResponse,
    LikeResponse,
    CommentCreate,
    CommentResponse,
)
from ..services import SocialService

router = APIRouter(prefix="/social", tags=["Social"])


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

    return result


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
