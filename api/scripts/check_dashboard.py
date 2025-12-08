"""Check dashboard data"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings

async def check():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    dashboard = await db.dashboards.find_one({})
    if dashboard:
        print(f"Dashboard: {dashboard['name']}")
        print(f"Widgets ({len(dashboard['widgets'])}):")
        for i, w in enumerate(dashboard['widgets']):
            print(f"  {i+1}. {w}")
    else:
        print("No dashboard found")

    client.close()

if __name__ == "__main__":
    asyncio.run(check())
