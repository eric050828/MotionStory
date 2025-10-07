"""
T019: Workouts API Contract Test - Import/Export
測試運動記錄匯入匯出端點的 request/response contract
"""

import pytest
from httpx import AsyncClient


class TestWorkoutsImport:
    """T019.1: Contract test POST /workouts/import"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_csv_success(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試匯入 CSV - 201 Created"""
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,30,5.0,6.0,145,300,Morning run
2025-01-16,cycling,45,15.0,,,450,Evening ride
2025-01-17,swimming,60,2.0,,,500,Pool training"""

        files = {"file": ("workouts.csv", csv_content, "text/csv")}
        response = await client.post(
            "/api/v1/workouts/import", headers=auth_headers, files=files
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "imported_count" in data
        assert "failed_count" in data
        assert isinstance(data["imported_count"], int)
        assert isinstance(data["failed_count"], int)

        # 驗證成功匯入
        assert data["imported_count"] == 3
        assert data["failed_count"] == 0

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_partial_failure(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試部分資料格式錯誤的 CSV - 201 Created（部分成功）"""
        csv_content = """date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-15,running,30,5.0,6.0,145,300,Valid entry
2025-01-16,invalid_type,45,15.0,,,450,Invalid workout type
2025-01-17,cycling,abc,10.0,,,400,Invalid duration"""

        files = {"file": ("workouts.csv", csv_content, "text/csv")}
        response = await client.post(
            "/api/v1/workouts/import", headers=auth_headers, files=files
        )

        assert response.status_code == 201
        data = response.json()

        # 驗證部分成功、部分失敗
        assert data["imported_count"] >= 1
        assert data["failed_count"] >= 1

        # 驗證錯誤詳情
        if "errors" in data and len(data["errors"]) > 0:
            error = data["errors"][0]
            assert "line" in error
            assert "error" in error
            assert isinstance(error["line"], int)
            assert isinstance(error["error"], str)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_invalid_csv_format(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試無效 CSV 格式（缺少必要欄位）- 400 Bad Request"""
        invalid_csv = """invalid,csv,headers
value1,value2,value3"""

        files = {"file": ("invalid.csv", invalid_csv, "text/csv")}
        response = await client.post(
            "/api/v1/workouts/import", headers=auth_headers, files=files
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"
        assert "message" in data

        # 驗證錯誤詳情包含格式範例
        if "details" in data:
            details = data["details"]
            assert "sample_format" in details or "issue" in details

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_empty_file(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試空檔案 - 400 Bad Request"""
        empty_csv = ""

        files = {"file": ("empty.csv", empty_csv, "text/csv")}
        response = await client.post(
            "/api/v1/workouts/import", headers=auth_headers, files=files
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_import_workouts_unauthorized(self, client: AsyncClient):
        """測試未認證匯入 - 401 Unauthorized"""
        csv_content = "date,workout_type,duration_minutes"

        files = {"file": ("workouts.csv", csv_content, "text/csv")}
        response = await client.post("/api/v1/workouts/import", files=files)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestWorkoutsExport:
    """T019.2: Contract test GET /workouts/export"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_workouts_csv_success(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試匯出 CSV - 200 OK"""
        # 建立測試資料
        await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )

        response = await client.get(
            "/api/v1/workouts/export",
            headers=auth_headers,
            params={"format": "csv", "start_date": "2025-01-01", "end_date": "2025-12-31"},
        )

        assert response.status_code == 200

        # 驗證 Content-Type
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type

        # 驗證 CSV 內容
        csv_content = response.text
        assert len(csv_content) > 0

        # 驗證 CSV header
        lines = csv_content.split("\n")
        header = lines[0]
        assert "workout_type" in header
        assert "duration_minutes" in header
        assert "distance_km" in header

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_workouts_with_date_filter(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試匯出指定日期範圍的資料 - 200 OK"""
        # 建立不同日期的測試資料
        workout1 = sample_workout_data.copy()
        workout1["start_time"] = "2025-01-15T08:30:00Z"
        await client.post("/api/v1/workouts", headers=auth_headers, json=workout1)

        workout2 = sample_workout_data.copy()
        workout2["start_time"] = "2025-02-15T08:30:00Z"
        await client.post("/api/v1/workouts", headers=auth_headers, json=workout2)

        # 只匯出 1 月的資料
        response = await client.get(
            "/api/v1/workouts/export",
            headers=auth_headers,
            params={
                "format": "csv",
                "start_date": "2025-01-01",
                "end_date": "2025-01-31",
            },
        )

        assert response.status_code == 200
        csv_content = response.text

        # 驗證只包含 1 月的資料
        assert "2025-01-15" in csv_content
        assert "2025-02-15" not in csv_content

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_workouts_with_type_filter(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試匯出指定運動類型的資料 - 200 OK"""
        # 建立不同類型的測試資料
        running = sample_workout_data.copy()
        running["workout_type"] = "running"
        await client.post("/api/v1/workouts", headers=auth_headers, json=running)

        cycling = sample_workout_data.copy()
        cycling["workout_type"] = "cycling"
        await client.post("/api/v1/workouts", headers=auth_headers, json=cycling)

        # 只匯出 running 類型
        response = await client.get(
            "/api/v1/workouts/export",
            headers=auth_headers,
            params={"format": "csv", "workout_type": "running"},
        )

        assert response.status_code == 200
        csv_content = response.text

        # 驗證只包含 running 類型
        lines = csv_content.split("\n")
        # 跳過 header，檢查資料行
        for line in lines[1:]:
            if line.strip():  # 忽略空行
                assert "running" in line or "workout_type" in line  # header 或 data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_workouts_empty_result(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試匯出無資料的結果 - 200 OK（空 CSV）"""
        response = await client.get(
            "/api/v1/workouts/export",
            headers=auth_headers,
            params={
                "format": "csv",
                "start_date": "2030-01-01",
                "end_date": "2030-12-31",
            },
        )

        assert response.status_code == 200
        csv_content = response.text

        # 應該至少有 header
        assert len(csv_content) > 0
        assert "workout_type" in csv_content

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_workouts_unauthorized(self, client: AsyncClient):
        """測試未認證匯出 - 401 Unauthorized"""
        response = await client.get(
            "/api/v1/workouts/export", params={"format": "csv"}
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
