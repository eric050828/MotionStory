"""
Fix dashboard widgets and user firebase_uid format
"""

import asyncio
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import settings

async def fix_dashboards():
    print("=" * 60)
    print("[FIX] Fixing dashboard widgets and firebase_uid")
    print("=" * 60)

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    try:
        # Fix firebase_uid in users
        print("\n[1/2] Fixing firebase_uid in users...")
        users = await db.users.find({}).to_list(length=100)
        for user in users:
            firebase_uid = user.get("firebase_uid", "")
            if firebase_uid.startswith("mock_") and not firebase_uid.startswith("mock_user_"):
                new_uid = firebase_uid.replace("mock_", "mock_user_")
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"firebase_uid": new_uid}}
                )
                print(f"  [OK] User {user['email']}: {firebase_uid} -> {new_uid}")

        # Fix dashboard widgets
        print("\n[2/2] Fixing dashboard widgets...")
        dashboards = await db.dashboards.find({}).to_list(length=100)
        for dashboard in dashboards:
            widgets = dashboard.get("widgets", [])
            fixed_widgets = []
            needs_update = False

            for widget in widgets:
                fixed_widget = dict(widget)

                # Fix widget_type -> type
                if "widget_type" in fixed_widget and "type" not in fixed_widget:
                    fixed_widget["type"] = fixed_widget.pop("widget_type")
                    needs_update = True

                # Add id if missing
                if "id" not in fixed_widget:
                    fixed_widget["id"] = str(uuid.uuid4())
                    needs_update = True

                fixed_widgets.append(fixed_widget)

            if needs_update:
                await db.dashboards.update_one(
                    {"_id": dashboard["_id"]},
                    {"$set": {"widgets": fixed_widgets}}
                )
                print(f"  [OK] Dashboard {dashboard['_id']}: Fixed {len(fixed_widgets)} widgets")

        print("\n" + "=" * 60)
        print("[OK] All fixes applied!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_dashboards())
