"""
Leaderboard Router
好友排行榜 API
"""

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Literal

from ..core.database import get_database
from ..core.security import get_current_user_id
from ..models import LeaderboardResponse
from ..services import LeaderboardService

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def get_friend_leaderboard(
    period: Literal["weekly", "monthly", "quarterly", "yearly"] = Query("weekly"),
    metric: Literal["distance", "duration", "workouts", "calories"] = Query("distance"),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得好友排行榜

    取得好友排行榜
    - 4 種週期：每週、每月、每季、每年
    - 4 種指標：距離、時長、運動次數、卡路里
    """
    service = LeaderboardService(db)

    leaderboard = await service.get_friend_leaderboard(
        user_id=current_user_id,
        period=period,
        metric=metric
    )

    return leaderboard
