"""
Social Service (T239-T241)
社交互動服務：好友動態牆、按讚留言、內容審核
Modified: 2025-12-11 - Fixed user_id ObjectId/string compatibility
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import re

from ..models import (
    ActivityCreate,
    ActivityInDB,
    ActivityResponse,
    LikeCreate,
    LikeInDB,
    LikeResponse,
    CommentCreate,
    CommentInDB,
    CommentResponse,
)


class SocialService:
    """社交服務"""

    # T241: 敏感詞彙列表 (內容審核)
    SENSITIVE_WORDS = [
        "垃圾", "廣告", "詐騙", "色情", "暴力",
        "spam", "scam", "fake", "porn", "violence"
    ]

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.activities = db.activities
        self.likes = db.likes
        self.comments = db.comments
        self.users = db.users
        self.friendships = db.friendships
        self.workouts = db.workouts
        self.achievements = db.achievements
        self.challenges = db.challenges

    async def get_feed(
        self,
        user_id: str,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Dict:
        """
        T239: 好友動態牆 (Cursor Pagination)

        取得好友的運動記錄、成就與挑戰動態
        使用 Cursor-based Pagination，單次載入 20 筆
        效能目標: < 200ms

        Args:
            user_id: 當前使用者 ID
            cursor: 分頁 cursor (上次查詢的最後一個 activity created_at)
            limit: 每頁數量 (預設 20，最大 50)

        Returns:
            Dict: {
                "activities": List[ActivityResponse],
                "next_cursor": str | None,
                "has_more": bool
            }
        """
        # 限制 limit 範圍
        limit = min(limit, 50)

        # 取得好友 ID 列表
        friend_ids = await self._get_friend_ids(user_id)

        if not friend_ids:
            return {
                "activities": [],
                "next_cursor": None,
                "has_more": False
            }

        # 構建查詢條件
        query = {"user_id": {"$in": friend_ids}}

        # Cursor-based pagination
        if cursor:
            try:
                cursor_time = datetime.fromisoformat(cursor)
                query["created_at"] = {"$lt": cursor_time}
            except ValueError:
                pass

        # 查詢動態 (按時間倒序)
        activities_cursor = self.activities.find(query).sort("created_at", -1).limit(limit + 1)
        activities = await activities_cursor.to_list(length=limit + 1)

        # 判斷是否有更多資料
        has_more = len(activities) > limit
        if has_more:
            activities = activities[:limit]

        # 取得下一頁 cursor
        next_cursor = None
        if has_more and activities:
            next_cursor = activities[-1]["created_at"].isoformat()

        # 組裝回應資料
        response_activities = []
        for activity in activities:
            # 查詢使用者資料 - 處理 user_id 可能是 ObjectId 或字串的情況
            activity_user_id = activity["user_id"]
            if isinstance(activity_user_id, str):
                activity_user_id = ObjectId(activity_user_id)
            user = await self.users.find_one({"_id": activity_user_id})
            if not user:
                continue

            # 檢查當前使用者是否已按讚
            like_count = await self.likes.count_documents({"activity_id": activity["_id"]})
            is_liked = await self.likes.count_documents({
                "activity_id": activity["_id"],
                "user_id": ObjectId(user_id)
            }) > 0

            # 留言數量
            comment_count = await self.comments.count_documents({"activity_id": activity["_id"]})

            response_activities.append(ActivityResponse(
                activity_id=str(activity["_id"]),
                user_id=str(activity["user_id"]),
                user_name=user.get("display_name", ""),
                user_avatar=user.get("avatar_url"),
                activity_type=activity["activity_type"],
                reference_id=str(activity["reference_id"]),
                content=activity.get("content", {}),
                image_url=activity.get("image_url"),
                caption=activity.get("caption"),
                likes_count=like_count,
                comments_count=comment_count,
                is_liked_by_me=is_liked,
                created_at=activity["created_at"]
            ))

        return {
            "activities": response_activities,
            "next_cursor": next_cursor,
            "has_more": has_more
        }

    async def create_activity(
        self,
        user_id: str,
        activity_type: str,
        reference_id: str,
        content: Optional[Dict] = None,
        image_url: Optional[str] = None,
        caption: Optional[str] = None
    ) -> ActivityResponse:
        """
        建立動態

        Args:
            user_id: 使用者 ID
            activity_type: 動態類型 (workout, achievement, challenge)
            reference_id: 關聯物件 ID
            content: 動態內容快照
            image_url: 動態配圖 URL
            caption: 使用者短文/心得

        Returns:
            ActivityResponse: 動態回應
        """
        # 檢查是否已存在相同動態
        existing = await self.activities.find_one({
            "user_id": ObjectId(user_id),
            "activity_type": activity_type,
            "reference_id": ObjectId(reference_id)
        })

        if existing:
            # 已存在，更新 caption 和 image_url（允許重新分享更新內容）
            update_data = {"updated_at": datetime.now(timezone.utc)}
            if caption is not None:
                update_data["caption"] = caption
            if image_url is not None:
                update_data["image_url"] = image_url

            await self.activities.update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )

            user = await self.users.find_one({"_id": ObjectId(user_id)})

            return ActivityResponse(
                activity_id=str(existing["_id"]),
                user_id=user_id,
                user_name=user.get("display_name", ""),
                user_avatar=user.get("avatar_url"),
                activity_type=activity_type,
                reference_id=reference_id,
                content=existing.get("content", {}),
                image_url=image_url or existing.get("image_url"),
                caption=caption or existing.get("caption"),
                likes_count=existing.get("likes_count", 0),
                comments_count=existing.get("comments_count", 0),
                is_liked_by_me=False,
                created_at=existing["created_at"]
            )

        # 建立新動態
        now = datetime.now(timezone.utc)
        activity_doc = {
            "user_id": ObjectId(user_id),
            "activity_type": activity_type,
            "reference_id": ObjectId(reference_id),
            "content": content or {},
            "image_url": image_url,
            "caption": caption,
            "likes_count": 0,
            "comments_count": 0,
            "created_at": now,
            "updated_at": now
        }

        result = await self.activities.insert_one(activity_doc)

        user = await self.users.find_one({"_id": ObjectId(user_id)})

        return ActivityResponse(
            activity_id=str(result.inserted_id),
            user_id=user_id,
            user_name=user.get("display_name", ""),
            user_avatar=user.get("avatar_url"),
            activity_type=activity_type,
            reference_id=reference_id,
            content=content or {},
            image_url=image_url,
            caption=caption,
            likes_count=0,
            comments_count=0,
            is_liked_by_me=False,
            created_at=now
        )

    async def like_activity(
        self,
        user_id: str,
        activity_id: str
    ) -> LikeResponse:
        """
        T240: 按讚與留言邏輯

        對指定動態按讚

        Args:
            user_id: 使用者 ID
            activity_id: 動態 ID

        Returns:
            LikeResponse: 按讚回應

        Raises:
            ValueError: 動態不存在或已按讚
        """
        # 檢查動態是否存在
        activity = await self.activities.find_one({"_id": ObjectId(activity_id)})
        if not activity:
            raise ValueError("Activity not found")

        # 檢查是否已按讚
        existing = await self.likes.find_one({
            "user_id": ObjectId(user_id),
            "activity_id": ObjectId(activity_id)
        })

        if existing:
            raise ValueError("Already liked")

        # 建立按讚記錄
        like = LikeInDB(
            user_id=ObjectId(user_id),
            activity_id=ObjectId(activity_id),
            liked_at=datetime.now(timezone.utc)
        )

        result = await self.likes.insert_one(like.dict(by_alias=True, exclude={"id"}))

        # 更新動態的按讚計數
        await self.activities.update_one(
            {"_id": ObjectId(activity_id)},
            {"$inc": {"likes_count": 1}}
        )

        return LikeResponse(
            like_id=str(result.inserted_id),
            user_id=user_id,
            activity_id=activity_id,
            liked_at=like.liked_at
        )

    async def unlike_activity(
        self,
        user_id: str,
        activity_id: str
    ):
        """
        取消按讚

        Args:
            user_id: 使用者 ID
            activity_id: 動態 ID
        """
        # 刪除按讚記錄
        result = await self.likes.delete_one({
            "user_id": ObjectId(user_id),
            "activity_id": ObjectId(activity_id)
        })

        if result.deleted_count > 0:
            # 更新動態的按讚計數
            await self.activities.update_one(
                {"_id": ObjectId(activity_id)},
                {"$inc": {"likes_count": -1}}
            )

    async def add_comment(
        self,
        user_id: str,
        activity_id: str,
        content: str,
        parent_id: Optional[str] = None
    ) -> CommentResponse:
        """
        T240: 按讚與留言邏輯
        T241: 內容審核 (敏感詞過濾)

        對好友動態留言（最多 200 字）
        頻率限制: 1 分鐘最多 10 則留言
        敏感詞彙自動過濾

        Args:
            user_id: 使用者 ID
            activity_id: 動態 ID
            content: 留言內容
            parent_id: 父留言 ID（回覆功能）

        Returns:
            CommentResponse: 留言回應

        Raises:
            ValueError: 動態不存在或超過頻率限制
        """
        # 檢查動態是否存在
        activity = await self.activities.find_one({"_id": ObjectId(activity_id)})
        if not activity:
            raise ValueError("Activity not found")

        # 檢查頻率限制 (1 分鐘 10 則)
        one_minute_ago = datetime.now(timezone.utc).timestamp() - 60
        recent_comments = await self.comments.count_documents({
            "user_id": ObjectId(user_id),
            "created_at": {"$gte": datetime.fromtimestamp(one_minute_ago, tz=timezone.utc)}
        })

        if recent_comments >= 10:
            raise ValueError("Comment rate limit exceeded (max 10 comments per minute)")

        # T241: 內容審核 - 檢查敏感詞彙
        is_filtered, filtered_content = self._filter_sensitive_words(content)
        status = "filtered" if is_filtered else "normal"

        # 建立留言
        comment = CommentInDB(
            user_id=ObjectId(user_id),
            activity_id=ObjectId(activity_id),
            content=filtered_content,
            parent_id=ObjectId(parent_id) if parent_id else None,
            status=status,
            created_at=datetime.now(timezone.utc)
        )

        result = await self.comments.insert_one(comment.dict(by_alias=True, exclude={"id"}))

        # 更新動態的留言計數
        await self.activities.update_one(
            {"_id": ObjectId(activity_id)},
            {"$inc": {"comments_count": 1}}
        )

        # 查詢使用者資料
        user = await self.users.find_one({"_id": ObjectId(user_id)})

        return CommentResponse(
            comment_id=str(result.inserted_id),
            user_id=user_id,
            user_name=user.get("display_name", ""),
            user_avatar=user.get("avatar_url"),
            content=filtered_content,
            parent_id=parent_id,
            status=status,
            created_at=comment.created_at
        )

    async def get_comments(
        self,
        activity_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[CommentResponse], int]:
        """
        取得留言列表

        Args:
            activity_id: 動態 ID
            limit: 每頁數量
            offset: 偏移量

        Returns:
            tuple: (留言列表, 總數)
        """
        # 計算總數
        total_count = await self.comments.count_documents({"activity_id": ObjectId(activity_id)})

        # 查詢留言 (按時間倒序)
        comments_cursor = self.comments.find({
            "activity_id": ObjectId(activity_id)
        }).sort("created_at", -1).skip(offset).limit(limit)

        comments = await comments_cursor.to_list(length=limit)

        # 組裝回應
        response_comments = []
        for comment in comments:
            user = await self.users.find_one({"_id": comment["user_id"]})
            if not user:
                continue

            response_comments.append(CommentResponse(
                comment_id=str(comment["_id"]),
                user_id=str(comment["user_id"]),
                user_name=user.get("display_name", ""),
                user_avatar=user.get("avatar_url"),
                content=comment["content"],
                parent_id=str(comment["parent_id"]) if comment.get("parent_id") else None,
                status=comment.get("status", "normal"),
                created_at=comment["created_at"]
            ))

        return response_comments, total_count

    # Helper methods

    async def _get_friend_ids(self, user_id: str) -> List:
        """取得好友 ID 列表 (包含自己) - 同時回傳 ObjectId 和字串格式以相容舊資料"""
        friendships_cursor = self.friendships.find({
            "$or": [
                {"user_id": ObjectId(user_id)},
                {"friend_id": ObjectId(user_id)}
            ],
            "status": "accepted"
        })

        friendships = await friendships_cursor.to_list(length=1000)
        # 同時包含 ObjectId 和字串格式以相容舊資料
        friend_ids = [ObjectId(user_id), user_id]  # 包含自己的動態

        for friendship in friendships:
            if str(friendship["user_id"]) == user_id:
                friend_id = friendship["friend_id"]
                friend_ids.extend([friend_id, str(friend_id)])
            else:
                friend_id = friendship["user_id"]
                friend_ids.extend([friend_id, str(friend_id)])

        return friend_ids

    def _filter_sensitive_words(self, content: str) -> tuple[bool, str]:
        """
        T241: 內容審核 - 敏感詞彙過濾

        Args:
            content: 原始內容

        Returns:
            tuple: (是否包含敏感詞, 過濾後的內容)
        """
        is_filtered = False
        filtered_content = content

        for word in self.SENSITIVE_WORDS:
            if word.lower() in content.lower():
                is_filtered = True
                # 將敏感詞替換為 ***
                pattern = re.compile(re.escape(word), re.IGNORECASE)
                filtered_content = pattern.sub("***", filtered_content)

        return is_filtered, filtered_content

    async def get_my_activities(
        self,
        user_id: str,
        cursor: Optional[str] = None,
        limit: int = 20
    ) -> Dict:
        """
        取得個人發布的動態列表

        Args:
            user_id: 使用者 ID
            cursor: 分頁 cursor
            limit: 每頁數量

        Returns:
            Dict: 動態列表與分頁資訊
        """
        limit = min(limit, 50)

        # 構建查詢條件 - 同時支援 ObjectId 和字串格式的 user_id (向後相容)
        query = {"$or": [{"user_id": ObjectId(user_id)}, {"user_id": user_id}]}

        # Cursor-based pagination
        if cursor:
            try:
                cursor_time = datetime.fromisoformat(cursor)
                query["created_at"] = {"$lt": cursor_time}
            except ValueError:
                pass

        # 查詢動態 (按時間倒序)
        activities_cursor = self.activities.find(query).sort("created_at", -1).limit(limit + 1)
        activities = await activities_cursor.to_list(length=limit + 1)

        # 判斷是否有更多資料
        has_more = len(activities) > limit
        if has_more:
            activities = activities[:limit]

        # 取得下一頁 cursor
        next_cursor = None
        if has_more and activities:
            next_cursor = activities[-1]["created_at"].isoformat()

        # 查詢使用者資料
        user = await self.users.find_one({"_id": ObjectId(user_id)})

        # 組裝回應資料
        response_activities = []
        for activity in activities:
            # 檢查按讚狀態
            like_count = await self.likes.count_documents({"activity_id": activity["_id"]})
            is_liked = await self.likes.count_documents({
                "activity_id": activity["_id"],
                "user_id": ObjectId(user_id)
            }) > 0

            # 留言數量
            comment_count = await self.comments.count_documents({"activity_id": activity["_id"]})

            response_activities.append(ActivityResponse(
                activity_id=str(activity["_id"]),
                user_id=str(activity["user_id"]),
                user_name=user.get("display_name", "") if user else "",
                user_avatar=user.get("avatar_url") if user else None,
                activity_type=activity["activity_type"],
                reference_id=str(activity["reference_id"]),
                content=activity.get("content", {}),
                image_url=activity.get("image_url"),
                caption=activity.get("caption"),
                likes_count=like_count,
                comments_count=comment_count,
                is_liked_by_me=is_liked,
                created_at=activity["created_at"]
            ))

        return {
            "activities": response_activities,
            "next_cursor": next_cursor,
            "has_more": has_more
        }

    async def update_activity(
        self,
        user_id: str,
        activity_id: str,
        caption: Optional[str] = None,
        image_url: Optional[str] = None
    ) -> ActivityResponse:
        """
        更新動態

        Args:
            user_id: 使用者 ID
            activity_id: 動態 ID
            caption: 新的說明文字
            image_url: 新的圖片 URL

        Returns:
            ActivityResponse: 更新後的動態
        """
        # 查詢動態
        activity = await self.activities.find_one({"_id": ObjectId(activity_id)})
        if not activity:
            raise ValueError("Activity not found")

        # 檢查權限
        if str(activity["user_id"]) != user_id:
            raise ValueError("No permission to update this activity")

        # 更新資料
        update_data = {"updated_at": datetime.now(timezone.utc)}
        if caption is not None:
            update_data["caption"] = caption
        if image_url is not None:
            update_data["image_url"] = image_url

        await self.activities.update_one(
            {"_id": ObjectId(activity_id)},
            {"$set": update_data}
        )

        # 重新取得動態
        activity = await self.activities.find_one({"_id": ObjectId(activity_id)})
        user = await self.users.find_one({"_id": ObjectId(user_id)})

        # 計算按讚和留言數
        like_count = await self.likes.count_documents({"activity_id": ObjectId(activity_id)})
        comment_count = await self.comments.count_documents({"activity_id": ObjectId(activity_id)})

        return ActivityResponse(
            activity_id=str(activity["_id"]),
            user_id=user_id,
            user_name=user.get("display_name", "") if user else "",
            user_avatar=user.get("avatar_url") if user else None,
            activity_type=activity["activity_type"],
            reference_id=str(activity["reference_id"]),
            content=activity.get("content", {}),
            image_url=activity.get("image_url"),
            caption=activity.get("caption"),
            likes_count=like_count,
            comments_count=comment_count,
            is_liked_by_me=False,
            created_at=activity["created_at"]
        )

    async def delete_activity(
        self,
        user_id: str,
        activity_id: str
    ):
        """
        刪除動態

        Args:
            user_id: 使用者 ID
            activity_id: 動態 ID
        """
        # 查詢動態
        activity = await self.activities.find_one({"_id": ObjectId(activity_id)})
        if not activity:
            raise ValueError("Activity not found")

        # 檢查權限
        if str(activity["user_id"]) != user_id:
            raise ValueError("No permission to delete this activity")

        # 刪除相關的按讚
        await self.likes.delete_many({"activity_id": ObjectId(activity_id)})

        # 刪除相關的留言
        await self.comments.delete_many({"activity_id": ObjectId(activity_id)})

        # 刪除動態
        await self.activities.delete_one({"_id": ObjectId(activity_id)})
# reload trigger
