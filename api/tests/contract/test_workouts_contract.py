"""
Workouts API Contract Tests (T018-T028)
測試 Workouts API 端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


class TestWorkoutsList:
    """T018: Contract test GET /workouts"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試取得運動記錄列表 - 200 OK"""
        # 建立測試運動記錄
        await client.post("/api/v1/workouts", headers=auth_headers, json=sample_workout_data)

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

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_with_pagination(self, auth_headers: dict, client: AsyncClient):
        """測試分頁查詢 - 200 OK"""
        response = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"limit": 10, "sort": "start_time_desc"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["workouts"]) <= 10

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_with_filter(self, auth_headers: dict, client: AsyncClient):
        """測試運動類型篩選 - 200 OK"""
        response = await client.get(
            "/api/v1/workouts",
            headers=auth_headers,
            params={"workout_type": "running", "start_date": "2025-01-01", "end_date": "2025-12-31"}
        )

        assert response.status_code == 200
        data = response.json()
        # 所有記錄應為 running 類型
        for workout in data["workouts"]:
            assert workout["workout_type"] == "running"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_workouts_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/workouts")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestWorkoutsCreate:
    """T019: Contract test POST /workouts"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試建立運動記錄 - 201 Created"""
        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "workout" in data
        assert "achievements_triggered" in data

        # 驗證 workout schema
        workout = data["workout"]
        assert "id" in workout
        assert workout["workout_type"] == sample_workout_data["workout_type"]
        assert workout["duration_minutes"] == sample_workout_data["duration_minutes"]
        assert "created_at" in workout

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_missing_required_field(self, auth_headers: dict, client: AsyncClient):
        """測試缺少必要欄位 - 400 Bad Request"""
        incomplete_data = {
            "workout_type": "running"
            # 缺少 start_time 和 duration_minutes
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=incomplete_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_invalid_type(self, auth_headers: dict, client: AsyncClient):
        """測試無效運動類型 - 400 Bad Request"""
        invalid_data = {
            "workout_type": "invalid_type",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 30
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=invalid_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_workout_unauthorized(self, client: AsyncClient, sample_workout_data: dict):
        """測試未認證建立 - 401 Unauthorized"""
        response = await client.post("/api/v1/workouts", json=sample_workout_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestWorkoutsGet:
    """T020: Contract test GET /workouts/{workout_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試取得單筆運動記錄 - 200 OK"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 取得記錄
        response = await client.get(f"/api/v1/workouts/{workout_id}", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert data["id"] == workout_id
        assert "workout_type" in data
        assert "start_time" in data
        assert "duration_minutes" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(f"/api/v1/workouts/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        fake_id = "507f1f77bcf86cd799439011"
        response = await client.get(f"/api/v1/workouts/{fake_id}")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestWorkoutsUpdate:
    """T021: Contract test PUT /workouts/{workout_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_workout_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試更新運動記錄 - 200 OK"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 更新記錄
        update_data = {
            "duration_minutes": 45,
            "notes": "Updated note"
        }
        response = await client.put(
            f"/api/v1/workouts/{workout_id}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == 200

        # 驗證更新結果
        data = response.json()
        assert data["id"] == workout_id
        assert data["duration_minutes"] == 45
        assert data["notes"] == "Updated note"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_workout_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試更新不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        update_data = {"notes": "New note"}

        response = await client.put(
            f"/api/v1/workouts/{fake_id}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestWorkoutsDelete:
    """T022: Contract test DELETE /workouts/{workout_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_workout_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試刪除運動記錄 - 204 No Content"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 刪除記錄
        response = await client.delete(f"/api/v1/workouts/{workout_id}", headers=auth_headers)

        assert response.status_code == 204
        assert response.content == b''

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_workout_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試刪除不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.delete(f"/api/v1/workouts/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestWorkoutsBatch:
    """T023: Contract test POST /workouts/batch"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_workouts_success(self, auth_headers: dict, client: AsyncClient):
        """測試批次建立運動記錄 - 201 Created"""
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": "2025-01-15T08:30:00Z",
                    "duration_minutes": 30,
                    "distance_km": 5.0
                },
                {
                    "workout_type": "cycling",
                    "start_time": "2025-01-16T09:00:00Z",
                    "duration_minutes": 45,
                    "distance_km": 15.0
                }
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch",
            headers=auth_headers,
            json=batch_data
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "created_count" in data
        assert "failed_count" in data
        assert "workouts" in data
        assert data["created_count"] == 2
        assert data["failed_count"] == 0

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_batch_create_partial_failure(self, auth_headers: dict, client: AsyncClient):
        """測試批次建立部分失敗 - 201 Created"""
        batch_data = {
            "workouts": [
                {
                    "workout_type": "running",
                    "start_time": "2025-01-15T08:30:00Z",
                    "duration_minutes": 30
                },
                {
                    "workout_type": "invalid_type",  # 無效類型
                    "start_time": "2025-01-16T09:00:00Z",
                    "duration_minutes": 45
                }
            ]
        }

        response = await client.post(
            "/api/v1/workouts/batch",
            headers=auth_headers,
            json=batch_data
        )

        assert response.status_code == 201
        data = response.json()
        assert data["failed_count"] > 0


class TestWorkoutsStats:
    """T024: Contract test GET /workouts/stats"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_stats_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得運動統計 - 200 OK"""
        response = await client.get(
            "/api/v1/workouts/stats",
            headers=auth_headers,
            params={"time_range": "30d"}
        )

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "total_workouts" in data
        assert "total_duration_minutes" in data
        assert "total_distance_km" in data
        assert "streak_days" in data
        assert isinstance(data["total_workouts"], int)
        assert isinstance(data["total_duration_minutes"], int)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_stats_with_type_filter(self, auth_headers: dict, client: AsyncClient):
        """測試運動類型篩選的統計 - 200 OK"""
        response = await client.get(
            "/api/v1/workouts/stats",
            headers=auth_headers,
            params={"time_range": "7d", "workout_type": "running"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_workouts" in data


class TestWorkoutsExport:
    """T025: Contract test GET /workouts/export"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_workouts_csv_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試匯出 CSV - 200 OK"""
        # 建立測試資料
        await client.post("/api/v1/workouts", headers=auth_headers, json=sample_workout_data)

        response = await client.get(
            "/api/v1/workouts/export",
            headers=auth_headers,
            params={"format": "csv", "start_date": "2025-01-01", "end_date": "2025-12-31"}
        )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"

        # 驗證 CSV header
        csv_content = response.text
        assert "workout_type" in csv_content
        assert "duration_minutes" in csv_content


class TestWorkoutsImport:
    """T026: Contract test POST /workouts/import"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_csv_success(self, auth_headers: dict, client: AsyncClient):
        """測試匯入 CSV - 201 Created"""
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,30,5.0,6.0,145,300,Morning run
2025-01-16,cycling,45,15.0,,,450,Evening ride"""

        files = {"file": ("workouts.csv", csv_content, "text/csv")}
        response = await client.post(
            "/api/v1/workouts/import",
            headers=auth_headers,
            files=files
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "imported_count" in data
        assert "failed_count" in data
        assert data["imported_count"] > 0

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_invalid_csv(self, auth_headers: dict, client: AsyncClient):
        """測試無效 CSV 格式 - 400 Bad Request"""
        invalid_csv = "invalid,csv,format"

        files = {"file": ("invalid.csv", invalid_csv, "text/csv")}
        response = await client.post(
            "/api/v1/workouts/import",
            headers=auth_headers,
            files=files
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"


class TestWorkoutsRestore:
    """T027: Contract test POST /workouts/{workout_id}/restore"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_restore_workout_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試復原已刪除記錄 - 200 OK"""
        # 建立並刪除運動記錄
        create_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        await client.delete(f"/api/v1/workouts/{workout_id}", headers=auth_headers)

        # 復原記錄
        response = await client.post(
            f"/api/v1/workouts/{workout_id}/restore",
            headers=auth_headers
        )

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "message" in data
        assert "workout" in data
        assert data["workout"]["id"] == workout_id

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_restore_workout_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試復原不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.post(
            f"/api/v1/workouts/{fake_id}/restore",
            headers=auth_headers
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestWorkoutsTrash:
    """T028: Contract test GET /workouts/trash"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_trash_workouts_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試取得垃圾桶記錄 - 200 OK"""
        # 建立並刪除運動記錄
        create_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]
        await client.delete(f"/api/v1/workouts/{workout_id}", headers=auth_headers)

        # 取得垃圾桶列表
        response = await client.get("/api/v1/workouts/trash", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "workouts" in data
        assert "next_cursor" in data
        assert "total_count" in data

        # 驗證已刪除記錄包含剩餘天數資訊
        if len(data["workouts"]) > 0:
            workout = data["workouts"][0]
            assert "days_until_permanent_delete" in workout

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_trash_workouts_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/workouts/trash")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
