"""Fix ALL dashboards - ensure all widgets have visible field"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings

async def fix_all():
    print("=" * 60)
    print("[FIX] Ensuring ALL widgets have visible: true")
    print("=" * 60)

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    try:
        dashboards = await db.dashboards.find({}).to_list(length=100)
        print(f"Found {len(dashboards)} dashboards")

        fixed_count = 0

        for dashboard in dashboards:
            dashboard_name = dashboard.get("name", "Unknown")
            user_id = dashboard.get("user_id", "Unknown")
            widgets = dashboard.get("widgets", [])
            updated_widgets = []
            needs_update = False

            for widget in widgets:
                # Check for is_visible (old field name) and rename to visible
                if "is_visible" in widget:
                    widget["visible"] = widget.pop("is_visible")
                    needs_update = True

                # Ensure visible exists and is True
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
                print(f"  [OK] Fixed dashboard: {dashboard_name} (user: {user_id})")
                for i, w in enumerate(updated_widgets):
                    print(f"       Widget {i}: {w.get('type')} -> visible={w.get('visible')}")
            else:
                print(f"  [--] Already OK: {dashboard_name} (user: {user_id})")

        print(f"\n[OK] Fixed {fixed_count} dashboards")
        print("=" * 60)

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_all())
