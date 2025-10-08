"""
Dashboard Service
儀表板與 Widget 管理
"""

from datetime import datetime, timezone
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..models import (
    DashboardInDB,
    DashboardCreate,
    DashboardUpdate,
    DashboardResponse,
    Widget,
)


class DashboardService:
    """儀表板服務"""

    MAX_WIDGETS_PER_DASHBOARD = 20

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.dashboards_collection = db.dashboards

    async def create_dashboard(
        self, user_id: str, dashboard_data: DashboardCreate
    ) -> DashboardInDB:
        """
        建立儀表板

        Args:
            user_id: 使用者 ID
            dashboard_data: 儀表板資料

        Returns:
            DashboardInDB: 建立的儀表板

        Raises:
            ValueError: Widget 數量超過限制
        """
        # 驗證 Widget 數量
        if len(dashboard_data.widgets) > self.MAX_WIDGETS_PER_DASHBOARD:
            raise ValueError(
                f"Dashboard cannot have more than {self.MAX_WIDGETS_PER_DASHBOARD} widgets"
            )

        dashboard = DashboardInDB(
            user_id=ObjectId(user_id),
            **dashboard_data.dict()
        )

        result = await self.dashboards_collection.insert_one(
            dashboard.dict(by_alias=True)
        )

        dashboard.id = result.inserted_id
        return dashboard

    async def create_default_dashboard(self, user_id: str) -> DashboardInDB:
        """
        建立預設儀表板

        Args:
            user_id: 使用者 ID

        Returns:
            DashboardInDB: 預設儀表板
        """
        default_widgets = [
            Widget(
                type="streak_counter",
                position={"x": 0, "y": 0},
                size={"width": 6, "height": 2},
                config={}
            ),
            Widget(
                type="weekly_stats",
                position={"x": 6, "y": 0},
                size={"width": 6, "height": 2},
                config={}
            ),
            Widget(
                type="monthly_distance",
                position={"x": 0, "y": 2},
                size={"width": 4, "height": 3},
                config={}
            ),
            Widget(
                type="achievement_showcase",
                position={"x": 4, "y": 2},
                size={"width": 8, "height": 3},
                config={}
            ),
        ]

        dashboard_data = DashboardCreate(
            name="我的儀表板",
            is_default=True,
            widgets=default_widgets
        )

        return await self.create_dashboard(user_id, dashboard_data)

    async def get_dashboard(
        self, dashboard_id: str, user_id: str
    ) -> Optional[DashboardInDB]:
        """
        取得儀表板

        Args:
            dashboard_id: 儀表板 ID
            user_id: 使用者 ID

        Returns:
            Optional[DashboardInDB]: 儀表板
        """
        dashboard = await self.dashboards_collection.find_one({
            "_id": ObjectId(dashboard_id),
            "user_id": ObjectId(user_id)
        })

        if not dashboard:
            return None

        return DashboardInDB(**dashboard)

    async def list_dashboards(self, user_id: str) -> List[DashboardInDB]:
        """
        列出使用者的所有儀表板

        Args:
            user_id: 使用者 ID

        Returns:
            List[DashboardInDB]: 儀表板列表
        """
        dashboards = await self.dashboards_collection.find({
            "user_id": ObjectId(user_id)
        }).sort("created_at", -1).to_list(length=None)

        return [DashboardInDB(**d) for d in dashboards]

    async def get_default_dashboard(self, user_id: str) -> Optional[DashboardInDB]:
        """
        取得預設儀表板

        Args:
            user_id: 使用者 ID

        Returns:
            Optional[DashboardInDB]: 預設儀表板
        """
        dashboard = await self.dashboards_collection.find_one({
            "user_id": ObjectId(user_id),
            "is_default": True
        })

        if not dashboard:
            return None

        return DashboardInDB(**dashboard)

    async def update_dashboard(
        self, dashboard_id: str, user_id: str, dashboard_data: DashboardUpdate
    ) -> Optional[DashboardInDB]:
        """
        更新儀表板

        Args:
            dashboard_id: 儀表板 ID
            user_id: 使用者 ID
            dashboard_data: 更新資料

        Returns:
            Optional[DashboardInDB]: 更新後的儀表板

        Raises:
            ValueError: Widget 數量超過限制
        """
        update_data = dashboard_data.dict(exclude_unset=True)

        # 驗證 Widget 數量
        if "widgets" in update_data:
            if len(update_data["widgets"]) > self.MAX_WIDGETS_PER_DASHBOARD:
                raise ValueError(
                    f"Dashboard cannot have more than {self.MAX_WIDGETS_PER_DASHBOARD} widgets"
                )

        update_data["updated_at"] = datetime.now(timezone.utc)

        result = await self.dashboards_collection.find_one_and_update(
            {
                "_id": ObjectId(dashboard_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": update_data},
            return_document=True
        )

        if not result:
            return None

        return DashboardInDB(**result)

    async def delete_dashboard(self, dashboard_id: str, user_id: str) -> bool:
        """
        刪除儀表板

        Args:
            dashboard_id: 儀表板 ID
            user_id: 使用者 ID

        Returns:
            bool: 是否成功刪除

        Raises:
            ValueError: 嘗試刪除預設儀表板
        """
        # 檢查是否為預設儀表板
        dashboard = await self.dashboards_collection.find_one({
            "_id": ObjectId(dashboard_id),
            "user_id": ObjectId(user_id)
        })

        if not dashboard:
            return False

        if dashboard.get("is_default", False):
            raise ValueError("Cannot delete default dashboard")

        result = await self.dashboards_collection.delete_one({
            "_id": ObjectId(dashboard_id),
            "user_id": ObjectId(user_id)
        })

        return result.deleted_count > 0

    async def set_default_dashboard(
        self, dashboard_id: str, user_id: str
    ) -> Optional[DashboardInDB]:
        """
        設定為預設儀表板

        Args:
            dashboard_id: 儀表板 ID
            user_id: 使用者 ID

        Returns:
            Optional[DashboardInDB]: 更新後的儀表板
        """
        # 取消其他預設儀表板
        await self.dashboards_collection.update_many(
            {
                "user_id": ObjectId(user_id),
                "is_default": True
            },
            {"$set": {"is_default": False}}
        )

        # 設定為預設
        result = await self.dashboards_collection.find_one_and_update(
            {
                "_id": ObjectId(dashboard_id),
                "user_id": ObjectId(user_id)
            },
            {"$set": {"is_default": True, "updated_at": datetime.now(timezone.utc)}},
            return_document=True
        )

        if not result:
            return None

        return DashboardInDB(**result)
