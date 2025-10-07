#!/usr/bin/env python3
"""
MongoDB Index Initialization Script

建立所有必要的資料庫索引，確保查詢效能最佳化。
應在部署後執行一次，或在資料模型變更後重新執行。

Usage:
    python scripts/init_indexes.py
"""

import asyncio
import os
import sys
from typing import List, Dict

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
from pymongo.errors import OperationFailure

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

from src.core.config import settings


class IndexInitializer:
    """MongoDB 索引初始化器"""

    def __init__(self):
        """初始化 MongoDB 連線"""
        self.client = AsyncIOMotorClient(settings.MONGODB_URI)
        self.db = self.client[settings.DB_NAME]

    async def close(self):
        """關閉 MongoDB 連線"""
        self.client.close()

    async def create_users_indexes(self) -> List[str]:
        """建立 users collection 索引"""
        collection = self.db.users

        indexes = [
            IndexModel(
                [("firebase_uid", ASCENDING)],
                unique=True,
                name="idx_firebase_uid"
            ),
            IndexModel(
                [("email", ASCENDING)],
                unique=True,
                name="idx_email"
            ),
        ]

        return await collection.create_indexes(indexes)

    async def create_workouts_indexes(self) -> List[str]:
        """建立 workouts collection 索引"""
        collection = self.db.workouts

        indexes = [
            # 複合索引: 使用者 + 開始時間 (時間軸查詢)
            IndexModel(
                [("user_id", ASCENDING), ("start_time", DESCENDING)],
                name="idx_user_time"
            ),
            # 複合索引: 使用者 + 軟刪除狀態
            IndexModel(
                [("user_id", ASCENDING), ("is_deleted", ASCENDING)],
                name="idx_user_deleted"
            ),
            # 部分索引: 同步狀態 (僅索引 pending 記錄)
            IndexModel(
                [("sync_status", ASCENDING)],
                name="idx_sync_status",
                partialFilterExpression={"sync_status": "pending"}
            ),
            # 部分索引: 軟刪除過期清理
            IndexModel(
                [("deleted_at", ASCENDING)],
                name="idx_deleted_at",
                partialFilterExpression={"is_deleted": True}
            ),
        ]

        return await collection.create_indexes(indexes)

    async def create_achievements_indexes(self) -> List[str]:
        """建立 achievements collection 索引"""
        collection = self.db.achievements

        indexes = [
            # 複合索引: 使用者 + 達成時間
            IndexModel(
                [("user_id", ASCENDING), ("achieved_at", DESCENDING)],
                name="idx_user_achieved"
            ),
            # 唯一索引: 使用者 + 成就類型 (避免重複達成)
            IndexModel(
                [("user_id", ASCENDING), ("achievement_type", ASCENDING)],
                unique=True,
                name="idx_user_achievement_type"
            ),
        ]

        return await collection.create_indexes(indexes)

    async def create_dashboards_indexes(self) -> List[str]:
        """建立 dashboards collection 索引"""
        collection = self.db.dashboards

        indexes = [
            # 複合索引: 使用者 + 排序
            IndexModel(
                [("user_id", ASCENDING), ("order", ASCENDING)],
                name="idx_user_order"
            ),
            # 部分索引: 預設儀表板
            IndexModel(
                [("user_id", ASCENDING), ("is_default", ASCENDING)],
                name="idx_user_default",
                partialFilterExpression={"is_default": True}
            ),
        ]

        return await collection.create_indexes(indexes)

    async def create_milestones_indexes(self) -> List[str]:
        """建立 milestones collection 索引"""
        collection = self.db.milestones

        indexes = [
            # 複合索引: 使用者 + 達成時間
            IndexModel(
                [("user_id", ASCENDING), ("achieved_at", DESCENDING)],
                name="idx_user_milestone_time"
            ),
            # 部分索引: 高亮里程碑
            IndexModel(
                [("user_id", ASCENDING), ("is_featured", ASCENDING)],
                name="idx_user_featured",
                partialFilterExpression={"is_featured": True}
            ),
        ]

        return await collection.create_indexes(indexes)

    async def create_annual_reviews_indexes(self) -> List[str]:
        """建立 annual_reviews collection 索引"""
        collection = self.db.annual_reviews

        indexes = [
            # 唯一索引: 使用者 + 年份
            IndexModel(
                [("user_id", ASCENDING), ("year", ASCENDING)],
                unique=True,
                name="idx_user_year"
            ),
            # 索引: 快取過期清理
            IndexModel(
                [("cache_expires_at", ASCENDING)],
                name="idx_cache_expiry"
            ),
        ]

        return await collection.create_indexes(indexes)

    async def create_share_cards_indexes(self) -> List[str]:
        """建立 share_cards collection 索引"""
        collection = self.db.share_cards

        indexes = [
            # 複合索引: 使用者 + 建立時間
            IndexModel(
                [("user_id", ASCENDING), ("created_at", DESCENDING)],
                name="idx_user_created"
            ),
            # 複合索引: 卡片類型 + 關聯 ID
            IndexModel(
                [("card_type", ASCENDING), ("related_id", ASCENDING)],
                name="idx_card_related"
            ),
        ]

        return await collection.create_indexes(indexes)

    async def get_existing_indexes(self, collection_name: str) -> Dict[str, dict]:
        """取得 collection 現有索引"""
        collection = self.db[collection_name]
        try:
            indexes = await collection.index_information()
            return indexes
        except OperationFailure:
            return {}

    async def initialize_all_indexes(self):
        """初始化所有 collections 的索引"""
        collections = [
            ("users", self.create_users_indexes),
            ("workouts", self.create_workouts_indexes),
            ("achievements", self.create_achievements_indexes),
            ("dashboards", self.create_dashboards_indexes),
            ("milestones", self.create_milestones_indexes),
            ("annual_reviews", self.create_annual_reviews_indexes),
            ("share_cards", self.create_share_cards_indexes),
        ]

        total_created = 0
        total_existing = 0

        print("=" * 60)
        print("MongoDB Index Initialization")
        print("=" * 60)
        print(f"Database: {settings.DB_NAME}")
        print(f"URI: {settings.MONGODB_URI[:30]}...")
        print("=" * 60)

        for collection_name, create_indexes_func in collections:
            print(f"\n[{collection_name}] Checking existing indexes...")

            existing_indexes = await self.get_existing_indexes(collection_name)
            print(f"  Found {len(existing_indexes)} existing indexes")

            print(f"[{collection_name}] Creating indexes...")
            try:
                created = await create_indexes_func()
                created_count = len(created)

                # _id_ is always present
                new_indexes_count = created_count - (len(existing_indexes) - 1)

                if new_indexes_count > 0:
                    print(f"  ✓ Created {new_indexes_count} new indexes")
                    total_created += new_indexes_count
                else:
                    print(f"  ✓ All indexes already exist")

                total_existing += len(existing_indexes) - 1

            except Exception as e:
                print(f"  ✗ Error: {str(e)}")
                continue

        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"Total existing indexes: {total_existing}")
        print(f"Total new indexes created: {total_created}")
        print(f"Total indexes: {total_existing + total_created}")
        print("=" * 60)

    async def drop_all_indexes(self):
        """刪除所有索引 (除了 _id_)"""
        collections = [
            "users",
            "workouts",
            "achievements",
            "dashboards",
            "milestones",
            "annual_reviews",
            "share_cards",
        ]

        print("=" * 60)
        print("Dropping All Indexes (except _id_)")
        print("=" * 60)

        for collection_name in collections:
            collection = self.db[collection_name]
            try:
                existing = await self.get_existing_indexes(collection_name)
                count = len(existing) - 1  # Exclude _id_

                if count > 0:
                    await collection.drop_indexes()
                    print(f"[{collection_name}] Dropped {count} indexes")
                else:
                    print(f"[{collection_name}] No indexes to drop")

            except Exception as e:
                print(f"[{collection_name}] Error: {str(e)}")

        print("=" * 60)

    async def verify_indexes(self):
        """驗證所有索引是否正確建立"""
        collections = [
            ("users", 2),
            ("workouts", 4),
            ("achievements", 2),
            ("dashboards", 2),
            ("milestones", 2),
            ("annual_reviews", 2),
            ("share_cards", 2),
        ]

        print("\n" + "=" * 60)
        print("Index Verification")
        print("=" * 60)

        all_valid = True

        for collection_name, expected_count in collections:
            existing = await self.get_existing_indexes(collection_name)
            actual_count = len(existing) - 1  # Exclude _id_

            status = "✓" if actual_count == expected_count else "✗"
            print(f"{status} [{collection_name}] Expected: {expected_count}, Actual: {actual_count}")

            if actual_count != expected_count:
                all_valid = False

        print("=" * 60)

        if all_valid:
            print("✓ All indexes verified successfully")
        else:
            print("✗ Some indexes are missing or incorrect")
            sys.exit(1)


async def main():
    """主函式"""
    initializer = IndexInitializer()

    try:
        # 初始化所有索引
        await initializer.initialize_all_indexes()

        # 驗證索引
        await initializer.verify_indexes()

    except Exception as e:
        print(f"\n✗ Fatal error: {str(e)}")
        sys.exit(1)

    finally:
        await initializer.close()


if __name__ == "__main__":
    asyncio.run(main())
