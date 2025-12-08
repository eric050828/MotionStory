"""Test API response for dashboard widgets"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings
from src.models import DashboardInDB, DashboardResponse, Widget

async def test():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    dashboard = await db.dashboards.find_one({})
    if dashboard:
        print("=== RAW MONGODB DATA ===")
        print(f"widgets[0]: {dashboard['widgets'][0]}")
        print()

        print("=== PYDANTIC MODEL (DashboardInDB) ===")
        dashboard_model = DashboardInDB(**dashboard)
        print(f"widgets[0]: {dashboard_model.widgets[0]}")
        print(f"widgets[0].visible: {dashboard_model.widgets[0].visible}")
        print()

        print("=== MODEL DUMP (JSON serialization) ===")
        widget_dump = dashboard_model.widgets[0].model_dump()
        print(f"widget_dump: {widget_dump}")
        print()

        print("=== DashboardResponse ===")
        response = DashboardResponse(
            id=str(dashboard_model.id),
            user_id=str(dashboard_model.user_id),
            name=dashboard_model.name,
            widgets=dashboard_model.widgets,
            is_default=dashboard_model.is_default,
            created_at=dashboard_model.created_at,
            updated_at=dashboard_model.updated_at,
            last_accessed_at=dashboard_model.last_accessed_at
        )
        print(f"response.widgets[0]: {response.widgets[0]}")
        print()

        print("=== FINAL JSON (what API returns) ===")
        response_json = response.model_dump()
        print(f"widgets[0]: {response_json['widgets'][0]}")

    client.close()

if __name__ == "__main__":
    asyncio.run(test())
