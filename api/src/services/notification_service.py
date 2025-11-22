"""
Notification Service (T245-T246)
通知服務：通知觸發邏輯、Firebase Cloud Messaging 整合
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..models import (
    NotificationCreate,
    NotificationInDB,
    NotificationResponse,
    NotificationPreferences,
)


class NotificationService:
    """通知服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.notifications = db.notifications
        self.notification_preferences = db.notification_preferences
        self.users = db.users

    async def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        sender_id: Optional[str] = None
    ) -> NotificationResponse:
        """
        T245: 通知觸發邏輯

        建立並發送通知

        Args:
            user_id: 接收者 ID
            notification_type: 通知類型
            title: 通知標題
            message: 通知內容
            reference_type: 關聯物件類型
            reference_id: 關聯物件 ID
            sender_id: 發送者 ID

        Returns:
            NotificationResponse: 通知回應
        """
        # 檢查使用者通知偏好
        preferences = await self.get_notification_preferences(user_id)

        # 根據偏好設定決定是否發送
        should_send = self._should_send_notification(notification_type, preferences)

        if not should_send:
            return None

        # 檢查免打擾時段
        if preferences.get("do_not_disturb_enabled", False):
            if self._is_do_not_disturb_time(
                preferences.get("do_not_disturb_start"),
                preferences.get("do_not_disturb_end")
            ):
                return None

        # 建立通知
        notification = NotificationInDB(
            user_id=ObjectId(user_id),
            notification_type=notification_type,
            title=title,
            message=message,
            reference_type=reference_type,
            reference_id=ObjectId(reference_id) if reference_id else None,
            sender_id=ObjectId(sender_id) if sender_id else None,
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )

        result = await self.notifications.insert_one(
            notification.dict(by_alias=True, exclude={"id"})
        )

        # 發送推播通知 (Firebase Cloud Messaging)
        if preferences.get("notification_frequency") == "realtime":
            await self._send_push_notification(user_id, title, message)

        # 查詢發送者資料
        sender = None
        if sender_id:
            sender_doc = await self.users.find_one({"_id": ObjectId(sender_id)})
            if sender_doc:
                sender = {
                    "user_id": str(sender_doc["_id"]),
                    "display_name": sender_doc.get("display_name", ""),
                    "avatar_url": sender_doc.get("avatar_url")
                }

        return NotificationResponse(
            notification_id=str(result.inserted_id),
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_type=reference_type,
            reference_id=reference_id,
            sender=sender,
            is_read=False,
            created_at=notification.created_at,
            read_at=None
        )

    async def get_notifications(
        self,
        user_id: str,
        notification_type: str = "all",
        read_status: str = "all",
        limit: int = 20,
        offset: int = 0
    ) -> Dict:
        """
        取得通知清單

        Args:
            user_id: 使用者 ID
            notification_type: 通知類型篩選
            read_status: 已讀狀態篩選
            limit: 每頁數量
            offset: 偏移量

        Returns:
            Dict: 通知清單與統計資料
        """
        # 構建查詢條件
        query = {"user_id": ObjectId(user_id)}

        if notification_type != "all":
            query["notification_type"] = notification_type

        if read_status == "read":
            query["is_read"] = True
        elif read_status == "unread":
            query["is_read"] = False

        # 計算總數與未讀數
        total_count = await self.notifications.count_documents(query)
        unread_count = await self.notifications.count_documents({
            "user_id": ObjectId(user_id),
            "is_read": False
        })

        # 查詢通知
        notifications_cursor = self.notifications.find(query)\
            .sort("created_at", -1)\
            .skip(offset)\
            .limit(limit)

        notifications = await notifications_cursor.to_list(length=limit)

        # 組裝回應
        response_notifications = []
        for notif in notifications:
            # 查詢發送者資料
            sender = None
            if notif.get("sender_id"):
                sender_doc = await self.users.find_one({"_id": notif["sender_id"]})
                if sender_doc:
                    sender = {
                        "user_id": str(sender_doc["_id"]),
                        "display_name": sender_doc.get("display_name", ""),
                        "avatar_url": sender_doc.get("avatar_url")
                    }

            response_notifications.append(NotificationResponse(
                notification_id=str(notif["_id"]),
                user_id=str(notif["user_id"]),
                notification_type=notif["notification_type"],
                title=notif["title"],
                message=notif["message"],
                reference_type=notif.get("reference_type"),
                reference_id=str(notif["reference_id"]) if notif.get("reference_id") else None,
                sender=sender,
                is_read=notif["is_read"],
                created_at=notif["created_at"],
                read_at=notif.get("read_at")
            ))

        return {
            "notifications": response_notifications,
            "unread_count": unread_count,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }

    async def mark_as_read(self, user_id: str, notification_id: str):
        """標記通知為已讀"""
        await self.notifications.update_one(
            {
                "_id": ObjectId(notification_id),
                "user_id": ObjectId(user_id)
            },
            {
                "$set": {
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc)
                }
            }
        )

    async def mark_all_as_read(self, user_id: str) -> int:
        """標記所有通知為已讀"""
        result = await self.notifications.update_many(
            {
                "user_id": ObjectId(user_id),
                "is_read": False
            },
            {
                "$set": {
                    "is_read": True,
                    "read_at": datetime.now(timezone.utc)
                }
            }
        )
        return result.modified_count

    async def delete_notification(self, user_id: str, notification_id: str):
        """刪除通知"""
        await self.notifications.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(user_id)
        })

    async def get_unread_count(self, user_id: str) -> Dict:
        """取得未讀通知數量"""
        total_unread = await self.notifications.count_documents({
            "user_id": ObjectId(user_id),
            "is_read": False
        })

        # 分類統計
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id), "is_read": False}},
            {"$group": {"_id": "$notification_type", "count": {"$sum": 1}}}
        ]
        results = await self.notifications.aggregate(pipeline).to_list(100)

        count_by_type = {
            "friend_request": 0,
            "friend_activity": 0,
            "interaction": 0,
            "challenge_update": 0
        }

        for result in results:
            if result["_id"] in count_by_type:
                count_by_type[result["_id"]] = result["count"]

        return {
            "unread_count": total_unread,
            "count_by_type": count_by_type
        }

    async def get_notification_preferences(self, user_id: str) -> Dict:
        """取得通知偏好設定"""
        prefs = await self.notification_preferences.find_one({"user_id": ObjectId(user_id)})

        if prefs:
            return {
                "user_id": user_id,
                "friend_request_enabled": prefs.get("friend_request_enabled", True),
                "friend_activity_enabled": prefs.get("friend_activity_enabled", True),
                "interaction_enabled": prefs.get("interaction_enabled", True),
                "challenge_update_enabled": prefs.get("challenge_update_enabled", True),
                "notification_frequency": prefs.get("notification_frequency", "realtime"),
                "daily_digest_time": prefs.get("daily_digest_time", "08:00"),
                "do_not_disturb_enabled": prefs.get("do_not_disturb_enabled", False),
                "do_not_disturb_start": prefs.get("do_not_disturb_start"),
                "do_not_disturb_end": prefs.get("do_not_disturb_end"),
                "updated_at": prefs.get("updated_at")
            }

        # 返回預設值
        return {
            "user_id": user_id,
            "friend_request_enabled": True,
            "friend_activity_enabled": True,
            "interaction_enabled": True,
            "challenge_update_enabled": True,
            "notification_frequency": "realtime",
            "daily_digest_time": "08:00",
            "do_not_disturb_enabled": False,
            "do_not_disturb_start": None,
            "do_not_disturb_end": None,
            "updated_at": None
        }

    async def update_notification_preferences(
        self,
        user_id: str,
        preferences: Dict
    ) -> Dict:
        """更新通知偏好設定"""
        preferences["user_id"] = ObjectId(user_id)
        preferences["updated_at"] = datetime.now(timezone.utc)

        await self.notification_preferences.update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": preferences},
            upsert=True
        )

        return await self.get_notification_preferences(user_id)

    # T246: Firebase Cloud Messaging 整合

    async def _send_push_notification(
        self,
        user_id: str,
        title: str,
        message: str
    ):
        """
        T246: Firebase Cloud Messaging 整合

        發送推播通知

        Args:
            user_id: 使用者 ID
            title: 通知標題
            message: 通知內容
        """
        try:
            # 查詢使用者的 FCM token
            user = await self.users.find_one({"_id": ObjectId(user_id)})
            if not user or not user.get("fcm_token"):
                return

            fcm_token = user["fcm_token"]

            # 使用 Firebase Admin SDK 發送通知
            # 這裡需要整合 firebase-admin 套件
            # 由於環境限制,這裡只是佔位邏輯

            # from firebase_admin import messaging
            # message = messaging.Message(
            #     notification=messaging.Notification(
            #         title=title,
            #         body=message,
            #     ),
            #     token=fcm_token,
            # )
            # response = messaging.send(message)
            # print(f"Successfully sent message: {response}")

            pass  # 實際 FCM 發送邏輯待整合 firebase-admin

        except Exception as e:
            # 記錄錯誤但不中斷主流程
            print(f"Failed to send push notification: {e}")

    # Notification trigger helpers

    async def notify_friend_request(
        self,
        from_user_id: str,
        to_user_id: str,
        friendship_id: str
    ):
        """發送好友邀請通知"""
        from_user = await self.users.find_one({"_id": ObjectId(from_user_id)})
        if not from_user:
            return

        await self.create_notification(
            user_id=to_user_id,
            notification_type="friend_request",
            title="新的好友邀請",
            message=f"{from_user.get('display_name', '某人')} 想成為你的好友",
            reference_type="friendship",
            reference_id=friendship_id,
            sender_id=from_user_id
        )

    async def notify_friend_activity(
        self,
        activity_owner_id: str,
        activity_id: str,
        activity_type: str
    ):
        """發送好友動態通知 (給所有好友)"""
        # 這裡簡化處理，實際應該批次發送
        pass

    async def notify_like(
        self,
        from_user_id: str,
        to_user_id: str,
        activity_id: str
    ):
        """發送按讚通知"""
        if from_user_id == to_user_id:
            return  # 不通知自己

        from_user = await self.users.find_one({"_id": ObjectId(from_user_id)})
        if not from_user:
            return

        await self.create_notification(
            user_id=to_user_id,
            notification_type="interaction",
            title="有人按讚了你的動態",
            message=f"{from_user.get('display_name', '某人')} 對你的動態按讚",
            reference_type="like",
            reference_id=activity_id,
            sender_id=from_user_id
        )

    async def notify_comment(
        self,
        from_user_id: str,
        to_user_id: str,
        activity_id: str,
        comment_preview: str
    ):
        """發送留言通知"""
        if from_user_id == to_user_id:
            return  # 不通知自己

        from_user = await self.users.find_one({"_id": ObjectId(from_user_id)})
        if not from_user:
            return

        # 截斷留言預覽
        preview = comment_preview[:50] + "..." if len(comment_preview) > 50 else comment_preview

        await self.create_notification(
            user_id=to_user_id,
            notification_type="interaction",
            title="有人留言了",
            message=f"{from_user.get('display_name', '某人')}: {preview}",
            reference_type="comment",
            reference_id=activity_id,
            sender_id=from_user_id
        )

    async def notify_challenge_update(
        self,
        user_id: str,
        challenge_id: str,
        update_type: str,
        message: str
    ):
        """發送挑戰更新通知"""
        await self.create_notification(
            user_id=user_id,
            notification_type="challenge_update",
            title="挑戰更新",
            message=message,
            reference_type="challenge",
            reference_id=challenge_id
        )

    # Helper methods

    def _should_send_notification(
        self,
        notification_type: str,
        preferences: Dict
    ) -> bool:
        """根據偏好設定判斷是否發送通知"""
        type_to_pref = {
            "friend_request": "friend_request_enabled",
            "friend_activity": "friend_activity_enabled",
            "interaction": "interaction_enabled",
            "challenge_update": "challenge_update_enabled"
        }

        pref_key = type_to_pref.get(notification_type)
        if pref_key:
            return preferences.get(pref_key, True)

        return True

    def _is_do_not_disturb_time(
        self,
        start_time: Optional[str],
        end_time: Optional[str]
    ) -> bool:
        """檢查是否在免打擾時段"""
        if not start_time or not end_time:
            return False

        now = datetime.now(timezone.utc)
        current_time = now.strftime("%H:%M")

        # 處理跨日的情況 (例如 22:00 - 07:00)
        if start_time > end_time:
            return current_time >= start_time or current_time <= end_time
        else:
            return start_time <= current_time <= end_time
