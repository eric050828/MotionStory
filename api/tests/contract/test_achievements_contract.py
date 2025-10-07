"""
Achievements API Contract Tests (T029-T031)
測試 Achievements API 端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestAchievementsList:
    """T029: Contract test GET /achievements"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_achievements_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得成就列表 - 200 OK"""
        response = await client.get("/api/v1/achievements", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "achievements" in data
        assert "pagination" in data
        assert isinstance(data["achievements"], list)

        # 驗證 pagination schema
        pagination = data["pagination"]
        assert "has_more" in pagination
        assert isinstance(pagination["has_more"], bool)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_achievements_with_filter(self, auth_headers: dict, client: AsyncClient):
        """測試篩選成就類型 - 200 OK"""
        response = await client.get(
            "/api/v1/achievements",
            headers=auth_headers,
            params={"achievement_type": "streak", "celebration_level": "epic"}
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證篩選結果
        for achievement in data["achievements"]:
            assert achievement["celebration_level"] == "epic"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_achievements_with_pagination(self, auth_headers: dict, client: AsyncClient):
        """測試分頁查詢 - 200 OK"""
        response = await client.get(
            "/api/v1/achievements",
            headers=auth_headers,
            params={"limit": 5}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["achievements"]) <= 5

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_achievements_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/achievements")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_achievement_detail_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試取得單一成就詳情 - 200 OK"""
        # 建立運動記錄以觸發成就
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        # 檢查是否有觸發成就
        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            # 取得成就詳情
            response = await client.get(
                f"/api/v1/achievements/{achievement_id}",
                headers=auth_headers
            )

            assert response.status_code == 200

            # 驗證 response schema
            data = response.json()
            assert "id" in data
            assert data["id"] == achievement_id
            assert "user_id" in data
            assert "achievement_type" in data
            assert "celebration_level" in data
            assert "achieved_at" in data
            assert data["celebration_level"] in ["basic", "fireworks", "epic"]

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_achievement_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的成就 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(f"/api/v1/achievements/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestAchievementsCheck:
    """T030: Contract test POST /achievements/check"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試檢查成就觸發 - 200 OK"""
        # 建立運動記錄
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )
        workout_id = workout_response.json()["workout"]["id"]

        # 檢查成就
        check_request = {"workout_id": workout_id}
        response = await client.post(
            "/api/v1/achievements/check",
            headers=auth_headers,
            json=check_request
        )

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "achievements_triggered" in data
        assert "total_triggered" in data
        assert isinstance(data["achievements_triggered"], list)
        assert isinstance(data["total_triggered"], int)
        assert data["total_triggered"] == len(data["achievements_triggered"])

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_check_achievements_invalid_workout(self, auth_headers: dict, client: AsyncClient):
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
    async def test_check_achievements_unauthorized(self, client: AsyncClient):
        """測試未認證檢查 - 401 Unauthorized"""
        check_request = {"workout_id": "507f1f77bcf86cd799439011"}
        response = await client.post("/api/v1/achievements/check", json=check_request)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_achievement_stats_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得成就統計 - 200 OK"""
        response = await client.get("/api/v1/achievements/stats", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "total_achievements" in data
        assert "by_level" in data
        assert "completion_percentage" in data

        # 驗證 by_level schema
        by_level = data["by_level"]
        assert "basic" in by_level
        assert "fireworks" in by_level
        assert "epic" in by_level

        # 驗證資料型別
        assert isinstance(data["total_achievements"], int)
        assert isinstance(data["completion_percentage"], (int, float))

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_achievement_types_success(self, client: AsyncClient):
        """測試取得成就類型定義 - 200 OK (不需認證)"""
        response = await client.get("/api/v1/achievements/types")

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "achievement_types" in data
        assert isinstance(data["achievement_types"], list)

        # 驗證成就類型定義 schema
        if len(data["achievement_types"]) > 0:
            achievement_type = data["achievement_types"][0]
            assert "type" in achievement_type
            assert "name" in achievement_type
            assert "description" in achievement_type
            assert "celebration_level" in achievement_type
            assert "unlock_criteria" in achievement_type

            # 驗證 unlock_criteria schema
            criteria = achievement_type["unlock_criteria"]
            assert "metric" in criteria
            assert "threshold" in criteria


class TestShareCards:
    """T031: Contract test POST /share-cards"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試生成分享卡片 - 201 Created"""
        # 建立運動記錄以觸發成就
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            # 生成分享卡片
            card_request = {
                "achievement_id": achievement_id,
                "template": "celebration",
                "include_stats": True
            }
            response = await client.post(
                "/api/v1/share-cards",
                headers=auth_headers,
                json=card_request
            )

            assert response.status_code == 201

            # 驗證 response schema
            data = response.json()
            assert "card" in data

            card = data["card"]
            assert "id" in card
            assert "achievement_id" in card
            assert card["achievement_id"] == achievement_id
            assert "image_url" in card
            assert "created_at" in card
            assert "template" in card
            assert card["template"] == "celebration"

            # 驗證 image_url 格式
            assert card["image_url"].startswith("https://")

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_achievement_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的成就 - 404 Not Found"""
        card_request = {
            "achievement_id": "507f1f77bcf86cd799439999",
            "template": "default"
        }
        response = await client.post(
            "/api/v1/share-cards",
            headers=auth_headers,
            json=card_request
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_missing_achievement_id(self, auth_headers: dict, client: AsyncClient):
        """測試缺少 achievement_id - 400 Bad Request"""
        card_request = {"template": "default"}
        response = await client.post(
            "/api/v1/share-cards",
            headers=auth_headers,
            json=card_request
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_unauthorized(self, client: AsyncClient):
        """測試未認證生成 - 401 Unauthorized"""
        card_request = {
            "achievement_id": "507f1f77bcf86cd799439012",
            "template": "default"
        }
        response = await client.post("/api/v1/share-cards", json=card_request)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_share_card_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試取得分享卡片資訊 - 200 OK"""
        # 建立運動記錄以觸發成就
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            # 生成分享卡片
            card_response = await client.post(
                "/api/v1/share-cards",
                headers=auth_headers,
                json={"achievement_id": achievement_id}
            )
            card_id = card_response.json()["card"]["id"]

            # 取得分享卡片
            response = await client.get(f"/api/v1/share-cards/{card_id}", headers=auth_headers)

            assert response.status_code == 200

            # 驗證 response schema
            data = response.json()
            assert "id" in data
            assert data["id"] == card_id
            assert "achievement_id" in data
            assert "image_url" in data
            assert "template" in data
            assert "created_at" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_share_card_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的分享卡片 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(f"/api/v1/share-cards/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_share_card_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        fake_id = "507f1f77bcf86cd799439013"
        response = await client.get(f"/api/v1/share-cards/{fake_id}")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
