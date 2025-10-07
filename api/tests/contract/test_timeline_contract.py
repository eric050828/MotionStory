"""
Timeline & Annual Review API Contract Tests (T036-T039)
測試 Timeline API 端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestTimeline:
    """T036: Contract test GET /timeline"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_timeline_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得時間軸 - 200 OK"""
        response = await client.get("/api/v1/timeline", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "entries" in data
        assert "pagination" in data
        assert isinstance(data["entries"], list)

        # 驗證 pagination schema
        pagination = data["pagination"]
        assert "has_more" in pagination
        assert isinstance(pagination["has_more"], bool)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_timeline_with_pagination(self, auth_headers: dict, client: AsyncClient):
        """測試分頁查詢 - 200 OK"""
        response = await client.get(
            "/api/v1/timeline",
            headers=auth_headers,
            params={"limit": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) <= 10

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_timeline_with_filter(self, auth_headers: dict, client: AsyncClient):
        """測試篩選條件 - 200 OK"""
        response = await client.get(
            "/api/v1/timeline",
            headers=auth_headers,
            params={
                "workout_type": "running",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "include_milestones": True
            }
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證時間軸項目包含運動記錄和里程碑
        for entry in data["entries"]:
            assert "id" in entry
            assert "type" in entry
            assert entry["type"] in ["workout", "milestone"]
            assert "date" in entry

            if entry["type"] == "workout":
                assert "workout" in entry
                workout = entry["workout"]
                assert "workout_type" in workout

            if entry["type"] == "milestone":
                assert "milestone" in entry
                milestone = entry["milestone"]
                assert "milestone_type" in milestone
                assert "name" in milestone

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_timeline_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/timeline")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestMilestones:
    """T037: Contract test GET /timeline/milestones"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_milestones_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得里程碑列表 - 200 OK"""
        response = await client.get("/api/v1/timeline/milestones", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "milestones" in data
        assert "pagination" in data
        assert isinstance(data["milestones"], list)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_milestones_with_filter(self, auth_headers: dict, client: AsyncClient):
        """測試篩選里程碑類型 - 200 OK"""
        response = await client.get(
            "/api/v1/timeline/milestones",
            headers=auth_headers,
            params={"milestone_type": "first_10k", "limit": 20}
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證篩選結果
        for milestone in data["milestones"]:
            assert milestone["milestone_type"] == "first_10k"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_milestones_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/timeline/milestones")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_milestone_detail_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的里程碑 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(
            f"/api/v1/timeline/milestones/{fake_id}",
            headers=auth_headers
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestAnnualReviewCreate:
    """T038: Contract test POST /annual-review"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試生成年度回顧 - 201 Created"""
        # 建立一些運動記錄以確保有資料
        for i in range(6):
            await client.post(
                "/api/v1/workouts",
                headers=auth_headers,
                json={
                    **sample_workout_data,
                    "start_time": f"2024-0{i+1}-15T08:30:00Z"
                }
            )

        # 生成年度回顧
        review_request = {"year": 2024}
        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "review" in data
        assert "generation_time_ms" in data

        # 驗證 review schema
        review = data["review"]
        assert "id" in review
        assert "user_id" in review
        assert "year" in review
        assert review["year"] == 2024
        assert "stats" in review
        assert "milestones" in review
        assert "trends" in review
        assert "achievements" in review
        assert "created_at" in review
        assert "web_url" in review

        # 驗證 stats schema
        stats = review["stats"]
        assert "total_workout_days" in stats
        assert "total_duration_minutes" in stats
        assert "total_distance_km" in stats
        assert "total_calories" in stats
        assert "max_streak_days" in stats
        assert "workout_by_type" in stats
        assert "favorite_workout_type" in stats

        # 驗證 trends schema
        trends = review["trends"]
        assert "monthly_summary" in trends
        assert "progress_percentage" in trends
        assert "best_month" in trends

        # 驗證生成時間符合效能要求 (< 3 秒)
        assert data["generation_time_ms"] < 3000

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_insufficient_data(self, auth_headers: dict, client: AsyncClient):
        """測試資料不足 - 400 Bad Request"""
        review_request = {"year": 2023}
        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"
        assert "insufficient" in data["message"].lower() or "not enough" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_invalid_year(self, auth_headers: dict, client: AsyncClient):
        """測試無效年度 - 400 Bad Request"""
        review_request = {"year": 1999}  # 小於 2020
        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_unauthorized(self, client: AsyncClient):
        """測試未認證建立 - 401 Unauthorized"""
        review_request = {"year": 2024}
        response = await client.post("/api/v1/annual-review", json=review_request)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestAnnualReviewGet:
    """T039: Contract test GET /annual-review/{review_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_annual_review_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的年度回顧 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(f"/api/v1/annual-review/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_annual_review_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        fake_id = "507f1f77bcf86cd799439016"
        response = await client.get(f"/api/v1/annual-review/{fake_id}")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試匯出不存在的回顧 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(
            f"/api/v1/annual-review/{fake_id}/export",
            headers=auth_headers,
            params={"format": "images"}
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_missing_format(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試缺少格式參數 - 400 Bad Request"""
        # 建立運動記錄並生成年度回顧
        for i in range(6):
            await client.post(
                "/api/v1/workouts",
                headers=auth_headers,
                json={
                    **sample_workout_data,
                    "start_time": f"2024-0{i+1}-15T08:30:00Z"
                }
            )

        review_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if review_response.status_code == 201:
            review_id = review_response.json()["review"]["id"]

            # 嘗試匯出但不提供格式
            response = await client.get(
                f"/api/v1/annual-review/{review_id}/export",
                headers=auth_headers
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_annual_reviews_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得歷年回顧列表 - 200 OK"""
        response = await client.get("/api/v1/annual-review/list", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "reviews" in data
        assert isinstance(data["reviews"], list)

        # 驗證列表項目 schema
        for review in data["reviews"]:
            assert "id" in review
            assert "year" in review
            assert "created_at" in review
            assert "web_url" in review

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_annual_reviews_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/annual-review/list")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
