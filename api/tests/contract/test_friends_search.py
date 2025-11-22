"""
T197: Friends Contract - 搜尋好友端點測試
基於 contracts/friends.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestFriendsSearchContract:
    """POST /friends/search 契約測試"""

    async def test_search_by_email_success(self, client: AsyncClient, auth_headers: dict):
        """搜尋好友 - Email 搜尋成功"""
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "email", "query": "friend@example.com"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)

    async def test_search_by_user_id_success(self, client: AsyncClient, auth_headers: dict):
        """搜尋好友 - User ID 搜尋成功"""
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "user_id", "query": "507f1f77bcf86cd799439011"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    async def test_search_by_qrcode_success(self, client: AsyncClient, auth_headers: dict):
        """搜尋好友 - QR Code 搜尋成功"""
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "qrcode", "query": "MOTIONSTORY:user123"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data

    async def test_search_invalid_query_type(self, client: AsyncClient, auth_headers: dict):
        """搜尋好友 - 無效的搜尋類型返回 400"""
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "invalid_type", "query": "test"},
            headers=auth_headers
        )

        assert response.status_code == 400

    async def test_search_missing_query(self, client: AsyncClient, auth_headers: dict):
        """搜尋好友 - 缺少 query 參數返回 400"""
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "email"},
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation Error

    async def test_search_unauthorized(self, client: AsyncClient):
        """搜尋好友 - 未授權返回 401"""
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "email", "query": "test@example.com"}
        )

        assert response.status_code == 401

    async def test_search_result_schema(self, client: AsyncClient, auth_headers: dict):
        """搜尋好友 - 結果符合 UserSearchResult schema"""
        # 先建立一個可搜尋到的使用者
        response = await client.post(
            "/api/v1/friends/search",
            json={"query_type": "email", "query": "test@example.com"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證結果結構
        for result in data.get("results", []):
            assert "user_id" in result
            assert "display_name" in result
            assert "is_friend" in result
            assert "is_blocked" in result
