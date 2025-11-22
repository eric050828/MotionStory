"""
T202: Challenges Contract - 創建挑戰賽測試
基於 contracts/challenges.yaml 定義
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


@pytest.mark.asyncio
class TestChallengesCreateContract:
    """POST /challenges 契約測試"""

    async def test_create_challenge_success(self, client: AsyncClient, auth_headers: dict):
        """創建挑戰賽 - 成功"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
        end_date = (datetime.utcnow() + timedelta(days=8)).isoformat() + "Z"

        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "total_distance",
                "target_value": 100,
                "start_date": start_date,
                "end_date": end_date,
                "privacy": "private"
            },
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert "challenge_id" in data
        assert data["challenge_type"] == "total_distance"
        assert data["target_value"] == 100

    async def test_create_challenge_with_invites(self, client: AsyncClient, auth_headers: dict):
        """創建挑戰賽 - 含邀請好友"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
        end_date = (datetime.utcnow() + timedelta(days=8)).isoformat() + "Z"

        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "total_duration",
                "target_value": 600,
                "start_date": start_date,
                "end_date": end_date,
                "privacy": "private",
                "invited_users": ["507f1f77bcf86cd799439011"]
            },
            headers=auth_headers
        )

        assert response.status_code == 201

    async def test_create_challenge_too_short(self, client: AsyncClient, auth_headers: dict):
        """創建挑戰賽 - 時間太短 (< 3 天)"""
        start_date = datetime.utcnow().isoformat() + "Z"
        end_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"

        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "total_distance",
                "target_value": 50,
                "start_date": start_date,
                "end_date": end_date
            },
            headers=auth_headers
        )

        assert response.status_code == 400

    async def test_create_challenge_too_long(self, client: AsyncClient, auth_headers: dict):
        """創建挑戰賽 - 時間太長 (> 90 天)"""
        start_date = datetime.utcnow().isoformat() + "Z"
        end_date = (datetime.utcnow() + timedelta(days=100)).isoformat() + "Z"

        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "total_distance",
                "target_value": 500,
                "start_date": start_date,
                "end_date": end_date
            },
            headers=auth_headers
        )

        assert response.status_code == 400

    async def test_create_challenge_invalid_type(self, client: AsyncClient, auth_headers: dict):
        """創建挑戰賽 - 無效的挑戰類型"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
        end_date = (datetime.utcnow() + timedelta(days=8)).isoformat() + "Z"

        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "invalid_type",
                "target_value": 100,
                "start_date": start_date,
                "end_date": end_date
            },
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_create_challenge_unauthorized(self, client: AsyncClient):
        """創建挑戰賽 - 未授權返回 401"""
        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "total_distance",
                "target_value": 100,
                "start_date": "2025-01-01T00:00:00Z",
                "end_date": "2025-01-10T00:00:00Z"
            }
        )

        assert response.status_code == 401

    async def test_challenge_schema(self, client: AsyncClient, auth_headers: dict):
        """創建挑戰賽 - Challenge schema 驗證"""
        start_date = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
        end_date = (datetime.utcnow() + timedelta(days=8)).isoformat() + "Z"

        response = await client.post(
            "/api/v1/challenges",
            json={
                "challenge_type": "consecutive_days",
                "target_value": 7,
                "start_date": start_date,
                "end_date": end_date,
                "privacy": "public"
            },
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()

        assert "challenge_id" in data
        assert "creator_id" in data
        assert "challenge_type" in data
        assert "target_value" in data
        assert "start_date" in data
        assert "end_date" in data
        assert "privacy" in data
        assert "status" in data
        assert data["status"] in ["upcoming", "active", "completed"]
        assert "participant_count" in data
        assert "created_at" in data
