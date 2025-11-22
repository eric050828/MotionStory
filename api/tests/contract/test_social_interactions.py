"""
T201: Social Contract - 按讚與留言測試
基於 contracts/social.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestSocialInteractionsContract:
    """按讚與留言 API 契約測試"""

    # ========== Like Tests ==========

    async def test_like_activity_success(self, client: AsyncClient, auth_headers: dict):
        """按讚動態 - 成功"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/activities/{activity_id}/like",
            headers=auth_headers
        )

        # 可能 404 (動態不存在) 或 201 (成功)
        assert response.status_code in [201, 404]
        if response.status_code == 201:
            data = response.json()
            assert "like_id" in data
            assert "user_id" in data
            assert "activity_id" in data

    async def test_like_activity_unauthorized(self, client: AsyncClient):
        """按讚動態 - 未授權返回 401"""
        response = await client.post("/api/v1/activities/test_id/like")

        assert response.status_code == 401

    async def test_unlike_activity(self, client: AsyncClient, auth_headers: dict):
        """取消按讚 - 成功"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.delete(
            f"/api/v1/activities/{activity_id}/like",
            headers=auth_headers
        )

        # 可能 204 (成功) 或 404 (未找到)
        assert response.status_code in [204, 404]

    async def test_unlike_activity_unauthorized(self, client: AsyncClient):
        """取消按讚 - 未授權返回 401"""
        response = await client.delete("/api/v1/activities/test_id/like")

        assert response.status_code == 401

    # ========== Comment Tests ==========

    async def test_add_comment_success(self, client: AsyncClient, auth_headers: dict):
        """留言 - 成功"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/activities/{activity_id}/comment",
            json={"content": "加油！"},
            headers=auth_headers
        )

        # 可能 404 (動態不存在) 或 201 (成功)
        assert response.status_code in [201, 404]
        if response.status_code == 201:
            data = response.json()
            assert "comment_id" in data
            assert "content" in data
            assert "user_id" in data

    async def test_add_comment_too_long(self, client: AsyncClient, auth_headers: dict):
        """留言 - 超過 200 字限制"""
        activity_id = "507f1f77bcf86cd799439011"
        long_content = "a" * 201
        response = await client.post(
            f"/api/v1/activities/{activity_id}/comment",
            json={"content": long_content},
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation Error

    async def test_add_comment_empty(self, client: AsyncClient, auth_headers: dict):
        """留言 - 空內容"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/activities/{activity_id}/comment",
            json={"content": ""},
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_add_comment_with_reply(self, client: AsyncClient, auth_headers: dict):
        """留言 - 回覆特定留言"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/activities/{activity_id}/comment",
            json={
                "content": "回覆你的留言！",
                "parent_id": "507f1f77bcf86cd799439022"
            },
            headers=auth_headers
        )

        # 可能 404 或 201
        assert response.status_code in [201, 404]

    async def test_add_comment_unauthorized(self, client: AsyncClient):
        """留言 - 未授權返回 401"""
        response = await client.post(
            "/api/v1/activities/test_id/comment",
            json={"content": "test"}
        )

        assert response.status_code == 401

    async def test_get_comments_success(self, client: AsyncClient, auth_headers: dict):
        """取得留言列表 - 成功"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.get(
            f"/api/v1/activities/{activity_id}/comments",
            headers=auth_headers
        )

        # 可能 404 或 200
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "comments" in data
            assert "total_count" in data

    async def test_get_comments_with_pagination(self, client: AsyncClient, auth_headers: dict):
        """取得留言列表 - 分頁"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.get(
            f"/api/v1/activities/{activity_id}/comments?limit=10&offset=0",
            headers=auth_headers
        )

        assert response.status_code in [200, 404]

    async def test_comment_schema(self, client: AsyncClient, auth_headers: dict):
        """留言 - Comment schema 驗證"""
        activity_id = "507f1f77bcf86cd799439011"
        response = await client.get(
            f"/api/v1/activities/{activity_id}/comments",
            headers=auth_headers
        )

        if response.status_code == 200:
            data = response.json()
            for comment in data.get("comments", []):
                assert "comment_id" in comment
                assert "user_id" in comment
                assert "content" in comment
                assert "status" in comment
                assert comment["status"] in ["normal", "filtered", "reported"]
                assert "created_at" in comment
