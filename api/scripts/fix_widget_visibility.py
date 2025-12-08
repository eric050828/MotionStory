"""Fix widget is_visible field"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings

async def fix_visibility():
    print("=" * 60)
    print("[FIX] Adding is_visible: True to all widgets")
    print("=" * 60)

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    try:
        dashboards = await db.dashboards.find({}).to_list(length=100)
        fixed_count = 0

        for dashboard in dashboards:
            widgets = dashboard.get("widgets", [])
            updated_widgets = []
            needs_update = False

            for widget in widgets:
                if "is_visible" not in widget:
                    widget["is_visible"] = True
                    needs_update = True
                updated_widgets.append(widget)

            if needs_update:
                await db.dashboards.update_one(
                    {"_id": dashboard["_id"]},
                    {"$set": {"widgets": updated_widgets}}
                )
                fixed_count += 1
                print(f"  [OK] Fixed dashboard: {dashboard.get('name', 'Unknown')}")

        print(f"\n[OK] Fixed {fixed_count} dashboards")
        print("=" * 60)

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_visibility())
