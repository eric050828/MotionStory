"""
Mock Data Seed Script
建立 5 個模擬使用者，每人 10+ 運動記錄與社群動態
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import settings
from src.core.security import hash_password

# 使用者資料
MOCK_USERS = [
    {"email": "alice@example.com", "display_name": "Alice Chen", "avatar_url": "https://i.pravatar.cc/150?u=alice"},
    {"email": "bob@example.com", "display_name": "Bob Wang", "avatar_url": "https://i.pravatar.cc/150?u=bob"},
    {"email": "charlie@example.com", "display_name": "Charlie Liu", "avatar_url": "https://i.pravatar.cc/150?u=charlie"},
    {"email": "diana@example.com", "display_name": "Diana Lee", "avatar_url": "https://i.pravatar.cc/150?u=diana"},
    {"email": "evan@example.com", "display_name": "Evan Wu", "avatar_url": "https://i.pravatar.cc/150?u=evan"},
]

PASSWORD = "Password123"  # 符合強度要求的密碼

WORKOUT_TYPES = ["running", "cycling", "swimming", "yoga", "gym", "hiking", "other"]

WORKOUT_NOTES = [
    "今天天氣很好，跑得很開心！",
    "突破個人最佳紀錄！",
    "和朋友一起運動，動力滿滿",
    "雖然很累但很有成就感",
    "慢跑放鬆心情",
    "早起晨跑，空氣清新",
    "挑戰新路線成功！",
    "今天狀態不錯",
    "堅持就是勝利",
    "運動完心情超好",
    "第一次嘗試這條路線",
    "配速穩定進步中",
]

COMMENT_TEXTS = [
    "太厲害了！👏",
    "繼續加油！",
    "我也要跟上你的腳步",
    "好羨慕你的毅力",
    "明天一起運動吧！",
    "你是我的榜樣！",
    "太強了吧！",
    "期待下次一起跑",
    "進步神速！",
    "堅持就是勝利 💪",
]


async def create_mock_users(db):
    """建立模擬使用者"""
    users = []
    password_hash = hash_password(PASSWORD)

    for user_data in MOCK_USERS:
        # 檢查是否已存在
        existing = await db.users.find_one({"email": user_data["email"]})
        if existing:
            print(f"  [SKIP] User {user_data['email']} already exists, skipping...")
            users.append(existing)
            continue

        user = {
            "_id": ObjectId(),
            "firebase_uid": f"mock_user_{user_data['email'].split('@')[0]}",
            "email": user_data["email"],
            "display_name": user_data["display_name"],
            "avatar_url": user_data["avatar_url"],
            "password_hash": password_hash,
            "privacy_settings": {
                "profile_visibility": "public",
                "activity_visibility": "friends",
                "allow_friend_requests": True,
                "show_in_leaderboard": True
            },
            "preferences": {
                "language": "zh-TW",
                "timezone": "Asia/Taipei",
                "units": {"distance": "km", "weight": "kg"},
                "notifications": {
                    "push_enabled": True,
                    "email_enabled": True,
                    "achievement_alerts": True,
                    "friend_activity_alerts": True,
                    "challenge_alerts": True
                }
            },
            "subscription": {
                "plan": "free",
                "status": "active"
            },
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 90)),
            "updated_at": datetime.now(timezone.utc),
            "last_login_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24)),
            "deletion_scheduled": False
        }

        await db.users.insert_one(user)
        users.append(user)
        print(f"  [OK] Created user: {user_data['display_name']} ({user_data['email']})")

    return users


async def create_mock_workouts(db, users):
    """為每個使用者建立 10-15 筆運動記錄"""
    all_workouts = []

    for user in users:
        num_workouts = random.randint(10, 15)
        print(f"  [+] Creating {num_workouts} workouts for {user['display_name']}...")

        for i in range(num_workouts):
            workout_type = random.choice(WORKOUT_TYPES)

            # 隨機時間（過去 30 天內）
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            start_time = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)

            # 根據運動類型設定合理數值
            duration = random.randint(20, 120)
            distance = None
            calories = random.randint(100, 800)
            avg_hr = random.randint(100, 160)
            max_hr = avg_hr + random.randint(10, 40)

            if workout_type in ["running", "cycling", "hiking"]:
                distance = round(random.uniform(2, 20), 2)
            elif workout_type == "swimming":
                distance = round(random.uniform(0.5, 3), 2)

            workout = {
                "_id": ObjectId(),
                "user_id": user["_id"],
                "workout_type": workout_type,
                "start_time": start_time,
                "duration_minutes": duration,
                "distance_km": distance,
                "calories": calories,
                "avg_heart_rate": avg_hr,
                "max_heart_rate": max_hr,
                "elevation_gain_m": random.randint(0, 500) if workout_type in ["running", "cycling", "hiking"] else None,
                "notes": random.choice(WORKOUT_NOTES) if random.random() > 0.3 else None,
                "created_at": start_time,
                "updated_at": start_time,
                "is_deleted": False,
                "synced_from_device": random.random() > 0.5,
            }

            await db.workouts.insert_one(workout)
            all_workouts.append(workout)

        print(f"    [OK] Created {num_workouts} workouts")

    return all_workouts


async def create_friendships(db, users):
    """建立好友關係（每個人至少有 2-3 個好友）"""
    print("  [+] Creating friendships...")

    friendships_created = 0
    for i, user in enumerate(users):
        # 每個使用者與其他 2-3 個使用者成為好友
        other_users = [u for j, u in enumerate(users) if j != i]
        friends_to_add = random.sample(other_users, min(3, len(other_users)))

        for friend in friends_to_add:
            # 檢查是否已有好友關係
            existing = await db.friendships.find_one({
                "$or": [
                    {"user_id": user["_id"], "friend_id": friend["_id"]},
                    {"user_id": friend["_id"], "friend_id": user["_id"]}
                ]
            })

            if not existing:
                friendship = {
                    "_id": ObjectId(),
                    "user_id": user["_id"],
                    "friend_id": friend["_id"],
                    "status": "accepted",
                    "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(7, 60)),
                    "updated_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 7)),
                }
                await db.friendships.insert_one(friendship)
                friendships_created += 1

    print(f"    [OK] Created {friendships_created} friendships")


async def create_activities_and_interactions(db, users, workouts):
    """建立社群動態（activities）與互動（讚、留言）"""
    print("  [+] Creating activities and interactions...")

    activities_created = 0
    likes_created = 0
    comments_created = 0

    # 為每個運動記錄建立動態
    for workout in workouts:
        user = next((u for u in users if u["_id"] == workout["user_id"]), None)
        if not user:
            continue

        # 建立動態
        activity = {
            "_id": ObjectId(),
            "user_id": workout["user_id"],
            "activity_type": "workout",
            "reference_id": workout["_id"],
            "content": {
                "workout_type": workout["workout_type"],
                "duration_minutes": workout["duration_minutes"],
                "distance_km": workout.get("distance_km"),
                "calories": workout.get("calories"),
                "notes": workout.get("notes"),
            },
            "likes_count": 0,
            "comments_count": 0,
            "created_at": workout["created_at"],
            "updated_at": workout["created_at"],
        }

        await db.activities.insert_one(activity)
        activities_created += 1

        # 隨機新增讚（來自其他使用者）
        other_users = [u for u in users if u["_id"] != workout["user_id"]]
        likers = random.sample(other_users, random.randint(0, len(other_users)))

        for liker in likers:
            if random.random() > 0.4:  # 60% 機率按讚
                like = {
                    "_id": ObjectId(),
                    "user_id": liker["_id"],
                    "activity_id": activity["_id"],
                    "created_at": workout["created_at"] + timedelta(minutes=random.randint(5, 1440)),
                }
                await db.likes.insert_one(like)
                likes_created += 1

                # 更新動態讚數
                await db.activities.update_one(
                    {"_id": activity["_id"]},
                    {"$inc": {"likes_count": 1}}
                )

        # 隨機新增留言
        commenters = random.sample(other_users, random.randint(0, min(2, len(other_users))))
        for commenter in commenters:
            if random.random() > 0.5:  # 50% 機率留言
                comment = {
                    "_id": ObjectId(),
                    "activity_id": activity["_id"],
                    "user_id": commenter["_id"],
                    "content": random.choice(COMMENT_TEXTS),
                    "parent_id": None,
                    "created_at": workout["created_at"] + timedelta(minutes=random.randint(10, 2880)),
                    "updated_at": workout["created_at"] + timedelta(minutes=random.randint(10, 2880)),
                    "is_deleted": False,
                }
                await db.comments.insert_one(comment)
                comments_created += 1

                # 更新動態留言數
                await db.activities.update_one(
                    {"_id": activity["_id"]},
                    {"$inc": {"comments_count": 1}}
                )

    print(f"    [OK] Created {activities_created} activities, {likes_created} likes, {comments_created} comments")


async def create_default_dashboards(db, users):
    """為每個使用者建立預設儀表板"""
    print("  [+] Creating default dashboards...")

    for user in users:
        existing = await db.dashboards.find_one({"user_id": user["_id"]})
        if existing:
            continue

        dashboard = {
            "_id": ObjectId(),
            "user_id": user["_id"],
            "name": "我的儀表板",
            "widgets": [
                {"widget_type": "streak_counter", "position": {"x": 0, "y": 0}, "size": {"width": 6, "height": 2}, "config": {}, "is_visible": True},
                {"widget_type": "weekly_stats", "position": {"x": 6, "y": 0}, "size": {"width": 6, "height": 2}, "config": {}, "is_visible": True},
                {"widget_type": "monthly_distance", "position": {"x": 0, "y": 2}, "size": {"width": 4, "height": 3}, "config": {}, "is_visible": True},
                {"widget_type": "achievement_showcase", "position": {"x": 4, "y": 2}, "size": {"width": 8, "height": 3}, "config": {}, "is_visible": True},
            ],
            "is_default": True,
            "created_at": user["created_at"],
            "updated_at": user["created_at"],
        }

        await db.dashboards.insert_one(dashboard)

    print(f"    [OK] Created dashboards for {len(users)} users")


async def main():
    print("=" * 60)
    print("[SEED] MotionStory Mock Data Seed Script")
    print("=" * 60)

    # 連接 MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    print(f"\n[DB] Connected to database: {settings.DB_NAME}")

    try:
        # 1. 建立使用者
        print("\n[1/5] Creating mock users...")
        users = await create_mock_users(db)

        # 2. 建立運動記錄
        print("\n[2/5] Creating mock workouts...")
        workouts = await create_mock_workouts(db, users)

        # 3. 建立好友關係
        print("\n[3/5] Creating friendships...")
        await create_friendships(db, users)

        # 4. 建立動態與互動
        print("\n[4/5] Creating activities and interactions...")
        await create_activities_and_interactions(db, users, workouts)

        # 5. 建立儀表板
        print("\n[5/5] Creating default dashboards...")
        await create_default_dashboards(db, users)

        print("\n" + "=" * 60)
        print("[OK] Mock data seed completed successfully!")
        print("=" * 60)
        print("\n[Summary]")
        print(f"   - Users created: {len(MOCK_USERS)}")
        print(f"   - Total workouts: {len(workouts)}")
        print(f"   - Password for all users: {PASSWORD}")
        print("\n[User accounts]")
        for user_data in MOCK_USERS:
            print(f"   - {user_data['email']}")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
