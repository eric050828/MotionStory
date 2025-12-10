"""
Friend Service (T236-T238)
好友系統服務：搜尋、邀請、管理與封鎖
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..models import (
    FriendshipCreate,
    FriendshipInDB,
    FriendshipResponse,
    FriendProfile,
    FriendRequest,
    UserSearchResult,
    BlockListCreate,
    BlockListInDB,
)


class FriendService:
    """好友服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.friendships = db.friendships
        self.users = db.users
        self.blocklist = db.blocklist
        self.workouts = db.workouts

    async def search_friends(
        self,
        user_id: str,
        query_type: str,
        query: str
    ) -> List[UserSearchResult]:
        """
        T236: 好友搜尋邏輯

        透過使用者 ID、Email 或 QR Code 搜尋好友
        排除已封鎖使用者與已是好友的使用者

        Args:
            user_id: 當前使用者 ID
            query_type: 搜尋類型 (user_id, email, qrcode)
            query: 搜尋關鍵字

        Returns:
            List[UserSearchResult]: 搜尋結果列表
        """
        # 構建查詢條件
        search_filter = {}
        if query_type == "email":
            search_filter = {"email": {"$regex": query, "$options": "i"}}
        elif query_type == "user_id":
            if ObjectId.is_valid(query):
                search_filter = {"_id": ObjectId(query)}
            else:
                return []
        elif query_type == "qrcode":
            # QR Code 格式: motionstory://user/{user_id}
            if query.startswith("motionstory://user/"):
                extracted_id = query.replace("motionstory://user/", "")
                if ObjectId.is_valid(extracted_id):
                    search_filter = {"_id": ObjectId(extracted_id)}
                else:
                    return []
            else:
                return []

        # 排除自己
        search_filter["_id"] = {"$ne": ObjectId(user_id)}

        # 查詢使用者
        users_cursor = self.users.find(search_filter).limit(20)
        users = await users_cursor.to_list(length=20)

        if not users:
            return []

        # 取得封鎖名單
        blocked_users = await self.get_blocked_users(user_id)
        blocked_ids = {str(bu) for bu in blocked_users}

        # 取得已有好友關係的使用者
        friend_ids = await self.get_friend_ids(user_id)

        # 組裝結果
        results = []
        for user in users:
            user_id_str = str(user["_id"])

            # 排除封鎖的使用者
            if user_id_str in blocked_ids:
                continue

            results.append(UserSearchResult(
                user_id=user_id_str,
                display_name=user.get("display_name", ""),
                avatar_url=user.get("avatar_url"),
                is_friend=(user_id_str in friend_ids),
                is_blocked=False
            ))

        return results

    async def send_friend_invite(
        self,
        user_id: str,
        friend_id: str
    ) -> FriendshipResponse:
        """
        T237: 好友邀請與接受

        向指定使用者發送好友邀請
        - 好友上限: 200 人
        - 冷卻期: 被拒絕後 7 天內不可再次邀請同一使用者

        Args:
            user_id: 發起邀請的使用者 ID
            friend_id: 被邀請的使用者 ID

        Returns:
            FriendshipResponse: 好友關係

        Raises:
            ValueError: 超過好友上限或在冷卻期內
        """
        # 檢查是否自己邀請自己
        if user_id == friend_id:
            raise ValueError("Cannot send friend request to yourself")

        # 檢查目標使用者是否存在
        target_user = await self.users.find_one({"_id": ObjectId(friend_id)})
        if not target_user:
            raise ValueError("User not found")

        # 檢查是否已封鎖
        is_blocked = await self.is_blocked(user_id, friend_id)
        if is_blocked:
            raise ValueError("Cannot send friend request to blocked user")

        # 檢查好友數量上限 (200)
        friend_count = await self.friendships.count_documents({
            "user_id": ObjectId(user_id),
            "status": "accepted"
        })
        if friend_count >= 200:
            raise ValueError("Friend limit reached (200 friends maximum)")

        # 檢查是否已有好友關係
        existing = await self.friendships.find_one({
            "$or": [
                {"user_id": ObjectId(user_id), "friend_id": ObjectId(friend_id)},
                {"user_id": ObjectId(friend_id), "friend_id": ObjectId(user_id)}
            ]
        })

        if existing:
            if existing["status"] == "accepted":
                raise ValueError("Already friends")
            elif existing["status"] == "pending":
                raise ValueError("Friend request already sent")
            elif existing["status"] == "rejected":
                # 檢查冷卻期 (7 天)
                rejected_at = existing.get("rejected_at")
                if rejected_at:
                    cooldown_end = rejected_at + timedelta(days=7)
                    if datetime.now(timezone.utc) < cooldown_end:
                        raise ValueError("Cannot send friend request within 7 days after rejection")

                # 冷卻期結束,更新為 pending
                await self.friendships.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "status": "pending",
                            "invited_at": datetime.now(timezone.utc),
                            "rejected_at": None
                        }
                    }
                )

                return FriendshipResponse(
                    friendship_id=str(existing["_id"]),
                    user_id=user_id,
                    friend_id=friend_id,
                    status="pending",
                    invited_at=datetime.now(timezone.utc),
                    accepted_at=None
                )

        # 建立新的好友邀請
        friendship = FriendshipInDB(
            user_id=ObjectId(user_id),
            friend_id=ObjectId(friend_id),
            status="pending",
            invited_at=datetime.now(timezone.utc)
        )

        result = await self.friendships.insert_one(friendship.dict(by_alias=True, exclude={"id"}))

        return FriendshipResponse(
            friendship_id=str(result.inserted_id),
            user_id=user_id,
            friend_id=friend_id,
            status="pending",
            invited_at=friendship.invited_at,
            accepted_at=None
        )

    async def accept_friend_request(
        self,
        user_id: str,
        friendship_id: str
    ) -> FriendshipResponse:
        """
        接受好友邀請

        Args:
            user_id: 當前使用者 ID
            friendship_id: 好友關係 ID

        Returns:
            FriendshipResponse: 更新後的好友關係
        """
        # 查詢好友邀請
        friendship = await self.friendships.find_one({
            "_id": ObjectId(friendship_id),
            "friend_id": ObjectId(user_id),
            "status": "pending"
        })

        if not friendship:
            raise ValueError("Friend request not found")

        # 更新狀態
        now = datetime.now(timezone.utc)
        await self.friendships.update_one(
            {"_id": ObjectId(friendship_id)},
            {
                "$set": {
                    "status": "accepted",
                    "accepted_at": now
                }
            }
        )

        return FriendshipResponse(
            friendship_id=friendship_id,
            user_id=str(friendship["user_id"]),
            friend_id=str(friendship["friend_id"]),
            status="accepted",
            invited_at=friendship["invited_at"],
            accepted_at=now
        )

    async def reject_friend_request(
        self,
        user_id: str,
        friendship_id: str
    ):
        """
        拒絕好友邀請

        Args:
            user_id: 當前使用者 ID
            friendship_id: 好友關係 ID
        """
        # 查詢好友邀請
        friendship = await self.friendships.find_one({
            "_id": ObjectId(friendship_id),
            "friend_id": ObjectId(user_id),
            "status": "pending"
        })

        if not friendship:
            raise ValueError("Friend request not found")

        # 更新狀態
        await self.friendships.update_one(
            {"_id": ObjectId(friendship_id)},
            {
                "$set": {
                    "status": "rejected",
                    "rejected_at": datetime.now(timezone.utc)
                }
            }
        )

    async def remove_friend(
        self,
        user_id: str,
        friendship_id: str
    ):
        """
        移除好友

        Args:
            user_id: 當前使用者 ID
            friendship_id: 好友關係 ID
        """
        # 查詢好友關係
        friendship = await self.friendships.find_one({
            "_id": ObjectId(friendship_id),
            "$or": [
                {"user_id": ObjectId(user_id)},
                {"friend_id": ObjectId(user_id)}
            ],
            "status": "accepted"
        })

        if not friendship:
            raise ValueError("Friendship not found")

        # 刪除好友關係
        await self.friendships.delete_one({"_id": ObjectId(friendship_id)})

    async def block_user(
        self,
        user_id: str,
        blocked_user_id: str,
        reason: Optional[str] = None
    ):
        """
        T238: 封鎖機制

        封鎖指定使用者
        封鎖後對方無法搜尋到你，且會自動移除好友關係

        Args:
            user_id: 當前使用者 ID
            blocked_user_id: 被封鎖的使用者 ID
            reason: 封鎖原因（可選）
        """
        # 檢查是否已封鎖
        existing = await self.blocklist.find_one({
            "user_id": ObjectId(user_id),
            "blocked_user_id": ObjectId(blocked_user_id)
        })

        if existing:
            raise ValueError("User already blocked")

        # 建立封鎖記錄
        block = BlockListInDB(
            user_id=ObjectId(user_id),
            blocked_user_id=ObjectId(blocked_user_id),
            reason=reason,
            blocked_at=datetime.now(timezone.utc)
        )

        await self.blocklist.insert_one(block.dict(by_alias=True, exclude={"id"}))

        # 自動移除好友關係
        await self.friendships.delete_many({
            "$or": [
                {"user_id": ObjectId(user_id), "friend_id": ObjectId(blocked_user_id)},
                {"user_id": ObjectId(blocked_user_id), "friend_id": ObjectId(user_id)}
            ]
        })

    async def get_friends(
        self,
        user_id: str,
        status: str = "accepted",
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[FriendProfile], int]:
        """
        取得好友清單

        Args:
            user_id: 當前使用者 ID
            status: 好友狀態篩選
            limit: 每頁數量
            offset: 偏移量

        Returns:
            tuple: (好友列表, 總數)
        """
        # 查詢好友關係
        filter_query = {
            "$or": [
                {"user_id": ObjectId(user_id)},
                {"friend_id": ObjectId(user_id)}
            ],
            "status": status
        }

        total_count = await self.friendships.count_documents(filter_query)

        friendships_cursor = self.friendships.find(filter_query).skip(offset).limit(limit)
        friendships = await friendships_cursor.to_list(length=limit)

        # 組裝好友資料
        friends = []
        for friendship in friendships:
            # 判斷對方 ID
            if str(friendship["user_id"]) == user_id:
                friend_id = friendship["friend_id"]
            else:
                friend_id = friendship["user_id"]

            # 查詢使用者資料
            user = await self.users.find_one({"_id": friend_id})
            if not user:
                continue

            # 查詢最後運動時間與總運動次數
            last_workout = await self.workouts.find_one(
                {"user_id": friend_id, "is_deleted": False},
                sort=[("start_time", -1)]
            )

            total_workouts = await self.workouts.count_documents({
                "user_id": friend_id,
                "is_deleted": False
            })

            friends.append(FriendProfile(
                user_id=str(friend_id),
                display_name=user.get("display_name", ""),
                avatar_url=user.get("avatar_url"),
                last_workout_at=last_workout["start_time"] if last_workout else None,
                total_workouts=total_workouts,
                friendship_since=friendship.get("accepted_at") or friendship.get("invited_at") or friendship.get("created_at") or datetime.now(timezone.utc)
            ))

        return friends, total_count

    async def get_friend_requests(
        self,
        user_id: str
    ) -> List[FriendRequest]:
        """
        取得待處理的好友邀請

        Args:
            user_id: 當前使用者 ID

        Returns:
            List[FriendRequest]: 好友邀請列表
        """
        # 查詢待處理的邀請 (friend_id 是自己)
        friendships_cursor = self.friendships.find({
            "friend_id": ObjectId(user_id),
            "status": "pending"
        }).sort("invited_at", -1)

        friendships = await friendships_cursor.to_list(length=100)

        # 組裝結果
        requests = []
        for friendship in friendships:
            # 查詢發起者資料
            sender = await self.users.find_one({"_id": friendship["user_id"]})
            if not sender:
                continue

            requests.append(FriendRequest(
                friendship_id=str(friendship["_id"]),
                from_user=UserSearchResult(
                    user_id=str(sender["_id"]),
                    display_name=sender.get("display_name", ""),
                    avatar_url=sender.get("avatar_url"),
                    is_friend=False,
                    is_blocked=False
                ),
                invited_at=friendship["invited_at"]
            ))

        return requests

    # Helper methods

    async def get_blocked_users(self, user_id: str) -> List[ObjectId]:
        """取得封鎖的使用者 ID 列表"""
        blocks_cursor = self.blocklist.find({"user_id": ObjectId(user_id)})
        blocks = await blocks_cursor.to_list(length=1000)
        return [block["blocked_user_id"] for block in blocks]

    async def is_blocked(self, user_id: str, target_user_id: str) -> bool:
        """檢查是否已封鎖"""
        count = await self.blocklist.count_documents({
            "$or": [
                {"user_id": ObjectId(user_id), "blocked_user_id": ObjectId(target_user_id)},
                {"user_id": ObjectId(target_user_id), "blocked_user_id": ObjectId(user_id)}
            ]
        })
        return count > 0

    async def get_friend_ids(self, user_id: str) -> set:
        """取得好友 ID 列表"""
        friendships_cursor = self.friendships.find({
            "$or": [
                {"user_id": ObjectId(user_id)},
                {"friend_id": ObjectId(user_id)}
            ],
            "status": "accepted"
        })

        friendships = await friendships_cursor.to_list(length=1000)
        friend_ids = set()

        for friendship in friendships:
            if str(friendship["user_id"]) == user_id:
                friend_ids.add(str(friendship["friend_id"]))
            else:
                friend_ids.add(str(friendship["user_id"]))

        return friend_ids
# Reload trigger Wed, Dec 10, 2025  2:45:54 PM
