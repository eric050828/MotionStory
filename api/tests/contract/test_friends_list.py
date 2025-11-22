"""
T199: Friends Contract - 好友清單查詢測試
基於 contracts/friends.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestFriendsListContract:
    """GET /friends 契約測試"""

    async def test_get_friends_empty(self, client: AsyncClient, auth_headers: dict):
        """取得好友清單 - 空清單"""
        response = await client.get(
            "/api/v1/friends",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "friends" in data
        assert isinstance(data["friends"], list)
        assert "total_count" in data
        assert data["total_count"] == 0

    async def test_get_friends_with_status_filter(self, client: AsyncClient, auth_headers: dict):
        """取得好友清單 - 狀態過濾"""
        response = await client.get(
            "/api/v1/friends?status=accepted",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "friends" in data

    async def test_get_friends_with_pagination(self, client: AsyncClient, auth_headers: dict):
        """取得好友清單 - 分頁參數"""
        response = await client.get(
            "/api/v1/friends?limit=10&offset=0",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "limit" in data
        assert "offset" in data
        assert data["limit"] == 10
        assert data["offset"] == 0

    async def test_get_friends_invalid_status(self, client: AsyncClient, auth_headers: dict):
        """取得好友清單 - 無效的狀態參數"""
        response = await client.get(
            "/api/v1/friends?status=invalid",
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation Error

    async def test_get_friends_unauthorized(self, client: AsyncClient):
        """取得好友清單 - 未授權返回 401"""
        response = await client.get("/api/v1/friends")

        assert response.status_code == 401

    async def test_get_friend_requests_empty(self, client: AsyncClient, auth_headers: dict):
        """取得待處理邀請 - 空清單"""
        response = await client.get(
            "/api/v1/friends/requests",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        assert isinstance(data["requests"], list)

    async def test_friend_profile_schema(self, client: AsyncClient, auth_headers: dict):
        """好友清單 - FriendProfile schema 驗證"""
        response = await client.get(
            "/api/v1/friends",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證回應結構
        assert "friends" in data
        assert "total_count" in data
        assert "limit" in data
        assert "offset" in data

        # 若有好友，驗證 FriendProfile 結構
        for friend in data.get("friends", []):
            assert "user_id" in friend
            assert "display_name" in friend
            assert "friendship_since" in friend
