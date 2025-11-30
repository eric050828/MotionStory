"""
Fix user_id format in dashboards and activities
Convert ObjectId to string format for API compatibility
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import settings

async def fix_user_ids():
    print("=" * 60)
    print("[FIX] Converting user_id from ObjectId to string")
    print("=" * 60)

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    try:
        # Fix dashboards
        print("\n[1/4] Fixing dashboards...")
        dashboards = await db.dashboards.find({}).to_list(length=100)
        for dashboard in dashboards:
            user_id = dashboard.get("user_id")
            if isinstance(user_id, ObjectId):
                await db.dashboards.update_one(
                    {"_id": dashboard["_id"]},
                    {"$set": {"user_id": str(user_id)}}
                )
                print(f"  [OK] Dashboard {dashboard['_id']}: {user_id} -> {str(user_id)}")

        # Fix activities
        print("\n[2/4] Fixing activities...")
        activities = await db.activities.find({}).to_list(length=200)
        fixed_count = 0
        for activity in activities:
            user_id = activity.get("user_id")
            if isinstance(user_id, ObjectId):
                await db.activities.update_one(
                    {"_id": activity["_id"]},
                    {"$set": {"user_id": str(user_id)}}
                )
                fixed_count += 1
        print(f"  [OK] Fixed {fixed_count} activities")

        # Fix likes
        print("\n[3/4] Fixing likes...")
        likes = await db.likes.find({}).to_list(length=500)
        fixed_count = 0
        for like in likes:
            updates = {}
            if isinstance(like.get("user_id"), ObjectId):
                updates["user_id"] = str(like["user_id"])
            if isinstance(like.get("activity_id"), ObjectId):
                updates["activity_id"] = str(like["activity_id"])
            if updates:
                await db.likes.update_one({"_id": like["_id"]}, {"$set": updates})
                fixed_count += 1
        print(f"  [OK] Fixed {fixed_count} likes")

        # Fix comments
        print("\n[4/4] Fixing comments...")
        comments = await db.comments.find({}).to_list(length=500)
        fixed_count = 0
        for comment in comments:
            updates = {}
            if isinstance(comment.get("user_id"), ObjectId):
                updates["user_id"] = str(comment["user_id"])
            if isinstance(comment.get("activity_id"), ObjectId):
                updates["activity_id"] = str(comment["activity_id"])
            if updates:
                await db.comments.update_one({"_id": comment["_id"]}, {"$set": updates})
                fixed_count += 1
        print(f"  [OK] Fixed {fixed_count} comments")

        print("\n" + "=" * 60)
        print("[OK] All user_id fields converted to string!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_user_ids())
