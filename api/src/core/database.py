"""
MongoDB Database Connection
使用 Motor (async MongoDB driver)
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from .config import settings


class MongoDB:
    """MongoDB 連線管理器"""

    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls):
        """建立資料庫連線"""
        if cls.client is None:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=10,
                minPoolSize=1,
                serverSelectionTimeoutMS=5000,
            )
            cls.database = cls.client[settings.DB_NAME]
            print(f" Connected to MongoDB: {settings.DB_NAME}")

            # Create indexes
            await cls.create_indexes()

    @classmethod
    async def disconnect(cls):
        """關閉資料庫連線"""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.database = None
            print(" Disconnected from MongoDB")

    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """取得資料庫實例"""
        if cls.database is None:
            raise RuntimeError("Database not initialized. Call connect() first.")
        return cls.database

    @classmethod
    async def create_indexes(cls):
        """建立所有 collections 的索引 (T054-T060)"""
        if cls.database is None:
            raise RuntimeError("Database not initialized. Call connect() first.")

        db = cls.database

        # T054: Users collection indexes
        await db.users.create_index("firebase_uid", unique=True, name="idx_firebase_uid")
        await db.users.create_index("email", unique=True, name="idx_email")

        # T055: Workouts collection indexes
        await db.workouts.create_index(
            [("user_id", 1), ("start_time", -1)],
            name="idx_user_start_time"
        )
        await db.workouts.create_index(
            [("user_id", 1), ("is_deleted", 1)],
            name="idx_user_deleted"
        )
        await db.workouts.create_index(
            [("user_id", 1), ("sync_status", 1)],
            name="idx_user_sync"
        )

        # T056: Achievements collection indexes
        await db.achievements.create_index(
            [("user_id", 1), ("achieved_at", -1)],
            name="idx_user_achieved"
        )
        await db.achievements.create_index(
            [("user_id", 1), ("achievement_type", 1)],
            unique=True,
            name="idx_user_achievement_type"
        )

        # T057: Dashboards collection indexes
        await db.dashboards.create_index(
            [("user_id", 1), ("order", 1)],
            name="idx_user_order"
        )
        await db.dashboards.create_index(
            [("user_id", 1), ("is_default", 1)],
            name="idx_user_default",
            partialFilterExpression={"is_default": True}
        )

        # T058: Milestones collection indexes
        await db.milestones.create_index(
            [("user_id", 1), ("milestone_date", -1)],
            name="idx_user_milestone_date"
        )

        # T059: Annual reviews collection indexes
        await db.annual_reviews.create_index(
            [("user_id", 1), ("year", 1)],
            unique=True,
            name="idx_user_year"
        )

        # T060: Share cards collection indexes
        await db.share_cards.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_user_created"
        )

        # Phase 3: Social Features Indexes

        # T227: Friendships collection indexes
        await db.friendships.create_index(
            [("user_id", 1), ("status", 1)],
            name="idx_user_status"
        )
        await db.friendships.create_index(
            [("friend_id", 1), ("status", 1)],
            name="idx_friend_status"
        )
        await db.friendships.create_index(
            [("user_id", 1), ("friend_id", 1)],
            unique=True,
            name="idx_user_friend_unique"
        )

        # T228: Activities collection indexes
        await db.activities.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_user_created_at"
        )
        await db.activities.create_index(
            [("created_at", -1)],
            name="idx_created_at"
        )
        await db.activities.create_index(
            [("activity_type", 1), ("reference_id", 1)],
            name="idx_type_reference"
        )

        # T229: Likes collection indexes
        await db.likes.create_index(
            [("activity_id", 1), ("user_id", 1)],
            unique=True,
            name="idx_activity_user_unique"
        )
        await db.likes.create_index(
            [("user_id", 1), ("liked_at", -1)],
            name="idx_user_liked_at"
        )

        # T230: Comments collection indexes
        await db.comments.create_index(
            [("activity_id", 1), ("created_at", -1)],
            name="idx_activity_created"
        )
        await db.comments.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_user_created"
        )
        await db.comments.create_index(
            [("parent_id", 1)],
            name="idx_parent_id",
            partialFilterExpression={"parent_id": {"$exists": True, "$type": "objectId"}}
        )

        # T231: Challenges collection indexes
        await db.challenges.create_index(
            [("creator_id", 1), ("status", 1)],
            name="idx_creator_status"
        )
        await db.challenges.create_index(
            [("status", 1), ("start_date", 1)],
            name="idx_status_start_date"
        )
        await db.challenges.create_index(
            [("privacy", 1), ("status", 1)],
            name="idx_privacy_status"
        )

        # T232: Participants collection indexes
        await db.participants.create_index(
            [("challenge_id", 1), ("user_id", 1)],
            unique=True,
            name="idx_challenge_user_unique"
        )
        await db.participants.create_index(
            [("user_id", 1), ("status", 1)],
            name="idx_user_status_participant"
        )
        await db.participants.create_index(
            [("challenge_id", 1), ("rank", 1)],
            name="idx_challenge_rank"
        )

        # T233: Notifications collection indexes
        await db.notifications.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_user_created_notif"
        )
        await db.notifications.create_index(
            [("user_id", 1), ("is_read", 1)],
            name="idx_user_is_read"
        )
        await db.notifications.create_index(
            [("created_at", 1)],
            name="idx_created_at_ttl",
            expireAfterSeconds=2592000  # 30 days TTL
        )

        # T234: Leaderboards collection indexes
        await db.leaderboards.create_index(
            [("period", 1), ("metric", 1), ("rank", 1)],
            name="idx_period_metric_rank"
        )
        await db.leaderboards.create_index(
            [("user_id", 1), ("period", 1), ("metric", 1)],
            name="idx_user_period_metric"
        )
        await db.leaderboards.create_index(
            [("period_end", 1)],
            name="idx_period_end"
        )

        # T235: BlockList collection indexes
        await db.blocklist.create_index(
            [("user_id", 1), ("blocked_user_id", 1)],
            unique=True,
            name="idx_user_blocked_unique"
        )
        await db.blocklist.create_index(
            [("blocked_user_id", 1)],
            name="idx_blocked_user_id"
        )

        print(" Database indexes created successfully (Phase 1-3)")


# Convenience function to get database
def get_db() -> AsyncIOMotorDatabase:
    """快速取得資料庫實例"""
    return MongoDB.get_database()


# Alias for backward compatibility
get_database = get_db
