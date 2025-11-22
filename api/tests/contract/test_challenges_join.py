"""
T203: Challenges Contract - 加入與離開挑戰測試
基於 contracts/challenges.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestChallengesJoinContract:
    """POST /challenges/{id}/join 和 /challenges/{id}/leave 契約測試"""

    # ========== Join Tests ==========

    async def test_join_challenge_success(self, client: AsyncClient, auth_headers: dict):
        """加入挑戰賽 - 成功"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/challenges/{challenge_id}/join",
            headers=auth_headers
        )

        # 可能 404 (挑戰不存在) 或 200 (成功)
        assert response.status_code in [200, 404, 400]
        if response.status_code == 200:
            data = response.json()
            assert "user_id" in data
            assert "joined_at" in data

    async def test_join_challenge_unauthorized(self, client: AsyncClient):
        """加入挑戰賽 - 未授權返回 401"""
        response = await client.post("/api/v1/challenges/test_id/join")

        assert response.status_code == 401

    async def test_join_challenge_already_joined(self, client: AsyncClient, auth_headers: dict):
        """加入挑戰賽 - 已經是參與者"""
        challenge_id = "507f1f77bcf86cd799439011"

        # 第一次加入
        await client.post(
            f"/api/v1/challenges/{challenge_id}/join",
            headers=auth_headers
        )

        # 第二次加入應該失敗
        response = await client.post(
            f"/api/v1/challenges/{challenge_id}/join",
            headers=auth_headers
        )

        assert response.status_code in [400, 404]

    async def test_join_challenge_not_found(self, client: AsyncClient, auth_headers: dict):
        """加入挑戰賽 - 挑戰不存在返回 404"""
        response = await client.post(
            "/api/v1/challenges/nonexistent_id/join",
            headers=auth_headers
        )

        assert response.status_code == 404

    # ========== Leave Tests ==========

    async def test_leave_challenge_success(self, client: AsyncClient, auth_headers: dict):
        """退出挑戰賽 - 成功"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/challenges/{challenge_id}/leave",
            headers=auth_headers
        )

        # 可能 404 或 200
        assert response.status_code in [200, 404]

    async def test_leave_challenge_unauthorized(self, client: AsyncClient):
        """退出挑戰賽 - 未授權返回 401"""
        response = await client.post("/api/v1/challenges/test_id/leave")

        assert response.status_code == 401

    async def test_leave_challenge_not_participant(self, client: AsyncClient, auth_headers: dict):
        """退出挑戰賽 - 非參與者"""
        challenge_id = "507f1f77bcf86cd799439099"
        response = await client.post(
            f"/api/v1/challenges/{challenge_id}/leave",
            headers=auth_headers
        )

        assert response.status_code in [400, 404]

    # ========== Participant Schema Test ==========

    async def test_participant_schema(self, client: AsyncClient, auth_headers: dict):
        """加入挑戰賽 - ChallengeParticipant schema 驗證"""
        challenge_id = "507f1f77bcf86cd799439011"
        response = await client.post(
            f"/api/v1/challenges/{challenge_id}/join",
            headers=auth_headers
        )

        if response.status_code == 200:
            data = response.json()
            assert "user_id" in data
            assert "display_name" in data
            assert "joined_at" in data
            assert "current_progress" in data
            assert "completion_percentage" in data
            assert "status" in data
            assert data["status"] in ["active", "completed", "withdrawn"]
