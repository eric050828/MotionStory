"""Fix widget field name: is_visible -> visible"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings

async def fix_field_name():
    print("=" * 60)
    print("[FIX] Renaming widget field: is_visible -> visible")
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
                # Rename is_visible to visible
                if "is_visible" in widget:
                    widget["visible"] = widget.pop("is_visible")
                    needs_update = True
                # Ensure visible exists
                if "visible" not in widget:
                    widget["visible"] = True
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
    asyncio.run(fix_field_name())
