"""
Leaderboard Service (T247)
好友排行榜服務：排行榜計算與展示
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..models import (
    LeaderboardResponse,
    LeaderboardEntry,
)


class LeaderboardService:
    """排行榜服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.leaderboards = db.leaderboards
        self.users = db.users
        self.workouts = db.workouts
        self.friendships = db.friendships

    async def get_friend_leaderboard(
        self,
        user_id: str,
        period: str = "weekly",
        metric: str = "distance"
    ) -> LeaderboardResponse:
        """
        T247: 好友排行榜計算

        取得好友排行榜
        - 4 種週期：每週、每月、每季、每年
        - 4 種指標：距離、時長、運動次數、卡路里

        Args:
            user_id: 使用者 ID
            period: 排行榜週期 (weekly, monthly, quarterly, yearly)
            metric: 排名指標 (distance, duration, workouts, calories)

        Returns:
            LeaderboardResponse: 排行榜回應
        """
        # 計算週期範圍
        period_start, period_end = self._get_period_range(period)

        # 取得好友 ID 列表 (包含自己)
        friend_ids = await self._get_friend_ids(user_id)
        friend_ids.append(ObjectId(user_id))

        # 計算每個使用者的指標數值
        leaderboard_data = []

        for friend_id in friend_ids:
            user = await self.users.find_one({"_id": friend_id})
            if not user:
                continue

            # 計算指標數值
            metric_value, workout_count = await self._calculate_metric(
                str(friend_id),
                metric,
                period_start,
                period_end
            )

            leaderboard_data.append({
                "user_id": str(friend_id),
                "display_name": user.get("display_name", ""),
                "avatar_url": user.get("avatar_url"),
                "metric_value": metric_value,
                "workout_count": workout_count
            })

        # 按指標數值排序
        leaderboard_data.sort(key=lambda x: x["metric_value"], reverse=True)

        # 計算排名並組裝回應
        entries = []
        my_rank = None

        for rank, data in enumerate(leaderboard_data, start=1):
            entries.append(LeaderboardEntry(
                rank=rank,
                user_id=data["user_id"],
                display_name=data["display_name"],
                avatar_url=data["avatar_url"],
                metric_value=data["metric_value"],
                workout_count=data["workout_count"]
            ))

            if data["user_id"] == user_id:
                my_rank = rank

        return LeaderboardResponse(
            period=period,
            metric=metric,
            period_start=period_start,
            period_end=period_end,
            entries=entries,
            my_rank=my_rank,
            total_participants=len(entries)
        )

    async def update_leaderboard_cache(
        self,
        period: str = "weekly",
        metric: str = "distance"
    ):
        """
        更新排行榜快取（由定時任務觸發）

        Args:
            period: 排行榜週期
            metric: 排名指標
        """
        # 計算週期範圍
        period_start, period_end = self._get_period_range(period)

        # 刪除舊的快取資料
        await self.leaderboards.delete_many({
            "period": period,
            "metric": metric,
            "period_start": period_start
        })

        # 計算所有使用者的指標數值
        all_users_cursor = self.users.find({
            "deleted_at": None
        })

        all_users = await all_users_cursor.to_list(length=10000)

        leaderboard_data = []

        for user in all_users:
            metric_value, workout_count = await self._calculate_metric(
                str(user["_id"]),
                metric,
                period_start,
                period_end
            )

            if metric_value > 0:
                leaderboard_data.append({
                    "user_id": user["_id"],
                    "metric_value": metric_value,
                    "workout_count": workout_count
                })

        # 按指標數值排序
        leaderboard_data.sort(key=lambda x: x["metric_value"], reverse=True)

        # 批次寫入快取
        now = datetime.now(timezone.utc)
        docs = []

        for rank, data in enumerate(leaderboard_data, start=1):
            docs.append({
                "user_id": data["user_id"],
                "period": period,
                "metric": metric,
                "period_start": period_start,
                "period_end": period_end,
                "rank": rank,
                "metric_value": data["metric_value"],
                "workout_count": data["workout_count"],
                "last_updated": now
            })

        if docs:
            await self.leaderboards.insert_many(docs)

    # Helper methods

    async def _get_friend_ids(self, user_id: str) -> List[ObjectId]:
        """取得好友 ID 列表"""
        friendships_cursor = self.friendships.find({
            "$or": [
                {"user_id": ObjectId(user_id)},
                {"friend_id": ObjectId(user_id)}
            ],
            "status": "accepted"
        })

        friendships = await friendships_cursor.to_list(length=1000)
        friend_ids = []

        for friendship in friendships:
            if str(friendship["user_id"]) == user_id:
                friend_ids.append(friendship["friend_id"])
            else:
                friend_ids.append(friendship["user_id"])

        return friend_ids

    async def _calculate_metric(
        self,
        user_id: str,
        metric: str,
        period_start: datetime,
        period_end: datetime
    ) -> tuple[float, int]:
        """
        計算指標數值

        Args:
            user_id: 使用者 ID
            metric: 指標類型
            period_start: 週期開始
            period_end: 週期結束

        Returns:
            tuple: (指標數值, 運動次數)
        """
        query = {
            "user_id": ObjectId(user_id),
            "start_time": {
                "$gte": period_start,
                "$lte": period_end
            },
            "is_deleted": False
        }

        # 計算運動次數
        workout_count = await self.workouts.count_documents(query)

        if metric == "workouts":
            return workout_count, workout_count

        # 計算聚合指標
        metric_field_map = {
            "distance": "$distance_km",
            "duration": "$duration_minutes",
            "calories": "$calories"
        }

        field = metric_field_map.get(metric, "$distance_km")

        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "total": {"$sum": field}}}
        ]

        result = await self.workouts.aggregate(pipeline).to_list(1)
        metric_value = result[0]["total"] if result else 0

        return metric_value or 0, workout_count

    def _get_period_range(self, period: str) -> tuple[datetime, datetime]:
        """
        計算週期範圍

        Args:
            period: 週期類型

        Returns:
            tuple: (開始時間, 結束時間)
        """
        now = datetime.now(timezone.utc)

        if period == "weekly":
            # 本週一 00:00 到本週日 23:59
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        elif period == "monthly":
            # 本月第一天到最後一天
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end = now.replace(year=now.year + 1, month=1, day=1) - timedelta(seconds=1)
            else:
                end = now.replace(month=now.month + 1, day=1) - timedelta(seconds=1)

        elif period == "quarterly":
            # 本季第一天到最後一天
            quarter = (now.month - 1) // 3
            start_month = quarter * 3 + 1
            start = now.replace(month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_month = start_month + 2
            if end_month > 12:
                end = now.replace(year=now.year + 1, month=1, day=1) - timedelta(seconds=1)
            else:
                end = now.replace(month=end_month + 1, day=1) - timedelta(seconds=1)

        elif period == "yearly":
            # 本年第一天到最後一天
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now.replace(year=now.year + 1, month=1, day=1) - timedelta(seconds=1)

        else:
            # 預設為每週
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        return start, end
