"""Check a specific dashboard by ID"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    # The dashboard ID from the frontend console log
    dashboard_id = "692bf54646c28714ec4ef6c4"

    print(f"Looking for dashboard with ID: {dashboard_id}")

    # Try to find it
    dashboard = await db.dashboards.find_one({"_id": ObjectId(dashboard_id)})

    if dashboard:
        print(f"\nFound dashboard:")
        print(f"  Name: {dashboard.get('name')}")
        print(f"  User ID: {dashboard.get('user_id')}")
        print(f"  Widgets ({len(dashboard.get('widgets', []))}):")
        for i, w in enumerate(dashboard.get('widgets', [])):
            print(f"    {i+1}. id={w.get('id')}, type={w.get('type')}, visible={w.get('visible')}")
    else:
        print(f"Dashboard not found!")

    # List all dashboard IDs
    print("\n\nAll dashboards in database:")
    all_dashboards = await db.dashboards.find({}).to_list(length=100)
    for d in all_dashboards:
        print(f"  ID: {d['_id']}, User: {d.get('user_id')}, Name: {d.get('name')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check())
