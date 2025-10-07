"""
T016: Workouts API Contract Test - POST /workouts
測試建立運動記錄端點的 request/response contract
"""

import pytest
from httpx import AsyncClient


class TestWorkoutsCreate:
    """T016: Contract test POST /workouts"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_success(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試建立運動記錄 - 201 Created"""
        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "workout" in data
        assert "achievements_triggered" in data

        # 驗證 workout schema
        workout = data["workout"]
        assert "id" in workout
        assert "user_id" in workout
        assert workout["workout_type"] == sample_workout_data["workout_type"]
        assert workout["duration_minutes"] == sample_workout_data["duration_minutes"]
        assert workout["distance_km"] == sample_workout_data["distance_km"]
        assert "created_at" in workout
        assert "updated_at" in workout
        assert "is_deleted" in workout
        assert workout["is_deleted"] is False

        # 驗證 achievements_triggered 為 list
        assert isinstance(data["achievements_triggered"], list)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_missing_required_field(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試缺少必要欄位 - 400 Bad Request"""
        incomplete_data = {
            "workout_type": "running"
            # 缺少 start_time 和 duration_minutes
        }

        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=incomplete_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"
        assert "message" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_invalid_type(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試無效運動類型 - 400 Bad Request"""
        invalid_data = {
            "workout_type": "invalid_type",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 30,
        }

        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=invalid_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_invalid_duration(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試無效時長（< 1 分鐘）- 400 Bad Request"""
        invalid_data = {
            "workout_type": "running",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 0,  # minimum 1
        }

        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=invalid_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_invalid_heart_rate(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試無效心率（超出範圍）- 400 Bad Request"""
        invalid_data = {
            "workout_type": "running",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 30,
            "avg_heart_rate": 300,  # maximum 250
        }

        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=invalid_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_unauthorized(
        self, client: AsyncClient, sample_workout_data: dict
    ):
        """測試未認證建立 - 401 Unauthorized"""
        response = await client.post("/api/v1/workouts", json=sample_workout_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_with_location(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試建立包含位置資訊的運動記錄 - 201 Created"""
        workout_with_location = {
            "workout_type": "running",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 30,
            "distance_km": 5.0,
            "location": {"type": "Point", "coordinates": [121.5654, 25.0330]},
        }

        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=workout_with_location
        )

        assert response.status_code == 201
        data = response.json()
        workout = data["workout"]
        assert "location" in workout
        if workout["location"] is not None:
            assert workout["location"]["type"] == "Point"
            assert len(workout["location"]["coordinates"]) == 2

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_achievement_trigger(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試建立第一筆運動記錄時自動觸發成就檢查 - 201 Created"""
        first_workout = {
            "workout_type": "running",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 30,
            "distance_km": 5.0,
        }

        response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=first_workout
        )

        assert response.status_code == 201
        data = response.json()

        # 驗證 achievements_triggered 結構
        assert "achievements_triggered" in data
        achievements = data["achievements_triggered"]

        # 如果有觸發成就，驗證成就結構
        for achievement in achievements:
            assert "id" in achievement
            assert "achievement_type" in achievement
            assert "celebration_level" in achievement
            assert achievement["celebration_level"] in ["basic", "fireworks", "epic"]
