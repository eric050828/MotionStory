"""
Challenges Router (T262-T268)
挑戰賽系統 API：創建、管理、參與與排名
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Literal

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeListItem,
    ChallengeDetail,
    ParticipantResponse,
)
from ..services import ChallengeService

router = APIRouter(prefix="/challenges", tags=["Challenges"])


# T262: POST /challenges
@router.post("", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
async def create_challenge(
    request: ChallengeCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T262: 創建運動挑戰賽

    創建新的運動挑戰賽
    - 挑戰類型: 總距離、總時長、連續天數、特定運動類型
    - 時間限制: 最短 3 天、最長 90 天
    - 參與人數: 最多 20 人
    """
    service = ChallengeService(db)

    try:
        challenge = await service.create_challenge(
            user_id=current_user_id,
            challenge_data=request
        )
        return challenge
    except ValueError as e:
        if "rate limit" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T263: GET /challenges
@router.get("")
async def get_challenges(
    status_filter: Literal["active", "completed", "upcoming"] = Query("active", alias="status"),
    role: Literal["creator", "participant", "all"] = Query("all"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T263: 取得挑戰賽清單

    取得使用者創建或參與的挑戰賽清單
    """
    service = ChallengeService(db)

    challenges, total_count = await service.get_challenges(
        user_id=current_user_id,
        status=status_filter,
        role=role,
        limit=limit,
        offset=offset
    )

    return {
        "challenges": challenges,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }


# T264: GET /challenges/{challenge_id}
@router.get("/{challenge_id}", response_model=ChallengeDetail)
async def get_challenge_detail(
    challenge_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T264: 取得挑戰賽詳情

    取得指定挑戰賽的完整資訊與參與者排名
    """
    service = ChallengeService(db)

    try:
        challenge = await service.get_challenge_detail(
            challenge_id=challenge_id,
            user_id=current_user_id
        )
        return challenge
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# T265: DELETE /challenges/{challenge_id}
@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_challenge(
    challenge_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T265: 刪除挑戰賽

    刪除指定挑戰賽（僅創建者可操作，挑戰開始後無法刪除）
    """
    service = ChallengeService(db)

    try:
        await service.delete_challenge(
            user_id=current_user_id,
            challenge_id=challenge_id
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        if "Only creator" in str(e) or "cannot delete" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T266: POST /challenges/{challenge_id}/join
@router.post("/{challenge_id}/join", response_model=ParticipantResponse)
async def join_challenge(
    challenge_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T266: 加入挑戰賽

    加入指定挑戰賽
    - 僅公開挑戰或被邀請的使用者可加入
    - 挑戰開始後無法加入
    - 參與人數上限 20 人
    """
    service = ChallengeService(db)

    try:
        participant = await service.join_challenge(
            user_id=current_user_id,
            challenge_id=challenge_id
        )
        return participant
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        if "private" in str(e).lower() or "not friends" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# T267: POST /challenges/{challenge_id}/leave
@router.post("/{challenge_id}/leave", status_code=status.HTTP_200_OK)
async def leave_challenge(
    challenge_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T267: 退出挑戰賽

    退出指定挑戰賽
    - 退出後無法重新加入
    - 不影響其他參與者
    """
    service = ChallengeService(db)

    try:
        await service.leave_challenge(
            user_id=current_user_id,
            challenge_id=challenge_id
        )
        return {"message": "Left challenge successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# T268: GET /challenges/{challenge_id}/leaderboard
@router.get("/{challenge_id}/leaderboard")
async def get_challenge_leaderboard(
    challenge_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    T268: 取得挑戰賽排行榜

    取得挑戰賽即時排名
    - 每日批次更新（凌晨 2:00）
    - 依挑戰目標排序參與者
    """
    service = ChallengeService(db)

    try:
        leaderboard = await service.get_leaderboard(challenge_id=challenge_id)
        return leaderboard
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
