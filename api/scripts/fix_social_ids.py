"""
Fix activities, likes, comments user_id format
Convert string back to ObjectId for social service compatibility
(Dashboard should remain as string, but social collections need ObjectId)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import settings

async def fix_social_ids():
    print("=" * 60)
    print("[FIX] Converting social collection IDs back to ObjectId")
    print("=" * 60)

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    try:
        # Fix activities - convert user_id from string to ObjectId
        print("\n[1/3] Fixing activities...")
        activities = await db.activities.find({}).to_list(length=500)
        fixed_count = 0
        for activity in activities:
            updates = {}
            user_id = activity.get("user_id")
            reference_id = activity.get("reference_id")

            # Convert string user_id to ObjectId
            if isinstance(user_id, str) and ObjectId.is_valid(user_id):
                updates["user_id"] = ObjectId(user_id)

            # Convert string reference_id to ObjectId
            if isinstance(reference_id, str) and ObjectId.is_valid(reference_id):
                updates["reference_id"] = ObjectId(reference_id)

            if updates:
                await db.activities.update_one(
                    {"_id": activity["_id"]},
                    {"$set": updates}
                )
                fixed_count += 1
        print(f"  [OK] Fixed {fixed_count} activities")

        # Fix likes - convert user_id and activity_id
        print("\n[2/3] Fixing likes...")
        likes = await db.likes.find({}).to_list(length=1000)
        fixed_count = 0
        for like in likes:
            updates = {}
            user_id = like.get("user_id")
            activity_id = like.get("activity_id")

            if isinstance(user_id, str) and ObjectId.is_valid(user_id):
                updates["user_id"] = ObjectId(user_id)
            if isinstance(activity_id, str) and ObjectId.is_valid(activity_id):
                updates["activity_id"] = ObjectId(activity_id)

            if updates:
                await db.likes.update_one({"_id": like["_id"]}, {"$set": updates})
                fixed_count += 1
        print(f"  [OK] Fixed {fixed_count} likes")

        # Fix comments - convert user_id and activity_id
        print("\n[3/3] Fixing comments...")
        comments = await db.comments.find({}).to_list(length=1000)
        fixed_count = 0
        for comment in comments:
            updates = {}
            user_id = comment.get("user_id")
            activity_id = comment.get("activity_id")

            if isinstance(user_id, str) and ObjectId.is_valid(user_id):
                updates["user_id"] = ObjectId(user_id)
            if isinstance(activity_id, str) and ObjectId.is_valid(activity_id):
                updates["activity_id"] = ObjectId(activity_id)

            if updates:
                await db.comments.update_one({"_id": comment["_id"]}, {"$set": updates})
                fixed_count += 1
        print(f"  [OK] Fixed {fixed_count} comments")

        print("\n" + "=" * 60)
        print("[OK] Social collection IDs fixed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_social_ids())
