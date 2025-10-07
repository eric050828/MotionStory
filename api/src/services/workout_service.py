"""
Workout Service
運動記錄處理邏輯
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import csv
import io

from ..models import (
    WorkoutInDB,
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse,
    WorkoutStatsResponse,
    WorkoutBatchCreate,
)


class WorkoutService:
    """運動記錄服務"""

    SOFT_DELETE_RETENTION_DAYS = 30

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.workouts_collection = db.workouts

    async def create_workout(
        self, user_id: str, workout_data: WorkoutCreate
    ) -> WorkoutInDB:
        """
        建立運動記錄

        Args:
            user_id: 使用者 ID
            workout_data: 運動記錄資料

        Returns:
            WorkoutInDB: 建立的運動記錄
        """
        workout = WorkoutInDB(
            user_id=ObjectId(user_id),
            **workout_data.dict()
        )

        result = await self.workouts_collection.insert_one(
            workout.dict(by_alias=True)
        )

        workout.id = result.inserted_id
        return workout

    async def get_workout(self, workout_id: str, user_id: str) -> Optional[WorkoutInDB]:
        """
        取得單筆運動記錄

        Args:
            workout_id: 運動記錄 ID
            user_id: 使用者 ID (驗證權限)

        Returns:
            Optional[WorkoutInDB]: 運動記錄，不存在回傳 None
        """
        workout = await self.workouts_collection.find_one({
            "_id": ObjectId(workout_id),
            "user_id": ObjectId(user_id),
            "is_deleted": False
        })

        if not workout:
            return None

        return WorkoutInDB(**workout)

    async def list_workouts(
        self,
        user_id: str,
        limit: int = 20,
        cursor: Optional[str] = None,
        workout_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> tuple[List[WorkoutInDB], Optional[str]]:
        """
        列出使用者的運動記錄 (cursor-based pagination)

        Args:
            user_id: 使用者 ID
            limit: 每頁數量
            cursor: 分頁游標 (上一頁最後一筆的 ID)
            workout_type: 篩選運動類型
            start_date: 開始日期篩選
            end_date: 結束日期篩選

        Returns:
            tuple: (運動記錄列表, 下一頁游標)
        """
        query = {
            "user_id": ObjectId(user_id),
            "is_deleted": False
        }

        # 游標分頁
        if cursor:
            query["_id"] = {"$lt": ObjectId(cursor)}

        # 運動類型篩選
        if workout_type:
            query["workout_type"] = workout_type

        # 日期篩選
        if start_date or end_date:
            query["start_time"] = {}
            if start_date:
                query["start_time"]["$gte"] = start_date
            if end_date:
                query["start_time"]["$lte"] = end_date

        # 查詢
        workouts_cursor = self.workouts_collection.find(query).sort(
            "start_time", -1
        ).limit(limit + 1)

        workouts_list = await workouts_cursor.to_list(length=limit + 1)

        # 判斷是否有下一頁
        has_next = len(workouts_list) > limit
        if has_next:
            workouts_list = workouts_list[:limit]

        next_cursor = str(workouts_list[-1]["_id"]) if has_next and workouts_list else None

        workouts = [WorkoutInDB(**w) for w in workouts_list]
        return workouts, next_cursor

    async def update_workout(
        self, workout_id: str, user_id: str, workout_data: WorkoutUpdate
    ) -> Optional[WorkoutInDB]:
        """
        更新運動記錄

        Args:
            workout_id: 運動記錄 ID
            user_id: 使用者 ID
            workout_data: 更新資料

        Returns:
            Optional[WorkoutInDB]: 更新後的運動記錄
        """
        update_data = workout_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc)

        result = await self.workouts_collection.find_one_and_update(
            {
                "_id": ObjectId(workout_id),
                "user_id": ObjectId(user_id),
                "is_deleted": False
            },
            {"$set": update_data},
            return_document=True
        )

        if not result:
            return None

        return WorkoutInDB(**result)

    async def soft_delete_workout(self, workout_id: str, user_id: str) -> bool:
        """
        軟刪除運動記錄

        Args:
            workout_id: 運動記錄 ID
            user_id: 使用者 ID

        Returns:
            bool: 是否成功刪除
        """
        now = datetime.now(timezone.utc)
        delete_after = now + timedelta(days=self.SOFT_DELETE_RETENTION_DAYS)

        result = await self.workouts_collection.update_one(
            {
                "_id": ObjectId(workout_id),
                "user_id": ObjectId(user_id),
                "is_deleted": False
            },
            {
                "$set": {
                    "is_deleted": True,
                    "deleted_at": now,
                    "delete_after": delete_after
                }
            }
        )

        return result.modified_count > 0

    async def restore_workout(self, workout_id: str, user_id: str) -> Optional[WorkoutInDB]:
        """
        復原已刪除的運動記錄

        Args:
            workout_id: 運動記錄 ID
            user_id: 使用者 ID

        Returns:
            Optional[WorkoutInDB]: 復原的運動記錄，超過期限回傳 None
        """
        workout = await self.workouts_collection.find_one({
            "_id": ObjectId(workout_id),
            "user_id": ObjectId(user_id),
            "is_deleted": True
        })

        if not workout:
            return None

        # 檢查是否超過復原期限
        now = datetime.now(timezone.utc)
        delete_after = workout.get("delete_after")

        if delete_after and now > delete_after:
            return None

        # 復原
        result = await self.workouts_collection.find_one_and_update(
            {"_id": ObjectId(workout_id)},
            {
                "$set": {
                    "is_deleted": False
                },
                "$unset": {
                    "deleted_at": "",
                    "delete_after": ""
                }
            },
            return_document=True
        )

        return WorkoutInDB(**result)

    async def list_trash(self, user_id: str) -> List[Dict]:
        """
        列出垃圾桶中的運動記錄

        Args:
            user_id: 使用者 ID

        Returns:
            List[Dict]: 垃圾桶記錄，包含剩餘天數
        """
        now = datetime.now(timezone.utc)

        workouts = await self.workouts_collection.find({
            "user_id": ObjectId(user_id),
            "is_deleted": True,
            "delete_after": {"$gte": now}
        }).sort("deleted_at", -1).to_list(length=None)

        trash_items = []
        for workout in workouts:
            delete_after = workout.get("delete_after")
            days_remaining = (delete_after - now).days if delete_after else 0

            trash_items.append({
                "workout": WorkoutInDB(**workout),
                "days_remaining": days_remaining,
                "deleted_at": workout.get("deleted_at"),
                "delete_after": delete_after
            })

        return trash_items

    async def get_stats(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> WorkoutStatsResponse:
        """
        取得運動統計摘要

        Args:
            user_id: 使用者 ID
            start_date: 開始日期
            end_date: 結束日期

        Returns:
            WorkoutStatsResponse: 統計摘要
        """
        query = {
            "user_id": ObjectId(user_id),
            "is_deleted": False
        }

        if start_date or end_date:
            query["start_time"] = {}
            if start_date:
                query["start_time"]["$gte"] = start_date
            if end_date:
                query["start_time"]["$lte"] = end_date

        # 聚合統計
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": None,
                    "total_workouts": {"$sum": 1},
                    "total_duration_minutes": {"$sum": "$duration_minutes"},
                    "total_distance_km": {"$sum": "$distance_km"},
                    "total_calories": {"$sum": "$calories"},
                    "avg_heart_rate": {"$avg": "$avg_heart_rate"},
                }
            }
        ]

        result = await self.workouts_collection.aggregate(pipeline).to_list(length=1)

        if not result:
            return WorkoutStatsResponse(
                total_workouts=0,
                total_duration_minutes=0,
                total_distance_km=0.0,
                total_calories=0,
                avg_heart_rate=None,
                workout_types_count={}
            )

        stats = result[0]

        # 運動類型統計
        type_pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": "$workout_type",
                    "count": {"$sum": 1}
                }
            }
        ]

        type_result = await self.workouts_collection.aggregate(type_pipeline).to_list(length=None)
        workout_types_count = {item["_id"]: item["count"] for item in type_result}

        return WorkoutStatsResponse(
            total_workouts=stats.get("total_workouts", 0),
            total_duration_minutes=stats.get("total_duration_minutes", 0),
            total_distance_km=stats.get("total_distance_km", 0.0),
            total_calories=stats.get("total_calories", 0),
            avg_heart_rate=stats.get("avg_heart_rate"),
            workout_types_count=workout_types_count
        )

    async def export_to_csv(self, user_id: str) -> str:
        """
        匯出運動記錄為 CSV

        Args:
            user_id: 使用者 ID

        Returns:
            str: CSV 內容
        """
        workouts = await self.workouts_collection.find({
            "user_id": ObjectId(user_id),
            "is_deleted": False
        }).sort("start_time", -1).to_list(length=None)

        output = io.StringIO()
        writer = csv.writer(output)

        # CSV 標頭
        writer.writerow([
            "運動類型", "開始時間", "時長(分)", "距離(km)",
            "配速(min/km)", "平均心率", "卡路里", "備註"
        ])

        # CSV 資料
        for workout in workouts:
            writer.writerow([
                workout.get("workout_type", ""),
                workout.get("start_time", "").isoformat() if workout.get("start_time") else "",
                workout.get("duration_minutes", ""),
                workout.get("distance_km", ""),
                workout.get("pace_min_per_km", ""),
                workout.get("avg_heart_rate", ""),
                workout.get("calories", ""),
                workout.get("notes", "")
            ])

        return output.getvalue()

    async def batch_create_workouts(
        self, user_id: str, workouts_data: List[WorkoutCreate]
    ) -> tuple[List[WorkoutInDB], List[Dict]]:
        """
        批次建立運動記錄

        Args:
            user_id: 使用者 ID
            workouts_data: 運動記錄列表

        Returns:
            tuple: (成功建立的記錄, 失敗的記錄與錯誤訊息)
        """
        created_workouts = []
        failed_workouts = []

        for idx, workout_data in enumerate(workouts_data):
            try:
                workout = await self.create_workout(user_id, workout_data)
                created_workouts.append(workout)
            except Exception as e:
                failed_workouts.append({
                    "index": idx,
                    "data": workout_data.dict(),
                    "error": str(e)
                })

        return created_workouts, failed_workouts
