"""
T017: Workouts API Contract Test - GET /workouts
測試查詢運動記錄列表端點的 request/response contract
"""

import pytest
from httpx import AsyncClient


class TestWorkoutsGet:
    """T017: Contract test GET /workouts"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_success(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試取得運動記錄列表 - 200 OK"""
        # 建立測試運動記錄
        await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )

        # 取得列表
        response = await client.get("/api/v1/workouts", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "workouts" in data
        assert "pagination" in data
        assert isinstance(data["workouts"], list)

        # 驗證 pagination schema
        pagination = data["pagination"]
        assert "has_more" in pagination
        assert isinstance(pagination["has_more"], bool)

        # 如果有資料，驗證 workout schema
        if len(data["workouts"]) > 0:
            workout = data["workouts"][0]
            assert "id" in workout
            assert "user_id" in workout
            assert "workout_type" in workout
            assert "start_time" in workout
            assert "duration_minutes" in workout
            assert "created_at" in workout

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_with_pagination(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試分頁查詢 - 200 OK"""
        response = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"limit": 10, "sort": "start_time_desc"},
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證分頁限制
        assert len(data["workouts"]) <= 10

        # 驗證 pagination 包含 next_cursor
        pagination = data["pagination"]
        assert "next_cursor" in pagination or "has_more" in pagination

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_with_cursor(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試 cursor-based pagination - 200 OK"""
        # 建立多筆測試資料
        for i in range(5):
            workout_data = sample_workout_data.copy()
            workout_data["start_time"] = f"2025-01-{15+i:02d}T08:30:00Z"
            await client.post("/api/v1/workouts", headers=auth_headers, json=workout_data)

        # 第一次查詢
        response1 = await client.get(
            "/api/v1/workouts", headers=auth_headers, params={"limit": 2}
        )
        assert response1.status_code == 200
        data1 = response1.json()

        # 如果有 next_cursor，測試第二次查詢
        if data1["pagination"].get("next_cursor"):
            response2 = await client.get(
                "/api/v1/workouts",
                headers=auth_headers,
                params={"limit": 2, "cursor": data1["pagination"]["next_cursor"]},
            )
            assert response2.status_code == 200
            data2 = response2.json()
            assert "workouts" in data2

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_filter_by_type(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試運動類型篩選 - 200 OK"""
        # 建立不同類型的運動記錄
        running_data = sample_workout_data.copy()
        running_data["workout_type"] = "running"
        await client.post("/api/v1/workouts", headers=auth_headers, json=running_data)

        cycling_data = sample_workout_data.copy()
        cycling_data["workout_type"] = "cycling"
        await client.post("/api/v1/workouts", headers=auth_headers, json=cycling_data)

        # 篩選 running 類型
        response = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"workout_type": "running"},
        )

        assert response.status_code == 200
        data = response.json()

        # 所有記錄應為 running 類型
        for workout in data["workouts"]:
            assert workout["workout_type"] == "running"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_filter_by_date_range(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試日期範圍篩選 - 200 OK"""
        response = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"start_date": "2025-01-01", "end_date": "2025-01-31"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "workouts" in data

        # 驗證回傳的記錄都在日期範圍內
        for workout in data["workouts"]:
            start_time = workout["start_time"]
            assert "2025-01" in start_time

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_sort_by_time(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試時間排序 - 200 OK"""
        # 建立多筆不同時間的記錄
        for i in range(3):
            workout_data = sample_workout_data.copy()
            workout_data["start_time"] = f"2025-01-{15+i:02d}T08:30:00Z"
            await client.post("/api/v1/workouts", headers=auth_headers, json=workout_data)

        # 測試降序排序
        response_desc = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"sort": "start_time_desc"},
        )
        assert response_desc.status_code == 200

        # 測試升序排序
        response_asc = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"sort": "start_time_asc"},
        )
        assert response_asc.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_invalid_limit(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試無效的 limit 參數（> 100）- 400 Bad Request"""
        response = await client.get(
            "/api/v1/workouts", headers=auth_headers, params={"limit": 150}
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/workouts")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
