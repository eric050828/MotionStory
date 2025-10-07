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
            print(f"✅ Connected to MongoDB: {settings.DB_NAME}")

            # Create indexes
            await cls.create_indexes()

    @classmethod
    async def disconnect(cls):
        """關閉資料庫連線"""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.database = None
            print("❌ Disconnected from MongoDB")

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

        print("✅ Database indexes created successfully")


# Convenience function to get database
def get_db() -> AsyncIOMotorDatabase:
    """快速取得資料庫實例"""
    return MongoDB.get_database()
