"""
T204: Challenges Contract - 挑戰排行榜測試
基於 contracts/challenges.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestChallengesLeaderboardContract:
    """GET /challenges/{id}/leaderboard 契約測試"""

    async def test_get_leaderboard_success(self, client: AsyncClient, auth_headers: dict):
        """取得挑戰排行榜 - 成功"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.get(
            f"/api/v1/challenges/{challenge_id}/leaderboard",
            headers=auth_headers
        )

        # 可能 404 或 200
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "challenge_id" in data
            assert "participants" in data
            assert isinstance(data["participants"], list)

    async def test_get_leaderboard_unauthorized(self, client: AsyncClient):
        """取得挑戰排行榜 - 未授權返回 401"""
        response = await client.get("/api/v1/challenges/test_id/leaderboard")

        assert response.status_code == 401

    async def test_get_leaderboard_not_found(self, client: AsyncClient, auth_headers: dict):
        """取得挑戰排行榜 - 挑戰不存在返回 404"""
        response = await client.get(
            "/api/v1/challenges/nonexistent_id/leaderboard",
            headers=auth_headers
        )

        assert response.status_code == 404

    async def test_leaderboard_schema(self, client: AsyncClient, auth_headers: dict):
        """取得挑戰排行榜 - Schema 驗證"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.get(
            f"/api/v1/challenges/{challenge_id}/leaderboard",
            headers=auth_headers
        )

        if response.status_code == 200:
            data = response.json()
            assert "challenge_id" in data
            assert "challenge_type" in data
            assert "target_value" in data
            assert "participants" in data
            assert "last_updated" in data

            # 驗證 LeaderboardEntry schema
            for entry in data.get("participants", []):
                assert "rank" in entry
                assert "user_id" in entry
                assert "display_name" in entry
                assert "current_progress" in entry
                assert "completion_percentage" in entry

    async def test_get_challenge_detail(self, client: AsyncClient, auth_headers: dict):
        """取得挑戰詳情 - GET /challenges/{id}"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.get(
            f"/api/v1/challenges/{challenge_id}",
            headers=auth_headers
        )

        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "challenge_id" in data
            assert "challenge_type" in data
            assert "target_value" in data

    async def test_get_challenges_list(self, client: AsyncClient, auth_headers: dict):
        """取得挑戰清單 - GET /challenges"""
        response = await client.get(
            "/api/v1/challenges",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "challenges" in data
        assert "total_count" in data

    async def test_get_challenges_with_filter(self, client: AsyncClient, auth_headers: dict):
        """取得挑戰清單 - 狀態過濾"""
        response = await client.get(
            "/api/v1/challenges?status=active&role=all",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "challenges" in data

    async def test_delete_challenge(self, client: AsyncClient, auth_headers: dict):
        """刪除挑戰賽 - DELETE /challenges/{id}"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.delete(
            f"/api/v1/challenges/{challenge_id}",
            headers=auth_headers
        )

        # 可能 204/403/404
        assert response.status_code in [204, 403, 404]
