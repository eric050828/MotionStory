"""
Debug script to investigate why image_url is null in API response
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.core.config import settings

async def debug_feed():
    """Debug the feed query to see what's happening with image_url"""
    print(f"Connecting to: {settings.MONGODB_URI[:50]}...")

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    # 1. Check total activities with/without image_url
    total = await db.activities.count_documents({})
    with_image = await db.activities.count_documents({"image_url": {"$ne": None}})
    without_image = await db.activities.count_documents({"$or": [{"image_url": None}, {"image_url": {"$exists": False}}]})

    print(f"\n=== Activity Statistics ===")
    print(f"Total activities: {total}")
    print(f"With image_url: {with_image}")
    print(f"Without image_url: {without_image}")

    # 2. Sample an activity with image_url
    sample_with_image = await db.activities.find_one({"image_url": {"$ne": None}})
    if sample_with_image:
        print(f"\n=== Sample Activity WITH image_url ===")
        print(f"ID: {sample_with_image['_id']}")
        print(f"User ID: {sample_with_image['user_id']}")
        print(f"Activity Type: {sample_with_image.get('activity_type')}")
        print(f"image_url: {sample_with_image.get('image_url', 'KEY NOT FOUND')[:80]}...")
        print(f"Keys in document: {list(sample_with_image.keys())}")

    # 3. Sample an activity without image_url
    sample_without_image = await db.activities.find_one({"$or": [{"image_url": None}, {"image_url": {"$exists": False}}]})
    if sample_without_image:
        print(f"\n=== Sample Activity WITHOUT image_url ===")
        print(f"ID: {sample_without_image['_id']}")
        print(f"User ID: {sample_without_image['user_id']}")
        print(f"Activity Type: {sample_without_image.get('activity_type')}")
        print(f"Keys in document: {list(sample_without_image.keys())}")

    # 4. Get demo user and their friends
    demo_user = await db.users.find_one({"email": "demo@example.com"})
    if demo_user:
        print(f"\n=== Demo User ===")
        print(f"ID: {demo_user['_id']}")
        print(f"Name: {demo_user.get('display_name')}")

        # Get friend IDs
        friendships_cursor = db.friendships.find({
            "$or": [
                {"user_id": demo_user["_id"]},
                {"friend_id": demo_user["_id"]}
            ],
            "status": "accepted"
        })
        friendships = await friendships_cursor.to_list(length=100)

        friend_ids = [demo_user["_id"]]  # Include self
        for f in friendships:
            if f["user_id"] == demo_user["_id"]:
                friend_ids.append(f["friend_id"])
            else:
                friend_ids.append(f["user_id"])

        print(f"Number of friends (including self): {len(friend_ids)}")

        # 5. Simulate the feed query
        print(f"\n=== Simulating Feed Query ===")
        query = {"user_id": {"$in": friend_ids}}

        # Count activities from friends
        friend_activities_count = await db.activities.count_documents(query)
        print(f"Total activities from friends: {friend_activities_count}")

        # Check activities with image_url from friends
        query_with_image = {"user_id": {"$in": friend_ids}, "image_url": {"$ne": None}}
        friend_activities_with_image = await db.activities.count_documents(query_with_image)
        print(f"Activities with image_url from friends: {friend_activities_with_image}")

        # Get first 10 activities (same as API would)
        activities_cursor = db.activities.find(query).sort("created_at", -1).limit(10)
        activities = await activities_cursor.to_list(length=10)

        print(f"\n=== First 10 Feed Activities ===")
        for i, activity in enumerate(activities):
            user = await db.users.find_one({"_id": activity["user_id"]})
            user_name = user.get("display_name", "Unknown") if user else "Unknown"

            has_image = "image_url" in activity and activity["image_url"] is not None
            image_preview = activity.get("image_url", "")[:50] if has_image else "None"

            print(f"{i+1}. {user_name} - {activity.get('activity_type')}")
            print(f"   Keys: {list(activity.keys())}")
            print(f"   image_url present: {has_image}")
            print(f"   image_url value: {image_preview}...")
            print()

    client.close()

if __name__ == "__main__":
    asyncio.run(debug_feed())
