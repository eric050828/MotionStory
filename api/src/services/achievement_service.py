"""
Achievement Service
成就檢測與觸發邏輯
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..models import (
    AchievementBase,
    AchievementInDB,
    AchievementResponse,
    WorkoutInDB,
)


class AchievementService:
    """成就檢測服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.achievements_collection = db.achievements
        self.workouts_collection = db.workouts

    async def check_achievements(
        self, user_id: str, workout: WorkoutInDB
    ) -> List[AchievementResponse]:
        """
        檢查並觸發成就

        Args:
            user_id: 使用者 ID
            workout: 剛建立的運動記錄

        Returns:
            List[AchievementResponse]: 觸發的成就列表
        """
        triggered_achievements = []

        # 檢查首次運動成就
        first_workout = await self._check_first_workout(user_id)
        if first_workout:
            triggered_achievements.append(first_workout)

        # 檢查連續天數成就
        streak_achievements = await self._check_streak_achievements(user_id, workout)
        triggered_achievements.extend(streak_achievements)

        # 檢查距離里程碑成就
        distance_achievements = await self._check_distance_achievements(
            user_id, workout
        )
        triggered_achievements.extend(distance_achievements)

        # 檢查個人紀錄成就
        pr_achievements = await self._check_personal_records(user_id, workout)
        triggered_achievements.extend(pr_achievements)

        return triggered_achievements

    async def _check_first_workout(self, user_id: str) -> Optional[AchievementResponse]:
        """檢查首次運動成就"""
        # 檢查是否已有 first_workout 成就
        existing = await self.achievements_collection.find_one({
            "user_id": ObjectId(user_id),
            "achievement_type": "first_workout"
        })

        if existing:
            return None

        # 觸發首次運動成就
        achievement = AchievementInDB(
            user_id=ObjectId(user_id),
            achievement_type="first_workout",
            celebration_level="basic",
            metadata={
                "title": "開始運動之旅",
                "description": "完成第一次運動記錄！"
            },
            achieved_at=datetime.now(timezone.utc)
        )

        result = await self.achievements_collection.insert_one(
            achievement.dict(by_alias=True)
        )

        achievement.id = result.inserted_id
        return AchievementResponse(**achievement.dict(by_alias=True))

    async def _check_streak_achievements(
        self, user_id: str, current_workout: WorkoutInDB
    ) -> List[AchievementResponse]:
        """檢查連續天數成就"""
        achievements = []

        # 計算連續天數
        streak_days = await self._calculate_streak_days(user_id, current_workout)

        # 檢查 3, 7, 30, 100 天連續成就
        streak_milestones = [
            (3, "streak_3", "基礎連續"),
            (7, "streak_7", "一週連續"),
            (30, "streak_30", "一個月連續"),
            (100, "streak_100", "百日連續"),
        ]

        for days, achievement_type, title in streak_milestones:
            if streak_days >= days:
                # 檢查是否已達成
                existing = await self.achievements_collection.find_one({
                    "user_id": ObjectId(user_id),
                    "achievement_type": achievement_type
                })

                if not existing:
                    celebration_level = "basic" if days <= 7 else "fireworks" if days <= 30 else "epic"

                    achievement = AchievementInDB(
                        user_id=ObjectId(user_id),
                        achievement_type=achievement_type,
                        celebration_level=celebration_level,
                        metadata={
                            "title": title,
                            "description": f"連續運動 {days} 天！",
                            "streak_days": streak_days
                        },
                        achieved_at=datetime.now(timezone.utc)
                    )

                    result = await self.achievements_collection.insert_one(
                        achievement.dict(by_alias=True)
                    )

                    achievement.id = result.inserted_id
                    achievements.append(AchievementResponse(**achievement.dict(by_alias=True)))

        return achievements

    async def _calculate_streak_days(
        self, user_id: str, current_workout: WorkoutInDB
    ) -> int:
        """計算連續天數"""
        # 取得使用者所有運動記錄，按日期排序
        workouts = await self.workouts_collection.find({
            "user_id": ObjectId(user_id),
            "is_deleted": False
        }).sort("start_time", -1).to_list(length=None)

        if not workouts:
            return 1

        # 計算連續天數（忽略同一天內的多筆運動）
        workout_dates = set()
        for workout in workouts:
            workout_date = workout["start_time"].date()
            workout_dates.add(workout_date)

        sorted_dates = sorted(workout_dates, reverse=True)

        # 從最新日期開始計算連續天數
        streak = 1
        for i in range(len(sorted_dates) - 1):
            current_date = sorted_dates[i]
            previous_date = sorted_dates[i + 1]

            # 檢查是否連續（允許間隔 1 天）
            if (current_date - previous_date).days == 1:
                streak += 1
            else:
                break

        return streak

    async def _check_distance_achievements(
        self, user_id: str, workout: WorkoutInDB
    ) -> List[AchievementResponse]:
        """檢查距離里程碑成就"""
        achievements = []

        if not workout.distance_km:
            return achievements

        distance_milestones = [
            (5.0, "distance_5k", "首次 5K", "fireworks"),
            (10.0, "distance_10k", "首次 10K", "fireworks"),
            (21.1, "distance_half_marathon", "首次半馬", "epic"),
            (42.2, "distance_marathon", "首次全馬", "epic"),
        ]

        for distance, achievement_type, title, celebration_level in distance_milestones:
            if workout.distance_km >= distance:
                # 檢查是否已達成
                existing = await self.achievements_collection.find_one({
                    "user_id": ObjectId(user_id),
                    "achievement_type": achievement_type
                })

                if not existing:
                    achievement = AchievementInDB(
                        user_id=ObjectId(user_id),
                        achievement_type=achievement_type,
                        celebration_level=celebration_level,
                        metadata={
                            "title": title,
                            "description": f"完成 {distance} 公里！",
                            "distance_km": workout.distance_km
                        },
                        achieved_at=datetime.now(timezone.utc)
                    )

                    result = await self.achievements_collection.insert_one(
                        achievement.dict(by_alias=True)
                    )

                    achievement.id = result.inserted_id
                    achievements.append(AchievementResponse(**achievement.dict(by_alias=True)))

        return achievements

    async def _check_personal_records(
        self, user_id: str, workout: WorkoutInDB
    ) -> List[AchievementResponse]:
        """檢查個人紀錄成就"""
        achievements = []

        # 檢查距離紀錄
        if workout.distance_km:
            max_distance_workout = await self.workouts_collection.find_one({
                "user_id": ObjectId(user_id),
                "workout_type": workout.workout_type,
                "is_deleted": False,
                "_id": {"$ne": workout.id}
            }, sort=[("distance_km", -1)])

            if max_distance_workout:
                previous_record = max_distance_workout.get("distance_km", 0)

                if workout.distance_km > previous_record:
                    achievement = AchievementInDB(
                        user_id=ObjectId(user_id),
                        achievement_type="personal_record_distance",
                        celebration_level="fireworks",
                        metadata={
                            "title": "距離新紀錄",
                            "description": f"打破個人 {workout.workout_type} 距離紀錄！",
                            "previous_record": previous_record,
                            "new_record": workout.distance_km,
                            "workout_type": workout.workout_type
                        },
                        achieved_at=datetime.now(timezone.utc)
                    )

                    result = await self.achievements_collection.insert_one(
                        achievement.dict(by_alias=True)
                    )

                    achievement.id = result.inserted_id
                    achievements.append(AchievementResponse(**achievement.dict(by_alias=True)))

        return achievements

    async def get_achievement_types(self) -> List[Dict]:
        """取得所有成就類型列表"""
        achievement_types = [
            {
                "type": "first_workout",
                "title": "開始運動之旅",
                "description": "完成第一次運動記錄",
                "celebration_level": "basic"
            },
            {
                "type": "streak_3",
                "title": "基礎連續",
                "description": "連續運動 3 天",
                "celebration_level": "basic"
            },
            {
                "type": "streak_7",
                "title": "一週連續",
                "description": "連續運動 7 天",
                "celebration_level": "basic"
            },
            {
                "type": "streak_30",
                "title": "一個月連續",
                "description": "連續運動 30 天",
                "celebration_level": "fireworks"
            },
            {
                "type": "streak_100",
                "title": "百日連續",
                "description": "連續運動 100 天",
                "celebration_level": "epic"
            },
            {
                "type": "distance_5k",
                "title": "首次 5K",
                "description": "完成 5 公里運動",
                "celebration_level": "fireworks"
            },
            {
                "type": "distance_10k",
                "title": "首次 10K",
                "description": "完成 10 公里運動",
                "celebration_level": "fireworks"
            },
            {
                "type": "distance_half_marathon",
                "title": "首次半馬",
                "description": "完成 21.1 公里運動",
                "celebration_level": "epic"
            },
            {
                "type": "distance_marathon",
                "title": "首次全馬",
                "description": "完成 42.2 公里運動",
                "celebration_level": "epic"
            },
            {
                "type": "personal_record_distance",
                "title": "距離新紀錄",
                "description": "打破個人距離紀錄",
                "celebration_level": "fireworks"
            },
        ]

        return achievement_types
