"""
Friends Router (T249-T256)
好友系統 API：搜尋、邀請、管理與封鎖
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Literal

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    FriendshipCreate,
    FriendshipResponse,
    FriendProfile,
    FriendRequest,
    UserSearchResult,
    BlockListCreate,
)
from ..services import FriendService

router = APIRouter(prefix="/friends", tags=["Friends"])


# T249: POST /friends/search
@router.post("/search")
async def search_friends(
    query_type: Literal["user_id", "email", "qrcode"],
    query: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T249: 搜尋好友

    透過使用者 ID、Email 或 QR Code 搜尋好友
    排除已封鎖使用者與已是好友的使用者
    """
    service = FriendService(db)

    try:
        results = await service.search_friends(
            user_id=current_user_id,
            query_type=query_type,
            query=query
        )
        return {"results": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T250: POST /friends/invite
@router.post("/invite", response_model=FriendshipResponse, status_code=status.HTTP_201_CREATED)
async def send_friend_invite(
    request: FriendshipCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T250: 發送好友邀請

    向指定使用者發送好友邀請
    - 好友上限: 200 人
    - 冷卻期: 被拒絕後 7 天內不可再次邀請同一使用者
    """
    service = FriendService(db)

    try:
        friendship = await service.send_friend_invite(
            user_id=current_user_id,
            friend_id=request.friend_id
        )
        return friendship
    except ValueError as e:
        if "limit" in str(e) or "cooldown" in str(e) or "7 days" in str(e):
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T251: GET /friends
@router.get("")
async def get_friends(
    status_filter: Literal["accepted", "pending", "rejected"] = Query("accepted", alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T251: 取得好友清單

    取得目前使用者的好友清單，支援狀態過濾與分頁
    """
    service = FriendService(db)

    friends, total_count = await service.get_friends(
        user_id=current_user_id,
        status=status_filter,
        limit=limit,
        offset=offset
    )

    return {
        "friends": friends,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }


# T252: POST /friends/{friendship_id}/accept
@router.post("/{friendship_id}/accept", response_model=FriendshipResponse)
async def accept_friend_request(
    friendship_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T252: 接受好友邀請

    接受指定的好友邀請
    """
    service = FriendService(db)

    try:
        friendship = await service.accept_friend_request(
            user_id=current_user_id,
            friendship_id=friendship_id
        )
        return friendship
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# T253: POST /friends/{friendship_id}/reject
@router.post("/{friendship_id}/reject", status_code=status.HTTP_200_OK)
async def reject_friend_request(
    friendship_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T253: 拒絕好友邀請

    拒絕指定的好友邀請
    """
    service = FriendService(db)

    try:
        await service.reject_friend_request(
            user_id=current_user_id,
            friendship_id=friendship_id
        )
        return {"message": "Friend request rejected"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# T254: DELETE /friends/{friendship_id}
@router.delete("/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friendship_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T254: 移除好友

    移除指定好友關係
    """
    service = FriendService(db)

    try:
        await service.remove_friend(
            user_id=current_user_id,
            friendship_id=friendship_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# T255: POST /friends/{user_id}/block
@router.post("/{user_id}/block", status_code=status.HTTP_200_OK)
async def block_user(
    user_id: str,
    reason: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T255: 封鎖使用者

    封鎖指定使用者
    封鎖後對方無法搜尋到你，且會自動移除好友關係
    """
    service = FriendService(db)

    try:
        await service.block_user(
            user_id=current_user_id,
            blocked_user_id=user_id,
            reason=reason
        )
        return {"message": "User blocked successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T256: GET /friends/requests
@router.get("/requests")
async def get_friend_requests(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T256: 取得待處理的好友邀請

    取得收到的待接受好友邀請清單
    """
    service = FriendService(db)

    requests = await service.get_friend_requests(user_id=current_user_id)

    return {"requests": requests}
