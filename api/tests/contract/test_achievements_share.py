"""
Achievements Share Card API Contract Tests (T022)
測試分享卡片生成端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestShareCards:
    """T022: Contract test POST /share-cards"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_success(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試生成分享卡片 - 201 Created (FR-005~FR-006)"""
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

            # 驗證 R2 URL 格式
            assert card["image_url"].startswith("https://")
            assert "r2.motionstory.com" in card["image_url"] or "cloudflare" in card["image_url"]

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_default_template(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試預設樣板 - 201 Created"""
        # 建立運動記錄以觸發成就
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            # 僅提供 achievement_id
            card_request = {"achievement_id": achievement_id}
            response = await client.post(
                "/api/v1/share-cards",
                headers=auth_headers,
                json=card_request
            )

            assert response.status_code == 201
            data = response.json()
            assert data["card"]["template"] == "default"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_minimal_template(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試 minimal 樣板 - 201 Created"""
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            card_request = {
                "achievement_id": achievement_id,
                "template": "minimal"
            }
            response = await client.post(
                "/api/v1/share-cards",
                headers=auth_headers,
                json=card_request
            )

            assert response.status_code == 201
            data = response.json()
            assert data["card"]["template"] == "minimal"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_share_card_without_stats(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試不包含統計資料 - 201 Created"""
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            card_request = {
                "achievement_id": achievement_id,
                "include_stats": False
            }
            response = await client.post(
                "/api/v1/share-cards",
                headers=auth_headers,
                json=card_request
            )

            assert response.status_code == 201
            data = response.json()
            assert "card" in data

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
    async def test_create_share_card_invalid_template(self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict):
        """測試無效樣板 - 400 Bad Request"""
        workout_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=sample_workout_data
        )

        achievements = workout_response.json().get("achievements_triggered", [])
        if len(achievements) > 0:
            achievement_id = achievements[0]["id"]

            card_request = {
                "achievement_id": achievement_id,
                "template": "invalid_template"
            }
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
