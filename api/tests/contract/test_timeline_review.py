"""
Timeline Annual Review API Contract Tests (T025)
測試年度回顧生成與匯出端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient
import time


class TestAnnualReview:
    """T025: Contract test POST /annual-review"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_success(self, auth_headers: dict, client: AsyncClient):
        """測試年度回顧生成 - 201 Created (FR-018~FR-019)"""
        # 建立年度回顧
        review_request = {"year": 2024, "include_video": False}

        start_time = time.time()
        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )
        end_time = time.time()

        # 驗證效能目標 < 3 秒 (FR-035)
        generation_time = (end_time - start_time) * 1000  # 轉換為毫秒
        assert generation_time < 3000, f"生成時間 {generation_time}ms 超過 3 秒目標"

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "review" in data
        assert "generation_time_ms" in data

        review = data["review"]
        assert "id" in review
        assert "user_id" in review
        assert "year" in review
        assert review["year"] == 2024
        assert "stats" in review
        assert "milestones" in review
        assert "trends" in review
        assert "created_at" in review
        assert "web_url" in review

        # 驗證 stats schema
        stats = review["stats"]
        assert "total_workout_days" in stats
        assert "total_duration_minutes" in stats
        assert "total_distance_km" in stats
        assert "total_calories" in stats
        assert "max_streak_days" in stats
        assert "favorite_workout_type" in stats

        # 驗證 trends schema
        trends = review["trends"]
        assert "monthly_summary" in trends
        assert "progress_percentage" in trends
        assert isinstance(trends["monthly_summary"], list)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_performance_target(self, auth_headers: dict, client: AsyncClient):
        """測試生成效能目標 < 3 秒 - 201 Created (FR-035)"""
        review_request = {"year": 2024}

        # 測量生成時間
        start_time = time.time()
        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )
        end_time = time.time()

        generation_time_ms = (end_time - start_time) * 1000

        assert response.status_code == 201
        assert generation_time_ms < 3000, f"生成時間 {generation_time_ms}ms 超過 3 秒"

        # 驗證回應中的 generation_time_ms
        data = response.json()
        assert data["generation_time_ms"] < 3000

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_insufficient_data(self, auth_headers: dict, client: AsyncClient):
        """測試資料不足 - 400 Bad Request"""
        # 嘗試生成沒有資料的年度回顧
        review_request = {"year": 2020}  # 假設 2020 年沒有資料

        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )

        # 可能回傳 400 或 201 (空資料回顧)
        if response.status_code == 400:
            data = response.json()
            assert data["error"] == "BAD_REQUEST"
            assert "insufficient" in data["message"].lower() or "no data" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_annual_review_invalid_year(self, auth_headers: dict, client: AsyncClient):
        """測試無效年份 - 400 Bad Request"""
        # 年份過小
        review_request = {"year": 2019}
        response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json=review_request
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

        # 年份過大
        review_request = {"year": 2101}
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
    async def test_create_annual_review_missing_year(self, auth_headers: dict, client: AsyncClient):
        """測試缺少 year 欄位 - 400 Bad Request"""
        review_request = {}
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
        """測試未認證生成 - 401 Unauthorized"""
        review_request = {"year": 2024}
        response = await client.post("/api/v1/annual-review", json=review_request)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_annual_review_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得年度回顧 - 200 OK"""
        # 先生成年度回顧
        create_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if create_response.status_code == 201:
            review_id = create_response.json()["review"]["id"]

            # 取得年度回顧
            response = await client.get(f"/api/v1/annual-review/{review_id}", headers=auth_headers)

            assert response.status_code == 200

            # 驗證 response schema
            data = response.json()
            assert "id" in data
            assert data["id"] == review_id
            assert "year" in data
            assert "stats" in data
            assert "milestones" in data
            assert "trends" in data
            assert "web_url" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_annual_review_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的年度回顧 - 404 Not Found"""
        fake_review_id = "507f1f77bcf86cd799439999"
        response = await client.get(f"/api/v1/annual-review/{fake_review_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_annual_review_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        fake_review_id = "507f1f77bcf86cd799439016"
        response = await client.get(f"/api/v1/annual-review/{fake_review_id}")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_images_success(self, auth_headers: dict, client: AsyncClient):
        """測試匯出圖片格式 - 200 OK (FR-019, FR-025)"""
        # 先生成年度回顧
        create_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if create_response.status_code == 201:
            review_id = create_response.json()["review"]["id"]

            # 匯出為圖片
            start_time = time.time()
            response = await client.get(
                f"/api/v1/annual-review/{review_id}/export",
                headers=auth_headers,
                params={"format": "images"}
            )
            end_time = time.time()

            # 驗證效能目標 < 5 秒 (FR-035)
            export_time = (end_time - start_time) * 1000
            assert export_time < 5000, f"匯出時間 {export_time}ms 超過 5 秒目標"

            assert response.status_code == 200

            # 驗證 response schema
            data = response.json()
            assert "images" in data
            assert "generation_time_ms" in data
            assert isinstance(data["images"], list)
            assert len(data["images"]) > 0

            # 驗證圖片 URL 格式
            for image_url in data["images"]:
                assert image_url.startswith("https://")
                assert "r2.motionstory.com" in image_url or "cloudflare" in image_url

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_images_performance_target(self, auth_headers: dict, client: AsyncClient):
        """測試圖片匯出效能目標 < 5 秒 - 200 OK (FR-035)"""
        # 先生成年度回顧
        create_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if create_response.status_code == 201:
            review_id = create_response.json()["review"]["id"]

            # 測量匯出時間
            start_time = time.time()
            response = await client.get(
                f"/api/v1/annual-review/{review_id}/export",
                headers=auth_headers,
                params={"format": "images"}
            )
            end_time = time.time()

            export_time_ms = (end_time - start_time) * 1000

            assert response.status_code == 200
            assert export_time_ms < 5000, f"匯出時間 {export_time_ms}ms 超過 5 秒"

            # 驗證回應中的 generation_time_ms
            data = response.json()
            assert data["generation_time_ms"] < 5000

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_pdf_success(self, auth_headers: dict, client: AsyncClient):
        """測試匯出 PDF 格式 - 200 OK (FR-025)"""
        # 先生成年度回顧
        create_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if create_response.status_code == 201:
            review_id = create_response.json()["review"]["id"]

            # 匯出為 PDF
            response = await client.get(
                f"/api/v1/annual-review/{review_id}/export",
                headers=auth_headers,
                params={"format": "pdf"}
            )

            assert response.status_code == 200
            assert response.headers["content-type"] == "application/pdf"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_invalid_format(self, auth_headers: dict, client: AsyncClient):
        """測試無效匯出格式 - 400 Bad Request"""
        # 先生成年度回顧
        create_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if create_response.status_code == 201:
            review_id = create_response.json()["review"]["id"]

            # 無效格式
            response = await client.get(
                f"/api/v1/annual-review/{review_id}/export",
                headers=auth_headers,
                params={"format": "invalid"}
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_missing_format(self, auth_headers: dict, client: AsyncClient):
        """測試缺少 format 參數 - 400 Bad Request"""
        # 先生成年度回顧
        create_response = await client.post(
            "/api/v1/annual-review",
            headers=auth_headers,
            json={"year": 2024}
        )

        if create_response.status_code == 201:
            review_id = create_response.json()["review"]["id"]

            # 缺少 format 參數
            response = await client.get(
                f"/api/v1/annual-review/{review_id}/export",
                headers=auth_headers
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的年度回顧匯出 - 404 Not Found"""
        fake_review_id = "507f1f77bcf86cd799439999"
        response = await client.get(
            f"/api/v1/annual-review/{fake_review_id}/export",
            headers=auth_headers,
            params={"format": "images"}
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_export_annual_review_unauthorized(self, client: AsyncClient):
        """測試未認證匯出 - 401 Unauthorized"""
        fake_review_id = "507f1f77bcf86cd799439016"
        response = await client.get(
            f"/api/v1/annual-review/{fake_review_id}/export",
            params={"format": "images"}
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

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

        # 驗證回顧列表項目 schema
        if len(data["reviews"]) > 0:
            review_item = data["reviews"][0]
            assert "id" in review_item
            assert "year" in review_item
            assert "created_at" in review_item
            assert "web_url" in review_item

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_annual_reviews_unauthorized(self, client: AsyncClient):
        """測試未認證存取列表 - 401 Unauthorized"""
        response = await client.get("/api/v1/annual-review/list")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
