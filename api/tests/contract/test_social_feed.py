"""
T200: Social Contract - 好友動態牆測試
基於 contracts/social.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestSocialFeedContract:
    """GET /social/feed 契約測試"""

    async def test_get_feed_empty(self, client: AsyncClient, auth_headers: dict):
        """取得動態牆 - 空動態牆"""
        response = await client.get(
            "/api/v1/social/feed",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert isinstance(data["activities"], list)
        assert "has_more" in data

    async def test_get_feed_with_cursor(self, client: AsyncClient, auth_headers: dict):
        """取得動態牆 - Cursor-based Pagination"""
        response = await client.get(
            "/api/v1/social/feed?cursor=test_cursor&limit=20",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert "next_cursor" in data
        assert "has_more" in data

    async def test_get_feed_with_limit(self, client: AsyncClient, auth_headers: dict):
        """取得動態牆 - 限制回傳數量"""
        response = await client.get(
            "/api/v1/social/feed?limit=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert len(data["activities"]) <= 10

    async def test_get_feed_invalid_limit(self, client: AsyncClient, auth_headers: dict):
        """取得動態牆 - 超過最大 limit"""
        response = await client.get(
            "/api/v1/social/feed?limit=100",
            headers=auth_headers
        )

        # 應該自動調整到最大值或返回錯誤
        assert response.status_code in [200, 422]

    async def test_get_feed_unauthorized(self, client: AsyncClient):
        """取得動態牆 - 未授權返回 401"""
        response = await client.get("/api/v1/social/feed")

        assert response.status_code == 401

    async def test_activity_schema(self, client: AsyncClient, auth_headers: dict):
        """取得動態牆 - Activity schema 驗證"""
        response = await client.get(
            "/api/v1/social/feed",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證回應結構
        assert "activities" in data
        assert "next_cursor" in data
        assert "has_more" in data

        # 若有動態，驗證 Activity 結構
        for activity in data.get("activities", []):
            assert "activity_id" in activity
            assert "user_id" in activity
            assert "activity_type" in activity
            assert activity["activity_type"] in ["workout", "achievement", "challenge"]
            assert "likes_count" in activity
            assert "comments_count" in activity
            assert "created_at" in activity
