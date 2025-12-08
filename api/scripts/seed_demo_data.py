"""
Demo Data Seed Script for Shareholder Presentation
建立完整的擬真資料，展示 APP 所有功能

包含：
- 6 個使用者（1 個明星用戶 + 5 個一般用戶）
- 擬真的運動記錄（漸進式進步、每日習慣）
- 成就解鎖（26 種類型）
- 里程碑事件（Timeline 顯示）
- 豐富的社群互動（讚、留言）
- 精美圖片（Pexels API）
"""

import asyncio
import random
import httpx
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.config import settings
from src.core.security import hash_password

# ============================================
# Pexels API 配置
# ============================================
PEXELS_API_KEY = "0mxXFZt3OOEH4W1iXmy6HX9bVhZVWzvJMsvrZ9kBgn6dKPkhtFevc3SX"
PEXELS_API_URL = "https://api.pexels.com/v1/search"

# 運動類型對應的 Pexels 搜索關鍵字
WORKOUT_SEARCH_TERMS = {
    "running": ["running outdoor", "jogging park", "runner sunset", "marathon runner", "trail running"],
    "cycling": ["cycling road", "bike ride nature", "mountain biking", "cyclist sunset", "road cycling"],
    "swimming": ["swimming pool", "ocean swimming", "swimmer underwater", "swimming outdoor"],
    "yoga": ["yoga outdoor", "yoga sunset", "yoga meditation", "yoga beach", "yoga nature"],
    "gym": ["gym workout", "fitness training", "weight lifting", "gym exercise"],
    "hiking": ["hiking mountain", "hiking trail", "nature hiking", "mountain view hiking"],
}

# 圖片快取（避免重複 API 呼叫）
IMAGE_CACHE = {}

# ============================================
# 使用者資料（包含一個明星用戶 demo@example.com）
# ============================================
DEMO_USERS = [
    {
        "email": "demo@example.com",
        "display_name": "運動達人小明",
        "avatar_url": "https://i.pravatar.cc/150?u=demo",
        "is_star_user": True  # 主要示範帳號
    },
    {
        "email": "alice@example.com",
        "display_name": "Alice Chen",
        "avatar_url": "https://i.pravatar.cc/150?u=alice",
        "is_star_user": False
    },
    {
        "email": "bob@example.com",
        "display_name": "Bob Wang",
        "avatar_url": "https://i.pravatar.cc/150?u=bob",
        "is_star_user": False
    },
    {
        "email": "charlie@example.com",
        "display_name": "Charlie Liu",
        "avatar_url": "https://i.pravatar.cc/150?u=charlie",
        "is_star_user": False
    },
    {
        "email": "diana@example.com",
        "display_name": "Diana Lee",
        "avatar_url": "https://i.pravatar.cc/150?u=diana",
        "is_star_user": False
    },
    {
        "email": "evan@example.com",
        "display_name": "Evan Wu",
        "avatar_url": "https://i.pravatar.cc/150?u=evan",
        "is_star_user": False
    },
]

PASSWORD = "Demo1234"  # 示範用密碼

# ============================================
# 成就類型定義（對應 AchievementsScreen）
# ============================================
ACHIEVEMENT_TYPES = {
    # 基礎成就
    "first_workout": {"celebration_level": "fireworks", "metadata": {"workout_type": "running"}},

    # 連續天數成就
    "streak_3": {"celebration_level": "basic", "metadata": {"days": 3}},
    "streak_7": {"celebration_level": "fireworks", "metadata": {"days": 7}},
    "streak_30": {"celebration_level": "epic", "metadata": {"days": 30}},
    "streak_60": {"celebration_level": "epic", "metadata": {"days": 60}},
    "streak_90": {"celebration_level": "epic", "metadata": {"days": 90}},
    "streak_100": {"celebration_level": "epic", "metadata": {"days": 100}},
    "streak_180": {"celebration_level": "epic", "metadata": {"days": 180}},
    "streak_365": {"celebration_level": "epic", "metadata": {"days": 365}},

    # 單次距離成就
    "distance_5k": {"celebration_level": "basic", "metadata": {"distance_km": 5}},
    "distance_10k": {"celebration_level": "fireworks", "metadata": {"distance_km": 10}},
    "distance_half_marathon": {"celebration_level": "epic", "metadata": {"distance_km": 21.0975}},
    "distance_marathon": {"celebration_level": "epic", "metadata": {"distance_km": 42.195}},

    # 累計距離成就
    "total_100km": {"celebration_level": "basic", "metadata": {"total_km": 100}},
    "total_500km": {"celebration_level": "fireworks", "metadata": {"total_km": 500}},
    "total_1000km": {"celebration_level": "epic", "metadata": {"total_km": 1000}},
    "total_5000km": {"celebration_level": "epic", "metadata": {"total_km": 5000}},

    # 累計時間成就
    "total_50hours": {"celebration_level": "basic", "metadata": {"total_hours": 50}},
    "total_100hours": {"celebration_level": "fireworks", "metadata": {"total_hours": 100}},
    "total_500hours": {"celebration_level": "epic", "metadata": {"total_hours": 500}},
    "total_1000hours": {"celebration_level": "epic", "metadata": {"total_hours": 1000}},

    # 社交成就
    "likes_10": {"celebration_level": "basic", "metadata": {"likes": 10}},
    "likes_50": {"celebration_level": "fireworks", "metadata": {"likes": 50}},
    "likes_100": {"celebration_level": "epic", "metadata": {"likes": 100}},
    "likes_500": {"celebration_level": "epic", "metadata": {"likes": 500}},

    # 紀錄成就
    "personal_record_distance": {"celebration_level": "fireworks", "metadata": {"record_type": "distance"}},
}

# ============================================
# 里程碑類型
# ============================================
MILESTONE_TYPES = {
    "first_workout": {"title": "第一次運動", "description": "開啟健康生活的第一步！"},
    "first_5k": {"title": "首次 5K", "description": "成功完成 5 公里跑步！"},
    "first_10k": {"title": "首次 10K", "description": "突破 10 公里大關！"},
    "first_half_marathon": {"title": "首次半馬", "description": "完成人生第一個半程馬拉松！"},
    "first_marathon": {"title": "首次全馬", "description": "42.195 公里的榮耀時刻！"},
    "streak_milestone": {"title": "連續運動", "description": "持續運動的好習慣！"},
    "distance_milestone": {"title": "累計里程", "description": "一步一腳印，累積出成就！"},
}

# ============================================
# 運動心得短文模板（依運動類型分類）
# ============================================
WORKOUT_CAPTIONS = {
    "running": [
        "清晨的第一縷陽光，和我的腳步一起醒來 🌅",
        "跑過城市的街角，遇見不一樣的風景",
        "雙腳踏過的每一步，都是對自己的承諾 💪",
        "今天的汗水，是明天的勳章",
        "不是跑得多快，而是堅持跑下去",
        "風吹過耳邊，這就是自由的感覺",
        "一個人的馬拉松，全世界的風景",
        "跑步教會我最重要的事：永不放棄",
        "每一次呼吸，都讓我更靠近目標",
        "跑向夕陽，追逐夢想 🌇",
    ],
    "cycling": [
        "踩著單車，感受風的溫度 🚴",
        "兩個輪子，無限可能",
        "今天的路有點陡，但風景很美",
        "騎行的意義，在路上",
        "速度不重要，重要的是出發",
        "穿越城市與郊野，發現新世界",
        "騎車讓我學會享受過程",
        "翻過這座山，就是全新的自己",
    ],
    "swimming": [
        "在水中找到平靜 🏊",
        "每一次划水，都是與自己的對話",
        "游泳是最好的冥想",
        "藍色的世界，純淨的心",
        "浮力承載著所有煩惱，讓它們漂走",
        "水花是最美的畫作",
    ],
    "yoga": [
        "呼吸、伸展、感恩這一刻 🧘",
        "瑜伽不只是運動，是生活態度",
        "找到身心的平衡點",
        "每一個體式，都是新的開始",
        "柔軟的身體，堅定的心",
        "晨間瑜伽，開啟美好一天",
        "在喧囂中找到寧靜",
    ],
    "gym": [
        "揮灑汗水，雕塑更好的自己 💪",
        "沒有捷徑，只有堅持",
        "今天的痠痛，是進步的證明",
        "舉起的不只是重量，是決心",
        "健身房是我的充電站",
        "每一下都算數",
    ],
    "hiking": [
        "爬上山頂，世界在腳下 🏔️",
        "大自然是最好的健身房",
        "走進森林，找回自己",
        "每座山頂都值得慶祝",
        "步道上的每個腳印都有故事",
        "山不在高，有心則靈",
        "登高望遠，心曠神怡",
    ],
}

COMMENT_TEXTS = [
    "太厲害了！👏",
    "繼續加油！💪",
    "我也要跟上你的腳步",
    "好羨慕你的毅力",
    "明天一起運動吧！",
    "你是我的榜樣！⭐",
    "太強了吧！",
    "期待下次一起跑",
    "進步神速！🚀",
    "堅持就是勝利 💪",
    "好厲害，向你學習",
    "每天都在進步！",
    "配速好穩定啊",
    "這個距離太猛了",
    "照片好美！😍",
    "風景太讚了！",
    "看起來好棒！",
    "這條路線在哪裡？想去！",
]


async def fetch_pexels_images(workout_type: str, count: int = 10) -> list:
    """從 Pexels API 獲取高品質圖片"""
    cache_key = f"{workout_type}_{count}"
    if cache_key in IMAGE_CACHE:
        return IMAGE_CACHE[cache_key]

    search_terms = WORKOUT_SEARCH_TERMS.get(workout_type, ["fitness workout"])
    query = random.choice(search_terms)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                PEXELS_API_URL,
                headers={"Authorization": PEXELS_API_KEY},
                params={
                    "query": query,
                    "per_page": count,
                    "orientation": "landscape",
                    "size": "large",
                },
                timeout=10.0
            )

            if response.status_code == 200:
                data = response.json()
                photos = data.get("photos", [])
                # 使用 large2x 或 large 尺寸
                urls = [
                    photo["src"].get("large2x") or photo["src"].get("large")
                    for photo in photos
                ]
                IMAGE_CACHE[cache_key] = urls
                return urls
    except Exception as e:
        print(f"    [WARN] Pexels API error for {workout_type}: {e}")

    return []


async def clear_demo_data(db):
    """清除現有示範資料"""
    print("  [!] Clearing existing demo data...")

    # 取得所有 demo 使用者 ID
    demo_emails = [u["email"] for u in DEMO_USERS]
    demo_users = await db.users.find({"email": {"$in": demo_emails}}).to_list(None)
    demo_user_ids = [u["_id"] for u in demo_users]

    if demo_user_ids:
        # 刪除相關資料
        await db.workouts.delete_many({"user_id": {"$in": demo_user_ids}})
        await db.achievements.delete_many({"user_id": {"$in": demo_user_ids}})
        await db.milestones.delete_many({"user_id": {"$in": demo_user_ids}})
        await db.activities.delete_many({"user_id": {"$in": demo_user_ids}})
        await db.likes.delete_many({"user_id": {"$in": demo_user_ids}})
        await db.comments.delete_many({"user_id": {"$in": demo_user_ids}})
        await db.friendships.delete_many({
            "$or": [
                {"user_id": {"$in": demo_user_ids}},
                {"friend_id": {"$in": demo_user_ids}}
            ]
        })
        # Dashboard stores user_id as string, so convert for query
        demo_user_id_strings = [str(uid) for uid in demo_user_ids]
        await db.dashboards.delete_many({"user_id": {"$in": demo_user_id_strings}})
        await db.users.delete_many({"_id": {"$in": demo_user_ids}})

    print(f"    [OK] Cleared data for {len(demo_user_ids)} users")


async def create_demo_users(db):
    """建立示範使用者"""
    users = []
    password_hash = hash_password(PASSWORD)

    for user_data in DEMO_USERS:
        user = {
            "_id": ObjectId(),
            "firebase_uid": f"demo_user_{user_data['email'].split('@')[0]}",
            "email": user_data["email"],
            "display_name": user_data["display_name"],
            "avatar_url": user_data["avatar_url"],
            "password_hash": password_hash,
            "privacy_settings": {
                "profile_visibility": "public",
                "activity_visibility": "public",  # Demo 帳號設為公開
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
                "plan": "premium" if user_data.get("is_star_user") else "free",
                "status": "active"
            },
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(60, 180)),
            "updated_at": datetime.now(timezone.utc),
            "last_login_at": datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 12)),
            "deletion_scheduled": False,
            "_is_star_user": user_data.get("is_star_user", False)  # 內部標記
        }

        await db.users.insert_one(user)
        users.append(user)
        print(f"  [OK] Created user: {user_data['display_name']} ({user_data['email']})")

    return users


async def create_realistic_workouts(db, users):
    """為每個使用者建立擬真的運動記錄"""
    all_workouts = []

    for user in users:
        is_star = user.get("_is_star_user", False)

        # 明星用戶有更多運動記錄（過去 90 天），其他用戶 30-45 天
        if is_star:
            days_range = 90
            workout_frequency = 0.85  # 85% 的天數有運動
        else:
            days_range = random.randint(30, 45)
            workout_frequency = random.uniform(0.4, 0.7)

        print(f"  [+] Creating workouts for {user['display_name']} ({days_range} days)...")

        # 追蹤累計數據
        total_distance = 0
        total_duration = 0
        max_distance = 0
        consecutive_days = 0
        last_workout_date = None
        workout_dates = []

        for days_ago in range(days_range, -1, -1):  # 從過去到現在
            if random.random() > workout_frequency:
                consecutive_days = 0
                continue

            workout_date = datetime.now(timezone.utc) - timedelta(days=days_ago)
            workout_dates.append(workout_date.date())

            # 計算連續天數
            if last_workout_date:
                if (workout_date.date() - last_workout_date).days == 1:
                    consecutive_days += 1
                else:
                    consecutive_days = 1
            else:
                consecutive_days = 1
            last_workout_date = workout_date.date()

            # 隨機運動類型（跑步佔主導）
            workout_type = random.choices(
                ["running", "cycling", "swimming", "yoga", "gym", "hiking"],
                weights=[50, 20, 10, 10, 5, 5]
            )[0]

            # 隨機時段
            hour = random.choices(
                [6, 7, 8, 18, 19, 20, 21],  # 早上或傍晚
                weights=[15, 25, 20, 10, 15, 10, 5]
            )[0]
            workout_time = workout_date.replace(hour=hour, minute=random.randint(0, 59))

            # 根據類型設定數值（漸進式進步）
            progress_factor = 1 + (days_range - days_ago) / days_range * 0.3  # 最多 30% 進步

            if workout_type in ["running", "cycling", "hiking"]:
                if workout_type == "running":
                    base_distance = random.uniform(3, 8) if not is_star else random.uniform(5, 15)
                elif workout_type == "cycling":
                    base_distance = random.uniform(10, 30) if not is_star else random.uniform(20, 50)
                else:  # hiking
                    base_distance = random.uniform(5, 12)

                distance = round(base_distance * progress_factor, 2)
                duration = int(distance * random.uniform(5, 8))  # 分鐘/公里
            elif workout_type == "swimming":
                distance = round(random.uniform(0.5, 2), 2)
                duration = random.randint(30, 60)
            else:
                distance = None
                duration = random.randint(30, 90)

            calories = int(duration * random.uniform(6, 10))
            avg_hr = random.randint(110, 150)
            max_hr = avg_hr + random.randint(15, 35)

            workout = {
                "_id": ObjectId(),
                "user_id": user["_id"],
                "workout_type": workout_type,
                "start_time": workout_time,
                "duration_minutes": duration,
                "distance_km": distance,
                "calories": calories,
                "avg_heart_rate": avg_hr,
                "max_heart_rate": max_hr,
                "elevation_gain_m": random.randint(10, 300) if workout_type in ["running", "cycling", "hiking"] else None,
                "notes": random.choice(WORKOUT_CAPTIONS.get(workout_type, ["完成運動！"])) if random.random() > 0.4 else None,
                "created_at": workout_time,
                "updated_at": workout_time,
                "is_deleted": False,
                "synced_from_device": random.random() > 0.3,
            }

            await db.workouts.insert_one(workout)
            all_workouts.append(workout)

            # 更新累計數據
            if distance:
                total_distance += distance
                if distance > max_distance:
                    max_distance = distance
            total_duration += duration

        # 儲存用戶統計（用於成就判斷）
        user["_stats"] = {
            "total_distance": total_distance,
            "total_duration": total_duration,
            "max_distance": max_distance,
            "workout_count": len([w for w in all_workouts if w["user_id"] == user["_id"]]),
            "workout_dates": workout_dates,
        }

        workout_count = user["_stats"]["workout_count"]
        print(f"    [OK] Created {workout_count} workouts (total: {total_distance:.1f} km)")

    return all_workouts


async def create_achievements(db, users):
    """根據使用者統計建立成就"""
    print("  [+] Creating achievements...")
    achievements_created = 0

    for user in users:
        stats = user.get("_stats", {})
        is_star = user.get("_is_star_user", False)

        # 明星用戶解鎖更多成就
        if is_star:
            achievements_to_unlock = [
                "first_workout", "streak_3", "streak_7", "streak_30", "streak_60",
                "distance_5k", "distance_10k", "distance_half_marathon",
                "total_100km", "total_500km",
                "total_50hours", "total_100hours",
                "likes_10", "likes_50", "likes_100",
                "personal_record_distance"
            ]
        else:
            # 一般用戶根據統計解鎖
            achievements_to_unlock = ["first_workout"]

            total_km = stats.get("total_distance", 0)
            max_km = stats.get("max_distance", 0)
            workout_count = stats.get("workout_count", 0)

            if workout_count >= 3:
                achievements_to_unlock.append("streak_3")
            if workout_count >= 7:
                achievements_to_unlock.append("streak_7")
            if max_km >= 5:
                achievements_to_unlock.append("distance_5k")
            if max_km >= 10:
                achievements_to_unlock.append("distance_10k")
            if total_km >= 100:
                achievements_to_unlock.append("total_100km")
            if random.random() > 0.5:
                achievements_to_unlock.append("likes_10")

        for ach_type in achievements_to_unlock:
            if ach_type not in ACHIEVEMENT_TYPES:
                continue

            ach_config = ACHIEVEMENT_TYPES[ach_type]
            days_ago = random.randint(1, 60)

            achievement = {
                "_id": ObjectId(),
                "user_id": user["_id"],  # Store as ObjectId (API queries with ObjectId)
                "achievement_type": ach_type,
                "celebration_level": ach_config["celebration_level"],
                "metadata": ach_config["metadata"],
                "achieved_at": datetime.now(timezone.utc) - timedelta(days=days_ago),
                "shared": random.random() > 0.6,
                "share_card_url": None,
            }

            await db.achievements.insert_one(achievement)
            achievements_created += 1

    print(f"    [OK] Created {achievements_created} achievements")
    return achievements_created


async def create_milestones(db, users, workouts):
    """建立里程碑事件"""
    print("  [+] Creating milestones...")
    milestones_created = 0

    for user in users:
        stats = user.get("_stats", {})
        is_star = user.get("_is_star_user", False)
        user_workouts = [w for w in workouts if w["user_id"] == user["_id"]]

        if not user_workouts:
            continue

        # 第一次運動
        first_workout = min(user_workouts, key=lambda w: w["start_time"])
        milestone = {
            "_id": ObjectId(),
            "user_id": user["_id"],  # Store as ObjectId (API queries with ObjectId)
            "workout_id": first_workout["_id"],  # Store as ObjectId
            "milestone_type": "first_workout",
            "title": "第一次運動",
            "description": "開啟健康生活的第一步！恭喜你踏出這一步。",
            "metadata": {"workout_type": first_workout["workout_type"]},
            "achieved_at": first_workout["start_time"],
            "created_at": first_workout["start_time"],
            "highlighted": True,
        }
        await db.milestones.insert_one(milestone)
        milestones_created += 1

        # 距離里程碑
        running_workouts = [w for w in user_workouts if w["workout_type"] == "running" and w.get("distance_km")]

        for workout in running_workouts:
            dist = workout.get("distance_km", 0)

            if dist >= 5 and dist < 10:
                existing = await db.milestones.find_one({
                    "user_id": user["_id"],
                    "milestone_type": "first_5k"
                })
                if not existing:
                    milestone = {
                        "_id": ObjectId(),
                        "user_id": user["_id"],  # Store as ObjectId
                        "workout_id": workout["_id"],  # Store as ObjectId
                        "milestone_type": "first_5k",
                        "title": "首次 5K",
                        "description": f"成功完成 {dist:.2f} 公里跑步！",
                        "metadata": {"distance_km": dist},
                        "achieved_at": workout["start_time"],
                        "created_at": workout["start_time"],
                        "highlighted": True,
                    }
                    await db.milestones.insert_one(milestone)
                    milestones_created += 1

            elif dist >= 10 and dist < 21:
                existing = await db.milestones.find_one({
                    "user_id": user["_id"],
                    "milestone_type": "first_10k"
                })
                if not existing:
                    milestone = {
                        "_id": ObjectId(),
                        "user_id": user["_id"],  # Store as ObjectId
                        "workout_id": workout["_id"],  # Store as ObjectId
                        "milestone_type": "first_10k",
                        "title": "首次 10K",
                        "description": f"突破雙位數！完成 {dist:.2f} 公里跑步！",
                        "metadata": {"distance_km": dist},
                        "achieved_at": workout["start_time"],
                        "created_at": workout["start_time"],
                        "highlighted": True,
                    }
                    await db.milestones.insert_one(milestone)
                    milestones_created += 1

        # 明星用戶加入累計里程碑
        if is_star:
            total_km = stats.get("total_distance", 0)
            if total_km >= 100:
                milestone = {
                    "_id": ObjectId(),
                    "user_id": user["_id"],  # Store as ObjectId
                    "workout_id": None,
                    "milestone_type": "distance_milestone",
                    "title": "累計 100 公里",
                    "description": f"總共跑了 {total_km:.1f} 公里！持續累積中。",
                    "metadata": {"total_km": total_km},
                    "achieved_at": datetime.now(timezone.utc) - timedelta(days=random.randint(5, 20)),
                    "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(5, 20)),
                    "highlighted": True,
                }
                await db.milestones.insert_one(milestone)
                milestones_created += 1

    print(f"    [OK] Created {milestones_created} milestones")
    return milestones_created


async def create_activities_and_interactions(db, users, workouts):
    """建立社群動態與互動（含 Pexels 圖片）"""
    print("  [+] Creating activities with images and interactions...")
    print("    [*] Fetching images from Pexels API...")

    # 預先獲取各類型的圖片
    workout_types = ["running", "cycling", "swimming", "yoga", "gym", "hiking"]
    for wtype in workout_types:
        await fetch_pexels_images(wtype, 15)
    print("    [OK] Images cached")

    activities_created = 0
    likes_created = 0
    comments_created = 0

    # 只為最近的部分運動建立帶圖動態（避免過多）
    recent_workouts = sorted(workouts, key=lambda w: w["created_at"], reverse=True)[:50]

    for workout in recent_workouts:
        user = next((u for u in users if u["_id"] == workout["user_id"]), None)
        if not user:
            continue

        workout_type = workout["workout_type"]

        # 獲取圖片
        images = IMAGE_CACHE.get(f"{workout_type}_15", [])
        image_url = random.choice(images) if images else None

        # 生成短文
        captions = WORKOUT_CAPTIONS.get(workout_type, ["完成運動！"])
        caption = random.choice(captions)

        activity = {
            "_id": ObjectId(),
            "user_id": workout["user_id"],  # Store as ObjectId (API queries with ObjectId)
            "activity_type": "workout",
            "reference_id": workout["_id"],  # Store as ObjectId
            "content": {
                "workout_type": workout["workout_type"],
                "duration_minutes": workout["duration_minutes"],
                "distance_km": workout.get("distance_km"),
                "calories": workout.get("calories"),
                "notes": workout.get("notes"),
            },
            "image_url": image_url,
            "caption": caption,
            "likes_count": 0,
            "comments_count": 0,
            "created_at": workout["created_at"],
            "updated_at": workout["created_at"],
        }

        await db.activities.insert_one(activity)
        activities_created += 1

        # 明星用戶獲得更多互動
        is_star_workout = user.get("_is_star_user", False)

        # 隨機新增讚
        other_users = [u for u in users if u["_id"] != workout["user_id"]]
        like_probability = 0.85 if is_star_workout else 0.6

        for liker in other_users:
            if random.random() < like_probability:
                like = {
                    "_id": ObjectId(),
                    "user_id": liker["_id"],  # Store as ObjectId (API queries with ObjectId)
                    "activity_id": activity["_id"],  # Store as ObjectId
                    "created_at": workout["created_at"] + timedelta(minutes=random.randint(5, 1440)),
                }
                await db.likes.insert_one(like)
                likes_created += 1

                await db.activities.update_one(
                    {"_id": activity["_id"]},
                    {"$inc": {"likes_count": 1}}
                )

        # 隨機新增留言
        comment_probability = 0.6 if is_star_workout else 0.35
        commenters = random.sample(other_users, min(4, len(other_users)))

        for commenter in commenters:
            if random.random() < comment_probability:
                comment = {
                    "_id": ObjectId(),
                    "activity_id": activity["_id"],  # Store as ObjectId
                    "user_id": commenter["_id"],  # Store as ObjectId (API queries with ObjectId)
                    "content": random.choice(COMMENT_TEXTS),
                    "parent_id": None,
                    "created_at": workout["created_at"] + timedelta(minutes=random.randint(10, 2880)),
                    "updated_at": workout["created_at"] + timedelta(minutes=random.randint(10, 2880)),
                    "is_deleted": False,
                }
                await db.comments.insert_one(comment)
                comments_created += 1

                await db.activities.update_one(
                    {"_id": activity["_id"]},
                    {"$inc": {"comments_count": 1}}
                )

    print(f"    [OK] Created {activities_created} activities, {likes_created} likes, {comments_created} comments")


async def create_friendships(db, users):
    """建立好友關係（所有人互為好友）"""
    print("  [+] Creating friendships (everyone is friends)...")

    friendships_created = 0

    for i, user in enumerate(users):
        for j, friend in enumerate(users):
            if i >= j:  # 避免重複
                continue

            friendship = {
                "_id": ObjectId(),
                "user_id": user["_id"],  # Store as ObjectId (API queries with ObjectId)
                "friend_id": friend["_id"],  # Store as ObjectId
                "status": "accepted",
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(7, 90)),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=random.randint(1, 7)),
            }
            await db.friendships.insert_one(friendship)
            friendships_created += 1

    print(f"    [OK] Created {friendships_created} friendships")


async def create_dashboards(db, users):
    """為每個使用者建立儀表板"""
    print("  [+] Creating dashboards...")

    for user in users:
        is_star = user.get("_is_star_user", False)

        # 明星用戶有更豐富的 widgets
        if is_star:
            widgets = [
                {"id": str(ObjectId()), "type": "streak_counter", "title": "連續運動", "position": {"x": 0, "y": 0}, "size": {"width": 4, "height": 2}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "weekly_stats", "title": "本週統計", "position": {"x": 4, "y": 0}, "size": {"width": 4, "height": 2}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "monthly_distance", "title": "月跑量", "position": {"x": 0, "y": 2}, "size": {"width": 4, "height": 3}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "achievement_showcase", "title": "成就展示", "position": {"x": 4, "y": 2}, "size": {"width": 4, "height": 3}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "distance_leaderboard", "title": "排行榜", "position": {"x": 0, "y": 5}, "size": {"width": 4, "height": 2}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "line_chart", "title": "進度圖表", "position": {"x": 4, "y": 5}, "size": {"width": 4, "height": 2}, "config": {}, "visible": True},
            ]
        else:
            widgets = [
                {"id": str(ObjectId()), "type": "streak_counter", "title": "連續運動", "position": {"x": 0, "y": 0}, "size": {"width": 4, "height": 2}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "weekly_stats", "title": "本週統計", "position": {"x": 4, "y": 0}, "size": {"width": 4, "height": 2}, "config": {}, "visible": True},
                {"id": str(ObjectId()), "type": "achievement_showcase", "title": "成就展示", "position": {"x": 0, "y": 2}, "size": {"width": 4, "height": 3}, "config": {}, "visible": True},
            ]

        dashboard = {
            "_id": ObjectId(),
            "user_id": str(user["_id"]),  # Store as string for API compatibility
            "name": "我的儀表板",
            "widgets": widgets,
            "is_default": True,
            "created_at": user["created_at"],
            "updated_at": datetime.now(timezone.utc),
        }

        await db.dashboards.insert_one(dashboard)

    print(f"    [OK] Created dashboards for {len(users)} users")


async def main():
    print("=" * 70)
    print("[DEMO] MotionStory Demo Data Seed Script")
    print("       For Shareholder Presentation")
    print("       WITH PEXELS HIGH-QUALITY IMAGES")
    print("=" * 70)

    # 連接 MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]

    print(f"\n[DB] Connected to database: {settings.DB_NAME}")

    try:
        # 0. 清除現有資料
        print("\n[0/7] Clearing existing demo data...")
        await clear_demo_data(db)

        # 1. 建立使用者
        print("\n[1/7] Creating demo users...")
        users = await create_demo_users(db)

        # 2. 建立運動記錄
        print("\n[2/7] Creating realistic workouts...")
        workouts = await create_realistic_workouts(db, users)

        # 3. 建立成就
        print("\n[3/7] Creating achievements...")
        await create_achievements(db, users)

        # 4. 建立里程碑
        print("\n[4/7] Creating milestones...")
        await create_milestones(db, users, workouts)

        # 5. 建立好友關係
        print("\n[5/7] Creating friendships...")
        await create_friendships(db, users)

        # 6. 建立動態與互動（含 Pexels 圖片）
        print("\n[6/7] Creating activities with Pexels images...")
        await create_activities_and_interactions(db, users, workouts)

        # 7. 建立儀表板
        print("\n[7/7] Creating dashboards...")
        await create_dashboards(db, users)

        print("\n" + "=" * 70)
        print("[OK] Demo data seed completed successfully!")
        print("=" * 70)
        print("\n[Summary]")
        print(f"   - Users created: {len(DEMO_USERS)}")
        print(f"   - Total workouts: {len(workouts)}")
        print(f"   - Password for all users: {PASSWORD}")
        print("\n[Demo Accounts]")
        print("   [STAR] Star User (for presentation):")
        print(f"      Email: demo@example.com")
        print(f"      Password: {PASSWORD}")
        print("\n   Other users:")
        for user_data in DEMO_USERS[1:]:
            print(f"      - {user_data['email']}")

        print("\n[Features to Demo]")
        print("   1. Dashboard - Widget display with achievements, stats, leaderboard")
        print("   2. Workout List - Realistic workout history with progressive improvement")
        print("   3. Timeline - Milestones and achievements over time")
        print("   4. Social Feed - BEAUTIFUL CARDS with Pexels images!")
        print("   5. Achievements - 16+ unlocked achievements for star user")
        print("   6. Leaderboard - Rankings among all users")
        print("   7. Stats - Detailed workout statistics and charts")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
