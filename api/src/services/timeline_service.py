"""
Timeline Service
時間軸與年度回顧處理
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from collections import defaultdict

from ..models import (
    MilestoneInDB,
    MilestoneResponse,
    AnnualReviewInDB,
    AnnualReviewResponse,
    MonthlyUsageStats,
    WorkoutTypeSummary,
    TrendAnalysis,
    MilestoneSummary,
)


class TimelineService:
    """時間軸服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.milestones_collection = db.milestones
        self.workouts_collection = db.workouts
        self.achievements_collection = db.achievements
        self.annual_reviews_collection = db.annual_reviews

    async def list_milestones(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        highlighted_only: bool = False
    ) -> List[MilestoneResponse]:
        """
        列出時間軸里程碑

        Args:
            user_id: 使用者 ID
            start_date: 開始日期
            end_date: 結束日期
            highlighted_only: 只顯示高亮項目

        Returns:
            List[MilestoneResponse]: 里程碑列表
        """
        query = {"user_id": ObjectId(user_id)}

        if highlighted_only:
            query["highlighted"] = True

        if start_date or end_date:
            query["achieved_at"] = {}
            if start_date:
                query["achieved_at"]["$gte"] = start_date
            if end_date:
                query["achieved_at"]["$lte"] = end_date

        milestones = await self.milestones_collection.find(query).sort(
            "achieved_at", -1
        ).to_list(length=None)

        # Convert ObjectIds to strings for response
        def convert_milestone(m):
            m["_id"] = str(m["_id"])
            m["user_id"] = str(m["user_id"])
            if m.get("workout_id"):
                m["workout_id"] = str(m["workout_id"])
            return m

        return [MilestoneResponse(**convert_milestone(m)) for m in milestones]

    async def create_milestone(
        self,
        user_id: str,
        milestone_type: str,
        title: str,
        description: str,
        metadata: Dict,
        highlighted: bool = False
    ) -> MilestoneInDB:
        """
        建立里程碑

        Args:
            user_id: 使用者 ID
            milestone_type: 里程碑類型
            title: 標題
            description: 描述
            metadata: 元數據
            highlighted: 是否高亮

        Returns:
            MilestoneInDB: 建立的里程碑
        """
        milestone = MilestoneInDB(
            user_id=ObjectId(user_id),
            milestone_type=milestone_type,
            title=title,
            description=description,
            metadata=metadata,
            highlighted=highlighted,
            achieved_at=datetime.now(timezone.utc)
        )

        result = await self.milestones_collection.insert_one(
            milestone.dict(by_alias=True)
        )

        milestone.id = result.inserted_id
        return milestone

    async def generate_annual_review(
        self, user_id: str, year: int
    ) -> AnnualReviewResponse:
        """
        生成年度回顧

        Args:
            user_id: 使用者 ID
            year: 年份

        Returns:
            AnnualReviewResponse: 年度回顧

        Performance: 應在 3 秒內完成 (FR-035)
        """
        # 檢查快取
        cached_review = await self.annual_reviews_collection.find_one({
            "user_id": ObjectId(user_id),
            "year": year,
            "cache_expires_at": {"$gte": datetime.now(timezone.utc)}
        })

        if cached_review:
            return AnnualReviewResponse(**cached_review)

        # 生成新的年度回顧
        start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
        end_date = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        # 取得該年度所有運動記錄
        workouts = await self.workouts_collection.find({
            "user_id": ObjectId(user_id),
            "start_time": {"$gte": start_date, "$lte": end_date},
            "is_deleted": False
        }).to_list(length=None)

        # 計算總體統計
        total_workouts = len(workouts)
        total_duration_minutes = sum(w.get("duration_minutes", 0) for w in workouts)
        total_distance_km = sum(w.get("distance_km", 0.0) for w in workouts)
        total_calories = sum(w.get("calories", 0) for w in workouts)

        # 計算月度統計
        monthly_stats_dict = defaultdict(lambda: {
            "workout_count": 0,
            "total_duration_minutes": 0,
            "total_distance_km": 0.0,
            "heart_rates": []
        })

        for workout in workouts:
            month = workout["start_time"].month
            monthly_stats_dict[month]["workout_count"] += 1
            monthly_stats_dict[month]["total_duration_minutes"] += workout.get("duration_minutes", 0)
            monthly_stats_dict[month]["total_distance_km"] += workout.get("distance_km", 0.0)
            if workout.get("avg_heart_rate"):
                monthly_stats_dict[month]["heart_rates"].append(workout["avg_heart_rate"])

        monthly_stats = [
            MonthlyUsageStats(
                month=month,
                workout_count=stats["workout_count"],
                total_duration_minutes=stats["total_duration_minutes"],
                total_distance_km=stats["total_distance_km"],
                avg_heart_rate=sum(stats["heart_rates"]) // len(stats["heart_rates"]) if stats["heart_rates"] else None
            )
            for month, stats in sorted(monthly_stats_dict.items())
        ]

        # 計算運動類型統計
        workout_type_dict = defaultdict(lambda: {
            "count": 0,
            "total_distance_km": 0.0,
            "total_duration_minutes": 0
        })

        for workout in workouts:
            workout_type = workout.get("workout_type", "unknown")
            workout_type_dict[workout_type]["count"] += 1
            workout_type_dict[workout_type]["total_distance_km"] += workout.get("distance_km", 0.0)
            workout_type_dict[workout_type]["total_duration_minutes"] += workout.get("duration_minutes", 0)

        workout_type_summary = [
            WorkoutTypeSummary(
                workout_type=workout_type,
                count=stats["count"],
                total_distance_km=stats["total_distance_km"],
                total_duration_minutes=stats["total_duration_minutes"]
            )
            for workout_type, stats in workout_type_dict.items()
        ]

        # 趨勢分析
        trends = await self._analyze_trends(monthly_stats)

        # 里程碑
        milestones = await self.milestones_collection.find({
            "user_id": ObjectId(user_id),
            "achieved_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(length=None)

        milestone_summaries = [
            MilestoneSummary(
                milestone_id=str(m["_id"]),
                milestone_type=m["milestone_type"],
                title=m["title"],
                achieved_at=m["achieved_at"]
            )
            for m in milestones
        ]

        # 個人紀錄
        personal_records = await self._calculate_personal_records(workouts)

        # 有運動記錄的月份
        usage_months = sorted(list(set(w["start_time"].month for w in workouts)))

        # 建立年度回顧
        annual_review = AnnualReviewInDB(
            user_id=ObjectId(user_id),
            year=year,
            usage_months=usage_months,
            total_workouts=total_workouts,
            total_duration_minutes=total_duration_minutes,
            total_distance_km=total_distance_km,
            total_calories=total_calories,
            monthly_stats=monthly_stats,
            workout_type_summary=workout_type_summary,
            trends=trends,
            milestones=milestone_summaries,
            personal_records=personal_records,
            cache_expires_at=datetime.now(timezone.utc) + timedelta(days=7)  # 快取 7 天
        )

        # 儲存至資料庫
        await self.annual_reviews_collection.delete_many({
            "user_id": ObjectId(user_id),
            "year": year
        })

        result = await self.annual_reviews_collection.insert_one(
            annual_review.dict(by_alias=True)
        )

        annual_review.id = result.inserted_id
        return AnnualReviewResponse(**annual_review.dict(by_alias=True))

    async def _analyze_trends(self, monthly_stats: List[MonthlyUsageStats]) -> List[TrendAnalysis]:
        """分析趨勢"""
        if len(monthly_stats) < 2:
            return []

        trends = []

        # 距離趨勢
        distances = [s.total_distance_km for s in monthly_stats]
        first_half_avg = sum(distances[:len(distances)//2]) / (len(distances)//2) if len(distances) > 1 else 0
        second_half_avg = sum(distances[len(distances)//2:]) / (len(distances) - len(distances)//2)

        if second_half_avg > first_half_avg * 1.1:
            change_pct = ((second_half_avg - first_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0
            trends.append(TrendAnalysis(
                metric="distance",
                trend="increasing",
                change_percentage=change_pct,
                insight=f"運動距離增加了 {change_pct:.1f}%"
            ))
        elif second_half_avg < first_half_avg * 0.9:
            change_pct = ((first_half_avg - second_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0
            trends.append(TrendAnalysis(
                metric="distance",
                trend="decreasing",
                change_percentage=-change_pct,
                insight=f"運動距離減少了 {change_pct:.1f}%"
            ))
        else:
            trends.append(TrendAnalysis(
                metric="distance",
                trend="stable",
                change_percentage=0.0,
                insight="運動距離保持穩定"
            ))

        return trends

    async def _calculate_personal_records(self, workouts: List[Dict]) -> Dict:
        """計算個人紀錄"""
        if not workouts:
            return {}

        records = {}

        # 最長距離
        max_distance = max((w.get("distance_km", 0.0) for w in workouts), default=0.0)
        if max_distance > 0:
            records["longest_distance_km"] = max_distance

        # 最長時間
        max_duration = max((w.get("duration_minutes", 0) for w in workouts), default=0)
        if max_duration > 0:
            records["longest_duration_minutes"] = max_duration

        # 最快配速
        paces = [w.get("pace_min_per_km", 0.0) for w in workouts if w.get("pace_min_per_km", 0.0) > 0]
        if paces:
            records["fastest_pace_min_per_km"] = min(paces)

        return records
