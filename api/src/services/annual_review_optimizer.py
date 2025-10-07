"""
Annual Review Performance Optimizer
Optimizes MongoDB aggregation and implements caching for yearly statistics
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.performance import cache_response, invalidate_cache, query_profiler
import logging

logger = logging.getLogger(__name__)


class AnnualReviewOptimizer:
    """Optimize annual review generation with caching and aggregation"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    @cache_response(ttl=86400, key_prefix="annual_review")  # Cache for 24 hours
    @query_profiler.profile("annual_review_stats")
    async def get_annual_stats(
        self,
        user_id: str,
        year: int
    ) -> Dict[str, Any]:
        """
        Get optimized annual statistics for a user

        Args:
            user_id: User ID
            year: Year to analyze

        Returns:
            Annual statistics dictionary
        """
        # Define year boundaries
        year_start = datetime(year, 1, 1)
        year_end = datetime(year + 1, 1, 1)

        # MongoDB aggregation pipeline - optimized for performance
        pipeline = [
            # Match year and user
            {
                "$match": {
                    "user_id": user_id,
                    "date": {
                        "$gte": year_start,
                        "$lt": year_end
                    }
                }
            },
            # Group by month for monthly breakdown
            {
                "$group": {
                    "_id": {
                        "month": {"$month": "$date"},
                        "type": "$type"
                    },
                    "count": {"$sum": 1},
                    "total_duration": {"$sum": "$duration"},
                    "total_distance": {"$sum": {"$ifNull": ["$distance", 0]}},
                    "avg_duration": {"$avg": "$duration"}
                }
            },
            # Sort by month
            {
                "$sort": {"_id.month": 1}
            }
        ]

        # Execute aggregation with hint for performance
        workouts_collection = self.db.workouts
        monthly_data = await workouts_collection.aggregate(
            pipeline,
            hint="user_id_1_date_-1"  # Use compound index
        ).to_list(length=None)

        # Calculate overall stats
        total_stats = await self._calculate_total_stats(
            user_id,
            year_start,
            year_end
        )

        # Get achievements for the year
        achievements = await self._get_year_achievements(
            user_id,
            year_start,
            year_end
        )

        # Get personal records
        personal_records = await self._get_personal_records(
            user_id,
            year_start,
            year_end
        )

        # Get streak information
        streak_info = await self._get_streak_info(
            user_id,
            year_start,
            year_end
        )

        return {
            "year": year,
            "user_id": user_id,
            "monthly_breakdown": self._format_monthly_data(monthly_data),
            "total_stats": total_stats,
            "achievements": achievements,
            "personal_records": personal_records,
            "streak_info": streak_info,
            "generated_at": datetime.utcnow().isoformat()
        }

    async def _calculate_total_stats(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate total statistics for the year"""
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "date": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$type",
                    "count": {"$sum": 1},
                    "total_duration": {"$sum": "$duration"},
                    "total_distance": {"$sum": {"$ifNull": ["$distance", 0]}},
                    "avg_duration": {"$avg": "$duration"},
                    "max_duration": {"$max": "$duration"},
                    "max_distance": {"$max": {"$ifNull": ["$distance", 0]}}
                }
            }
        ]

        results = await self.db.workouts.aggregate(
            pipeline,
            hint="user_id_1_date_-1"
        ).to_list(length=None)

        # Format results
        total_stats = {
            "total_workouts": 0,
            "total_duration_minutes": 0,
            "total_distance_km": 0,
            "by_type": {}
        }

        for result in results:
            workout_type = result["_id"]
            count = result["count"]
            total_duration = result["total_duration"]
            total_distance = result["total_distance"]

            total_stats["total_workouts"] += count
            total_stats["total_duration_minutes"] += total_duration
            total_stats["total_distance_km"] += total_distance

            total_stats["by_type"][workout_type] = {
                "count": count,
                "total_duration": total_duration,
                "total_distance": total_distance,
                "avg_duration": result["avg_duration"],
                "max_duration": result["max_duration"],
                "max_distance": result["max_distance"]
            }

        return total_stats

    async def _get_year_achievements(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get all achievements earned in the year"""
        achievements = await self.db.achievements.find(
            {
                "user_id": user_id,
                "earned_at": {"$gte": start_date, "$lt": end_date}
            },
            {
                "_id": 0,
                "achievement_id": 1,
                "title": 1,
                "description": 1,
                "category": 1,
                "earned_at": 1
            }
        ).sort("earned_at", -1).to_list(length=100)

        return achievements

    async def _get_personal_records(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get personal records set in the year"""
        records = {
            "longest_workout": None,
            "longest_distance": None,
            "longest_streak": None,
            "most_workouts_month": None
        }

        # Longest workout
        longest_workout = await self.db.workouts.find_one(
            {
                "user_id": user_id,
                "date": {"$gte": start_date, "$lt": end_date}
            },
            sort=[("duration", -1)],
            projection={"_id": 0, "type": 1, "duration": 1, "date": 1}
        )
        if longest_workout:
            records["longest_workout"] = longest_workout

        # Longest distance
        longest_distance = await self.db.workouts.find_one(
            {
                "user_id": user_id,
                "date": {"$gte": start_date, "$lt": end_date},
                "distance": {"$exists": True}
            },
            sort=[("distance", -1)],
            projection={"_id": 0, "type": 1, "distance": 1, "date": 1}
        )
        if longest_distance:
            records["longest_distance"] = longest_distance

        return records

    async def _get_streak_info(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate streak information for the year"""
        # Get all workout dates in the year
        workouts = await self.db.workouts.find(
            {
                "user_id": user_id,
                "date": {"$gte": start_date, "$lt": end_date}
            },
            projection={"date": 1}
        ).sort("date", 1).to_list(length=None)

        if not workouts:
            return {
                "longest_streak": 0,
                "current_streak": 0,
                "total_active_days": 0
            }

        # Calculate streaks
        workout_dates = sorted(set(
            w["date"].date() for w in workouts
        ))

        longest_streak = 0
        current_streak = 1
        total_active_days = len(workout_dates)

        for i in range(1, len(workout_dates)):
            days_diff = (workout_dates[i] - workout_dates[i-1]).days

            if days_diff == 1:
                current_streak += 1
                longest_streak = max(longest_streak, current_streak)
            else:
                current_streak = 1

        longest_streak = max(longest_streak, current_streak)

        # Check if streak continues to today
        today = datetime.utcnow().date()
        if workout_dates and (today - workout_dates[-1]).days > 1:
            current_streak = 0

        return {
            "longest_streak": longest_streak,
            "current_streak": current_streak,
            "total_active_days": total_active_days,
            "active_percentage": (total_active_days / 365) * 100
        }

    def _format_monthly_data(
        self,
        monthly_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Format monthly aggregation data"""
        formatted = []

        for data in monthly_data:
            formatted.append({
                "month": data["_id"]["month"],
                "type": data["_id"]["type"],
                "count": data["count"],
                "total_duration": data["total_duration"],
                "total_distance": data["total_distance"],
                "avg_duration": data["avg_duration"]
            })

        return formatted

    async def pregenerate_annual_review(
        self,
        user_id: str,
        year: Optional[int] = None
    ):
        """
        Pre-generate annual review for faster access
        Run as background job

        Args:
            user_id: User ID
            year: Year to generate (defaults to current year)
        """
        if year is None:
            year = datetime.utcnow().year

        logger.info(f"Pre-generating annual review for user {user_id}, year {year}")

        try:
            # Generate and cache
            stats = await self.get_annual_stats(user_id, year)
            logger.info(
                f"Successfully pre-generated annual review for "
                f"user {user_id}, year {year}"
            )
            return stats
        except Exception as e:
            logger.error(
                f"Failed to pre-generate annual review for "
                f"user {user_id}, year {year}: {e}"
            )
            raise

    async def invalidate_annual_review_cache(
        self,
        user_id: str,
        year: Optional[int] = None
    ):
        """
        Invalidate cached annual review
        Call when new workouts are added

        Args:
            user_id: User ID
            year: Year to invalidate (None = all years)
        """
        if year:
            pattern = f"annual_review:get_annual_stats:user:{user_id}:year:{year}:*"
        else:
            pattern = f"annual_review:get_annual_stats:user:{user_id}:*"

        invalidate_cache(pattern)
        logger.info(f"Invalidated annual review cache for user {user_id}")

    async def get_incremental_update(
        self,
        user_id: str,
        year: int,
        since: datetime
    ) -> Dict[str, Any]:
        """
        Get incremental updates since last cache
        More efficient than full regeneration

        Args:
            user_id: User ID
            year: Year
            since: Last update timestamp

        Returns:
            Incremental update data
        """
        year_start = datetime(year, 1, 1)
        year_end = datetime(year + 1, 1, 1)

        # Get only new workouts
        new_workouts = await self.db.workouts.count_documents({
            "user_id": user_id,
            "date": {"$gte": year_start, "$lt": year_end},
            "created_at": {"$gte": since}
        })

        # Get new achievements
        new_achievements = await self.db.achievements.count_documents({
            "user_id": user_id,
            "earned_at": {"$gte": year_start, "$lt": year_end},
            "created_at": {"$gte": since}
        })

        return {
            "new_workouts": new_workouts,
            "new_achievements": new_achievements,
            "should_regenerate": new_workouts > 10 or new_achievements > 0
        }


async def create_annual_review_indexes(db: AsyncIOMotorDatabase):
    """
    Create necessary indexes for optimal annual review performance
    Run during application startup
    """
    # Compound index for workouts: user_id + date (descending)
    await db.workouts.create_index(
        [("user_id", 1), ("date", -1)],
        name="user_id_1_date_-1"
    )

    # Index for achievements: user_id + earned_at (descending)
    await db.achievements.create_index(
        [("user_id", 1), ("earned_at", -1)],
        name="user_id_1_earned_at_-1"
    )

    # Index for workout type aggregations
    await db.workouts.create_index(
        [("user_id", 1), ("type", 1), ("date", -1)],
        name="user_id_1_type_1_date_-1"
    )

    logger.info("Created annual review indexes")


# Background job for pre-generation
async def schedule_annual_review_pregeneration(
    db: AsyncIOMotorDatabase,
    target_month: int = 12  # December
):
    """
    Schedule background job to pre-generate annual reviews
    Run in December for all active users

    Args:
        db: Database instance
        target_month: Month to start pre-generation (default: December)
    """
    current_date = datetime.utcnow()

    # Only run in target month
    if current_date.month != target_month:
        return

    # Get all active users from current year
    year = current_date.year
    year_start = datetime(year, 1, 1)

    active_users = await db.workouts.distinct(
        "user_id",
        {"date": {"$gte": year_start}}
    )

    logger.info(
        f"Starting annual review pre-generation for {len(active_users)} users"
    )

    optimizer = AnnualReviewOptimizer(db)

    for user_id in active_users:
        try:
            await optimizer.pregenerate_annual_review(user_id, year)
        except Exception as e:
            logger.error(
                f"Failed to pre-generate annual review for user {user_id}: {e}"
            )
            continue

    logger.info("Completed annual review pre-generation")
