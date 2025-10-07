"""
T041: 場景 3 - 艾莉的年度回顧
基於 quickstart.md 的使用者場景 3
測試端到端流程：建立全年運動記錄 → 生成年度回顧 → 驗證統計 → 匯出圖片
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone
import time


class TestAnnualReviewGeneration:
    """測試年度回顧生成完整流程"""

    @pytest.mark.asyncio
    async def test_ellie_annual_review_full_workflow(self, async_client: AsyncClient, auth_headers):
        """
        場景: 艾莉的年度回顧
        Given: 艾莉在 2024 年使用 MotionStory 記錄了 248 天運動
        When: 12 月 31 日開啟年度回顧功能
        Then:
        - ✅ 互動式網頁版 < 3 秒生成
        - ✅ 顯示運動天數、總時長、關鍵里程碑
        - ✅ 視覺化呈現成長歷程
        """
        headers = auth_headers

        # Step 1: 建立全年運動記錄（模擬 30+ 筆）
        # 為了測試效能，建立足夠數量的記錄
        workouts_data = []
        start_date = datetime(2024, 1, 1, tzinfo=timezone.utc)

        for i in range(35):
            workout_date = start_date + timedelta(days=i * 10)
            workouts_data.append({
                "workout_type": "running" if i % 3 != 0 else "cycling",
                "start_time": workout_date.isoformat(),
                "duration_minutes": 30 + (i % 30),
                "distance_km": 5.0 + (i % 10),
                "pace_min_per_km": 5.5 + (i % 2),
                "avg_heart_rate": 140 + (i % 20),
                "calories": 300 + (i * 10),
                "notes": f"運動記錄 {i + 1}"
            })

        # 批次建立運動記錄
        batch_response = await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": workouts_data},
            headers=headers
        )

        assert batch_response.status_code == 201
        batch_result = batch_response.json()

        assert batch_result["created_count"] == 35
        assert batch_result["failed_count"] == 0

        # Step 2: 生成年度回顧（測量生成時間）
        start_time = time.time()

        annual_review_data = {
            "year": 2024,
            "include_video": False
        }

        review_response = await async_client.post(
            "/api/v1/annual-review",
            json=annual_review_data,
            headers=headers
        )

        elapsed_time = (time.time() - start_time) * 1000  # 轉換為毫秒

        assert review_response.status_code == 201
        review_result = review_response.json()

        # Step 3: 驗證生成時間 < 3000ms (FR-035)
        assert "generation_time_ms" in review_result
        generation_time = review_result["generation_time_ms"]

        assert generation_time < 3000, f"年度回顧生成時間 {generation_time}ms 超過 3 秒"
        assert elapsed_time < 3500, f"實測生成時間 {elapsed_time:.0f}ms 超過 3.5 秒（含網路延遲）"

        # Step 4: 驗證年度回顧內容
        assert "review" in review_result
        review = review_result["review"]

        assert review["year"] == 2024
        assert "id" in review
        assert "stats" in review

        # 驗證統計資料
        stats = review["stats"]
        assert "total_workout_days" in stats
        assert stats["total_workout_days"] >= 35
        assert "total_duration_minutes" in stats
        assert stats["total_duration_minutes"] > 0
        assert "total_distance_km" in stats
        assert stats["total_distance_km"] > 0
        assert "favorite_workout_type" in stats

        # 驗證里程碑與趨勢資料
        assert "milestones" in review
        assert "trends" in review
        assert "web_url" in review

        return review["id"]  # 返回 review_id 供後續測試使用

    @pytest.mark.asyncio
    async def test_annual_review_statistics_accuracy(self, async_client: AsyncClient, auth_headers):
        """
        測試年度回顧統計資料準確性
        驗證統計數據計算正確
        """
        headers = auth_headers

        # 建立已知數量的運動記錄
        known_workouts = [
            {
                "workout_type": "running",
                "start_time": datetime(2024, 1, 1, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0,
                "calories": 300,
            },
            {
                "workout_type": "running",
                "start_time": datetime(2024, 1, 2, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 40,
                "distance_km": 7.0,
                "calories": 400,
            },
            {
                "workout_type": "cycling",
                "start_time": datetime(2024, 1, 3, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 60,
                "distance_km": 20.0,
                "calories": 500,
            },
        ]

        batch_response = await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": known_workouts},
            headers=headers
        )

        assert batch_response.status_code == 201

        # 生成年度回顧
        review_response = await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2024, "include_video": False},
            headers=headers
        )

        review = review_response.json()["review"]
        stats = review["stats"]

        # 驗證統計數據準確性
        assert stats["total_workout_days"] == 3
        assert stats["total_duration_minutes"] == 130
        assert stats["total_distance_km"] == 32.0
        # running 出現 2 次, cycling 出現 1 次
        assert stats["favorite_workout_type"] in ["running", "cycling"]


class TestAnnualReviewExport:
    """測試年度回顧匯出功能"""

    @pytest.mark.asyncio
    async def test_export_annual_review_as_images(self, async_client: AsyncClient, auth_headers):
        """
        場景: 艾莉匯出年度回顧圖片
        Given: 年度回顧已生成
        When: 選擇匯出為圖片格式
        Then:
        - ✅ 圖片匯出 < 5 秒
        - ✅ 生成多張高品質圖片（封面、統計、里程碑）
        - ✅ 圖片可下載與分享
        """
        headers = auth_headers

        # 建立運動記錄並生成年度回顧
        workouts_data = []
        for i in range(10):
            workouts_data.append({
                "workout_type": "running",
                "start_time": datetime(2024, i + 1, 1, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0,
            })

        await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": workouts_data},
            headers=headers
        )

        review_response = await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2024, "include_video": False},
            headers=headers
        )

        review_id = review_response.json()["review"]["id"]

        # Step 1: 匯出為圖片格式（測量匯出時間）
        start_time = time.time()

        export_response = await async_client.get(
            f"/api/v1/annual-review/{review_id}/export?format=images",
            headers=headers
        )

        elapsed_time = (time.time() - start_time) * 1000  # 轉換為毫秒

        assert export_response.status_code == 200
        export_result = export_response.json()

        # Step 2: 驗證匯出時間 < 5000ms (FR-035)
        assert "generation_time_ms" in export_result
        generation_time = export_result["generation_time_ms"]

        assert generation_time < 5000, f"圖片匯出時間 {generation_time}ms 超過 5 秒"
        assert elapsed_time < 5500, f"實測匯出時間 {elapsed_time:.0f}ms 超過 5.5 秒（含網路延遲）"

        # Step 3: 驗證圖片生成
        assert "images" in export_result
        images = export_result["images"]

        assert len(images) > 0, "應生成至少一張圖片"

        # 驗證圖片 URL 格式（應為 Cloudflare R2 URL）
        for image_url in images:
            assert isinstance(image_url, str)
            assert image_url.startswith("https://")
            # 可選：驗證 URL 包含 r2 或預期的網域
            assert any(domain in image_url for domain in ["r2", "cloudflare", "motionstory"])

    @pytest.mark.asyncio
    async def test_export_annual_review_as_pdf(self, async_client: AsyncClient, auth_headers):
        """
        測試匯出年度回顧為 PDF 格式
        驗證 PDF 匯出功能正常運作
        """
        headers = auth_headers

        # 建立運動記錄並生成年度回顧
        workouts_data = []
        for i in range(5):
            workouts_data.append({
                "workout_type": "running",
                "start_time": datetime(2024, i + 1, 1, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0,
            })

        await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": workouts_data},
            headers=headers
        )

        review_response = await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2024, "include_video": False},
            headers=headers
        )

        review_id = review_response.json()["review"]["id"]

        # 匯出為 PDF 格式
        export_response = await async_client.get(
            f"/api/v1/annual-review/{review_id}/export?format=pdf",
            headers=headers
        )

        assert export_response.status_code == 200

        # 驗證回應為 PDF 檔案
        content_type = export_response.headers.get("content-type")
        assert "application/pdf" in content_type

        # 驗證檔案內容不為空
        pdf_content = export_response.content
        assert len(pdf_content) > 0
        assert pdf_content[:4] == b"%PDF"  # PDF 檔案標頭


class TestAnnualReviewHistory:
    """測試年度回顧歷史記錄"""

    @pytest.mark.asyncio
    async def test_list_historical_annual_reviews(self, async_client: AsyncClient, auth_headers):
        """
        測試取得歷年回顧列表
        驗證使用者可查看過去多年的年度回顧
        """
        headers = auth_headers

        # 建立 2023 年運動記錄
        workouts_2023 = []
        for i in range(5):
            workouts_2023.append({
                "workout_type": "running",
                "start_time": datetime(2023, i + 1, 1, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0,
            })

        await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": workouts_2023},
            headers=headers
        )

        # 建立 2024 年運動記錄
        workouts_2024 = []
        for i in range(5):
            workouts_2024.append({
                "workout_type": "running",
                "start_time": datetime(2024, i + 1, 1, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0,
            })

        await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": workouts_2024},
            headers=headers
        )

        # 生成 2023 年度回顧
        await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2023, "include_video": False},
            headers=headers
        )

        # 生成 2024 年度回顧
        await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2024, "include_video": False},
            headers=headers
        )

        # 取得歷年回顧列表
        list_response = await async_client.get(
            "/api/v1/annual-review/list",
            headers=headers
        )

        assert list_response.status_code == 200
        reviews_list = list_response.json()

        assert "reviews" in reviews_list
        assert len(reviews_list["reviews"]) >= 2

        # 驗證包含 2023 和 2024 年的回顧
        years = [r["year"] for r in reviews_list["reviews"]]
        assert 2023 in years
        assert 2024 in years

    @pytest.mark.asyncio
    async def test_annual_review_not_regenerate_if_exists(self, async_client: AsyncClient, auth_headers):
        """
        測試年度回顧不重複生成
        驗證同一年度只生成一次回顧（或返回已存在的回顧）
        """
        headers = auth_headers

        # 建立運動記錄
        workouts_data = []
        for i in range(3):
            workouts_data.append({
                "workout_type": "running",
                "start_time": datetime(2024, i + 1, 1, 8, 0, 0, tzinfo=timezone.utc).isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0,
            })

        await async_client.post(
            "/api/v1/workouts/batch",
            json={"workouts": workouts_data},
            headers=headers
        )

        # 第一次生成年度回顧
        first_response = await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2024, "include_video": False},
            headers=headers
        )

        first_review_id = first_response.json()["review"]["id"]

        # 第二次請求生成相同年度回顧
        second_response = await async_client.post(
            "/api/v1/annual-review",
            json={"year": 2024, "include_video": False},
            headers=headers
        )

        second_review_id = second_response.json()["review"]["id"]

        # 驗證返回相同的年度回顧（或根據設計決策驗證行為）
        # 選項 1: 返回已存在的回顧
        assert first_review_id == second_review_id

        # 選項 2: 允許重新生成（根據實作決定）
        # 如果允許重新生成，驗證新的 ID 與統計一致性
