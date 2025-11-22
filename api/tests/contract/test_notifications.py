"""
T205: Notifications Contract - 通知查詢與管理測試
基於 contracts/notifications.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestNotificationsContract:
    """通知 API 契約測試"""

    # ========== GET /notifications ==========

    async def test_get_notifications_empty(self, client: AsyncClient, auth_headers: dict):
        """取得通知清單 - 空清單"""
        response = await client.get(
            "/api/v1/notifications",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        assert "unread_count" in data
        assert "total_count" in data

    async def test_get_notifications_with_type_filter(self, client: AsyncClient, auth_headers: dict):
        """取得通知清單 - 類型過濾"""
        response = await client.get(
            "/api/v1/notifications?type=friend_request",
            headers=auth_headers
        )

        assert response.status_code == 200

    async def test_get_notifications_with_read_status(self, client: AsyncClient, auth_headers: dict):
        """取得通知清單 - 已讀狀態過濾"""
        response = await client.get(
            "/api/v1/notifications?read_status=unread",
            headers=auth_headers
        )

        assert response.status_code == 200

    async def test_get_notifications_with_pagination(self, client: AsyncClient, auth_headers: dict):
        """取得通知清單 - 分頁"""
        response = await client.get(
            "/api/v1/notifications?limit=10&offset=0",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "limit" in data
        assert "offset" in data

    async def test_get_notifications_unauthorized(self, client: AsyncClient):
        """取得通知清單 - 未授權返回 401"""
        response = await client.get("/api/v1/notifications")

        assert response.status_code == 401

    # ========== POST /notifications/{id}/read ==========

    async def test_mark_notification_read(self, client: AsyncClient, auth_headers: dict):
        """標記通知為已讀"""
        notification_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/notifications/{notification_id}/read",
            headers=auth_headers
        )

        assert response.status_code in [200, 404]

    # ========== POST /notifications/read-all ==========

    async def test_mark_all_read(self, client: AsyncClient, auth_headers: dict):
        """全部標記為已讀"""
        response = await client.post(
            "/api/v1/notifications/read-all",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "marked_count" in data

    # ========== DELETE /notifications/{id} ==========

    async def test_delete_notification(self, client: AsyncClient, auth_headers: dict):
        """刪除通知"""
        notification_id = "507f1f77bcf86cd799439011"
        response = await client.delete(
            f"/api/v1/notifications/{notification_id}",
            headers=auth_headers
        )

        assert response.status_code in [204, 404]

    # ========== GET/PUT /notifications/preferences ==========

    async def test_get_preferences(self, client: AsyncClient, auth_headers: dict):
        """取得通知偏好設定"""
        response = await client.get(
            "/api/v1/notifications/preferences",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "friend_request_enabled" in data
        assert "notification_frequency" in data

    async def test_update_preferences(self, client: AsyncClient, auth_headers: dict):
        """更新通知偏好設定"""
        response = await client.put(
            "/api/v1/notifications/preferences",
            json={
                "friend_request_enabled": True,
                "notification_frequency": "daily_digest",
                "do_not_disturb_enabled": True,
                "do_not_disturb_start": "22:00",
                "do_not_disturb_end": "07:00"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notification_frequency"] == "daily_digest"

    # ========== GET /notifications/unread-count ==========

    async def test_get_unread_count(self, client: AsyncClient, auth_headers: dict):
        """取得未讀通知數量"""
        response = await client.get(
            "/api/v1/notifications/unread-count",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        assert "count_by_type" in data

    # ========== Notification Schema ==========

    async def test_notification_schema(self, client: AsyncClient, auth_headers: dict):
        """Notification schema 驗證"""
        response = await client.get(
            "/api/v1/notifications",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        for notification in data.get("notifications", []):
            assert "notification_id" in notification
            assert "user_id" in notification
            assert "notification_type" in notification
            assert notification["notification_type"] in [
                "friend_request", "friend_activity", "interaction", "challenge_update"
            ]
            assert "title" in notification
            assert "message" in notification
            assert "is_read" in notification
            assert "created_at" in notification
