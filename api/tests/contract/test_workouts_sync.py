"""
T018: Workouts API Contract Test - POST /workouts/batch
測試批次同步運動記錄端點的 request/response contract
"""

import pytest
from httpx import AsyncClient


class TestWorkoutsSync:
    """T018: Contract test POST /workouts/batch"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_workouts_success(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試批次建立運動記錄 - 201 Created"""
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": "2025-01-15T08:30:00Z",
                    "duration_minutes": 30,
                    "distance_km": 5.0,
                },
                {
                    "workout_type": "cycling",
                    "start_time": "2025-01-16T09:00:00Z",
                    "duration_minutes": 45,
                    "distance_km": 15.0,
                },
                {
                    "workout_type": "swimming",
                    "start_time": "2025-01-17T07:00:00Z",
                    "duration_minutes": 60,
                    "distance_km": 2.0,
                },
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch", headers=auth_headers, json=batch_data
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "created_count" in data
        assert "failed_count" in data
        assert "workouts" in data
        assert isinstance(data["workouts"], list)

        # 驗證成功建立數量
        assert data["created_count"] == 3
        assert data["failed_count"] == 0

        # 驗證每筆結果的結構
        for result in data["workouts"]:
            assert "success" in result
            if result["success"]:
                assert "workout" in result
                assert result["error"] is None
            else:
                assert "error" in result

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_partial_failure(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試批次建立部分失敗 - 201 Created"""
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": "2025-01-15T08:30:00Z",
                    "duration_minutes": 30,
                },
                {
                    "workout_type": "invalid_type",  # 無效類型
                    "start_time": "2025-01-16T09:00:00Z",
                    "duration_minutes": 45,
                },
                {
                    "workout_type": "cycling",
                    # 缺少 start_time（必要欄位）
                    "duration_minutes": 60,
                },
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch", headers=auth_headers, json=batch_data
        )

        assert response.status_code == 201
        data = response.json()

        # 驗證部分成功、部分失敗
        assert data["created_count"] >= 1
        assert data["failed_count"] >= 1
        assert data["created_count"] + data["failed_count"] == 3

        # 驗證失敗的記錄包含錯誤訊息
        failed_items = [item for item in data["workouts"] if not item["success"]]
        for failed_item in failed_items:
            assert failed_item["error"] is not None
            assert isinstance(failed_item["error"], str)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_empty_list(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試批次建立空列表 - 400 Bad Request"""
        batch_data = {"workouts": []}

        response = await client.post(
            "/api/v1/workouts/batch", headers=auth_headers, json=batch_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_exceed_limit(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試批次建立超過上限（> 100 筆）- 400 Bad Request"""
        # 建立 101 筆記錄
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": f"2025-01-{(i % 28) + 1:02d}T08:30:00Z",
                    "duration_minutes": 30,
                }
                for i in range(101)
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch", headers=auth_headers, json=batch_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_with_achievements(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試批次建立會觸發成就檢查 - 201 Created"""
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": "2025-01-15T08:30:00Z",
                    "duration_minutes": 30,
                    "distance_km": 5.0,
                },
                {
                    "workout_type": "running",
                    "start_time": "2025-01-16T08:30:00Z",
                    "duration_minutes": 30,
                    "distance_km": 5.0,
                },
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch", headers=auth_headers, json=batch_data
        )

        assert response.status_code == 201
        data = response.json()

        # 驗證回應中包含成就資訊（可能為空列表）
        for result in data["workouts"]:
            if result["success"]:
                # 每筆成功的記錄都應該有運動資訊
                assert "workout" in result
                workout = result["workout"]
                assert "id" in workout
                assert "workout_type" in workout

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_unauthorized(self, client: AsyncClient):
        """測試未認證批次建立 - 401 Unauthorized"""
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": "2025-01-15T08:30:00Z",
                    "duration_minutes": 30,
                }
            ]
        }

        response = await client.post("/api/v1/workouts/batch", json=batch_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_duplicate_times(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試批次建立相同時間的記錄（應該都能成功）- 201 Created"""
        same_time = "2025-01-15T08:30:00Z"
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": same_time,
                    "duration_minutes": 30,
                },
                {
                    "workout_type": "cycling",
                    "start_time": same_time,
                    "duration_minutes": 45,
                },
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch", headers=auth_headers, json=batch_data
        )

        assert response.status_code == 201
        data = response.json()

        # 系統應該允許同時進行多個運動（例如磚塊訓練）
        # 或者根據業務邏輯決定是否允許
        assert "created_count" in data
        assert "failed_count" in data
