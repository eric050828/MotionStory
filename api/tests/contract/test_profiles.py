"""
T207: Profiles Contract - 個人檔案公開化測試
基於 contracts/profiles.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestProfilesContract:
    """個人檔案 API 契約測試"""

    # ========== GET /profiles/me ==========

    async def test_get_my_profile_success(self, client: AsyncClient, auth_headers: dict):
        """取得個人檔案 - 成功"""
        response = await client.get(
            "/api/v1/profiles/me",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "display_name" in data

    async def test_get_my_profile_unauthorized(self, client: AsyncClient):
        """取得個人檔案 - 未授權返回 401"""
        response = await client.get("/api/v1/profiles/me")

        assert response.status_code == 401

    # ========== PUT /profiles/me ==========

    async def test_update_my_profile_success(self, client: AsyncClient, auth_headers: dict):
        """更新個人檔案 - 成功"""
        response = await client.put(
            "/api/v1/profiles/me",
            json={
                "display_name": "Updated Name",
                "bio": "Marathon runner",
                "sport_tags": ["跑步", "健身"],
                "privacy_level": "friends_only"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Updated Name"

    async def test_update_profile_bio_too_long(self, client: AsyncClient, auth_headers: dict):
        """更新個人檔案 - Bio 超過 100 字"""
        response = await client.put(
            "/api/v1/profiles/me",
            json={
                "bio": "a" * 101
            },
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_update_profile_too_many_tags(self, client: AsyncClient, auth_headers: dict):
        """更新個人檔案 - 運動標籤超過 5 個"""
        response = await client.put(
            "/api/v1/profiles/me",
            json={
                "sport_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
            },
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_update_profile_invalid_privacy(self, client: AsyncClient, auth_headers: dict):
        """更新個人檔案 - 無效的隱私層級"""
        response = await client.put(
            "/api/v1/profiles/me",
            json={
                "privacy_level": "invalid"
            },
            headers=auth_headers
        )

        assert response.status_code == 422

    # ========== GET /profiles/{user_id} ==========

    async def test_get_user_profile_success(self, client: AsyncClient, auth_headers: dict, test_user_id: str):
        """查看他人檔案 - 成功"""
        response = await client.get(
            f"/api/v1/profiles/{test_user_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "display_name" in data
        assert "is_friend" in data

    async def test_get_user_profile_not_found(self, client: AsyncClient, auth_headers: dict):
        """查看他人檔案 - 使用者不存在"""
        response = await client.get(
            "/api/v1/profiles/nonexistent_user_id",
            headers=auth_headers
        )

        assert response.status_code == 404

    # ========== Profile Schema ==========

    async def test_profile_schema(self, client: AsyncClient, auth_headers: dict):
        """個人檔案 - Profile schema 驗證"""
        response = await client.get(
            "/api/v1/profiles/me",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "user_id" in data
        assert "display_name" in data
        assert "privacy_level" in data
        assert data["privacy_level"] in ["public", "friends_only", "private"]

    async def test_public_profile_schema(self, client: AsyncClient, auth_headers: dict, test_user_id: str):
        """公開檔案 - PublicProfile schema 驗證"""
        response = await client.get(
            f"/api/v1/profiles/{test_user_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "user_id" in data
        assert "display_name" in data
        assert "privacy_level" in data
        assert "is_friend" in data
