"""
Firebase Cloud Messaging Helper (T274)
推播通知工具類
"""

from typing import Optional, Dict, List
from datetime import datetime, timezone
import asyncio


class FCMHelper:
    """Firebase Cloud Messaging 輔助類"""

    def __init__(self, credentials_path: Optional[str] = None):
        """
        初始化 FCM Helper

        Args:
            credentials_path: Firebase 服務帳號憑證路徑
        """
        self.credentials_path = credentials_path
        self._initialized = False

    async def initialize(self):
        """
        初始化 Firebase Admin SDK

        需要設定 FIREBASE_CREDENTIALS 環境變數或傳入憑證路徑
        """
        if self._initialized:
            return

        try:
            import firebase_admin
            from firebase_admin import credentials

            if self.credentials_path:
                cred = credentials.Certificate(self.credentials_path)
            else:
                # 使用預設憑證
                cred = credentials.ApplicationDefault()

            firebase_admin.initialize_app(cred)
            self._initialized = True

        except Exception as e:
            print(f"Failed to initialize Firebase Admin SDK: {e}")
            # 在開發環境中可以繼續運行，不拋出錯誤

    async def send_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None
    ) -> bool:
        """
        發送推播通知

        Args:
            token: FCM 裝置 token
            title: 通知標題
            body: 通知內容
            data: 額外資料 (key-value pairs)
            image_url: 通知圖片 URL

        Returns:
            bool: 是否發送成功
        """
        if not self._initialized:
            await self.initialize()

        try:
            from firebase_admin import messaging

            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url
            )

            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=token
            )

            response = messaging.send(message)
            print(f"Successfully sent message: {response}")
            return True

        except Exception as e:
            print(f"Failed to send FCM notification: {e}")
            return False

    async def send_multicast(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        批次發送推播通知

        Args:
            tokens: FCM 裝置 token 列表
            title: 通知標題
            body: 通知內容
            data: 額外資料

        Returns:
            Dict: 發送結果統計
        """
        if not self._initialized:
            await self.initialize()

        if not tokens:
            return {"success_count": 0, "failure_count": 0}

        try:
            from firebase_admin import messaging

            notification = messaging.Notification(
                title=title,
                body=body
            )

            message = messaging.MulticastMessage(
                notification=notification,
                data=data or {},
                tokens=tokens
            )

            response = messaging.send_multicast(message)

            return {
                "success_count": response.success_count,
                "failure_count": response.failure_count
            }

        except Exception as e:
            print(f"Failed to send multicast FCM: {e}")
            return {"success_count": 0, "failure_count": len(tokens)}

    async def send_topic_notification(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> bool:
        """
        發送主題通知

        Args:
            topic: 主題名稱 (e.g., "challenges", "achievements")
            title: 通知標題
            body: 通知內容
            data: 額外資料

        Returns:
            bool: 是否發送成功
        """
        if not self._initialized:
            await self.initialize()

        try:
            from firebase_admin import messaging

            notification = messaging.Notification(
                title=title,
                body=body
            )

            message = messaging.Message(
                notification=notification,
                data=data or {},
                topic=topic
            )

            response = messaging.send(message)
            print(f"Successfully sent topic message: {response}")
            return True

        except Exception as e:
            print(f"Failed to send topic FCM: {e}")
            return False

    async def subscribe_to_topic(
        self,
        tokens: List[str],
        topic: str
    ) -> bool:
        """
        訂閱主題

        Args:
            tokens: FCM 裝置 token 列表
            topic: 主題名稱

        Returns:
            bool: 是否訂閱成功
        """
        if not self._initialized:
            await self.initialize()

        try:
            from firebase_admin import messaging

            response = messaging.subscribe_to_topic(tokens, topic)
            print(f"Subscribed to topic: {response.success_count} success")
            return True

        except Exception as e:
            print(f"Failed to subscribe to topic: {e}")
            return False

    async def unsubscribe_from_topic(
        self,
        tokens: List[str],
        topic: str
    ) -> bool:
        """
        取消訂閱主題

        Args:
            tokens: FCM 裝置 token 列表
            topic: 主題名稱

        Returns:
            bool: 是否取消訂閱成功
        """
        if not self._initialized:
            await self.initialize()

        try:
            from firebase_admin import messaging

            response = messaging.unsubscribe_from_topic(tokens, topic)
            print(f"Unsubscribed from topic: {response.success_count} success")
            return True

        except Exception as e:
            print(f"Failed to unsubscribe from topic: {e}")
            return False


# 單例實例
fcm_helper = FCMHelper()


# 便捷函數
async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[Dict] = None
) -> bool:
    """發送推播通知的便捷函數"""
    return await fcm_helper.send_notification(token, title, body, data)


async def send_multicast_notification(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict] = None
) -> Dict:
    """批次發送推播通知的便捷函數"""
    return await fcm_helper.send_multicast(tokens, title, body, data)
