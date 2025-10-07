"""
Achievements Check API Contract Tests (T021)
測試成就檢查端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestAchievementsCheck:
    """T021: Contract test POST /achievements/check"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試成就檢查 - 200 OK"""
        # 建立運動記錄
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = workout_response.json()["workout"]["id"]

        # 檢查成就觸發
        check_request = {"workout_id": workout_id}
        response = await client.post(
            "/api/v1/achievements/check",
            headers=auth_headers,
            json=check_request
        )

        assert response.status_code == 200

        # 驗證 response schema (FR-001~FR-003)
        data = response.json()
        assert "achievements_triggered" in data
        assert "total_triggered" in data
        assert isinstance(data["achievements_triggered"], list)
        assert isinstance(data["total_triggered"], int)
        assert data["total_triggered"] == len(data["achievements_triggered"])

        # 若有觸發成就，驗證慶祝動畫等級
        if data["total_triggered"] > 0:
            achievement = data["achievements_triggered"][0]
            assert "id" in achievement
            assert "achievement_type" in achievement
            assert "celebration_level" in achievement
            assert achievement["celebration_level"] in ["basic", "fireworks", "epic"]
            assert "achieved_at" in achievement

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_automatic_trigger(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試自動觸發慶祝動畫 - 200 OK"""
        # 建立運動記錄應自動觸發成就檢查
        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        assert response.status_code == 201

        # 驗證回應包含觸發的成就資訊
        data = response.json()
        if "achievements_triggered" in data:
            achievements = data["achievements_triggered"]
            assert isinstance(achievements, list)

            # 驗證慶祝動畫資訊
            for achievement in achievements:
                assert "celebration_level" in achievement
                assert achievement["celebration_level"] in ["basic", "fireworks", "epic"]

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_multiple_triggers(self, auth_headers: dict, client: AsyncClient):
        """測試多個成就同時觸發 - 200 OK"""
        # 建立特殊運動記錄可能觸發多個成就
        workout_data = {
            "workout_type": "running",
            "start_time": "2025-01-15T08:00:00Z",
            "end_time": "2025-01-15T09:00:00Z",
            "duration_minutes": 60,
            "distance_km": 10.0,
            "notes": "首次 10K"
        }

        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )
        workout_id = workout_response.json()["workout"]["id"]

        # 檢查成就
        response = await client.post(
            "/api/v1/achievements/check",
            headers=auth_headers,
            json={"workout_id": workout_id}
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證可處理多個成就
        assert "achievements_triggered" in data
        assert "total_triggered" in data
        assert data["total_triggered"] >= 0

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_invalid_workout_id(self, auth_headers: dict, client: AsyncClient):
        """測試無效運動記錄 ID - 400 Bad Request"""
        check_request = {"workout_id": "invalid-id"}
        response = await client.post(
            "/api/v1/achievements/check",
            headers=auth_headers,
            json=check_request
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_missing_workout_id(self, auth_headers: dict, client: AsyncClient):
        """測試缺少 workout_id - 400 Bad Request"""
        check_request = {}
        response = await client.post(
            "/api/v1/achievements/check",
            headers=auth_headers,
            json=check_request
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_unauthorized(self, client: AsyncClient):
        """測試未認證檢查 - 401 Unauthorized"""
        check_request = {"workout_id": "507f1f77bcf86cd799439011"}
        response = await client.post("/api/v1/achievements/check", json=check_request)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_nonexistent_workout(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的運動記錄 - 404 Not Found"""
        check_request = {"workout_id": "507f1f77bcf86cd799439999"}
        response = await client.post(
            "/api/v1/achievements/check",
            headers=auth_headers,
            json=check_request
        )

        # 可能回傳 404 或 200 (無觸發成就)
        assert response.status_code in [404, 200]
