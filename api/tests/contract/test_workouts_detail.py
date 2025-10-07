"""
T020: Workouts API Contract Test - Detail Operations
測試單筆運動記錄的 CRUD 操作端點的 request/response contract
"""

import pytest
from httpx import AsyncClient


class TestWorkoutsDetail:
    """T020: Contract test GET/PUT/DELETE /workouts/{workout_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_success(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試取得單筆運動記錄 - 200 OK"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 取得記錄
        response = await client.get(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers
        )

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert data["id"] == workout_id
        assert "user_id" in data
        assert "workout_type" in data
        assert "start_time" in data
        assert "duration_minutes" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert "is_deleted" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_not_found(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(
            f"/api/v1/workouts/{fake_id}", headers=auth_headers
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"
        assert "message" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_invalid_id_format(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試無效的 ID 格式 - 400 Bad Request"""
        invalid_id = "invalid-id-format"
        response = await client.get(
            f"/api/v1/workouts/{invalid_id}", headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_workout_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        fake_id = "507f1f77bcf86cd799439011"
        response = await client.get(f"/api/v1/workouts/{fake_id}")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_workout_success(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試更新運動記錄 - 200 OK"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 更新記錄
        update_data = {
            "duration_minutes": 45,
            "distance_km": 7.5,
            "notes": "Updated workout note",
        }
        response = await client.put(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers, json=update_data
        )

        assert response.status_code == 200

        # 驗證更新結果
        data = response.json()
        assert data["id"] == workout_id
        assert data["duration_minutes"] == 45
        assert data["distance_km"] == 7.5
        assert data["notes"] == "Updated workout note"

        # 驗證 updated_at 已更新
        assert "updated_at" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_workout_partial_fields(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試部分欄位更新 - 200 OK"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]
        original_type = create_response.json()["workout"]["workout_type"]

        # 只更新 notes
        update_data = {"notes": "Just update the note"}
        response = await client.put(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers, json=update_data
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證只有 notes 被更新，其他欄位保持不變
        assert data["notes"] == "Just update the note"
        assert data["workout_type"] == original_type

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_workout_invalid_data(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試更新為無效資料 - 400 Bad Request"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 嘗試更新為無效的運動類型
        update_data = {"workout_type": "invalid_type"}
        response = await client.put(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers, json=update_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_workout_not_found(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試更新不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        update_data = {"notes": "New note"}

        response = await client.put(
            f"/api/v1/workouts/{fake_id}", headers=auth_headers, json=update_data
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_workout_success(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試軟刪除運動記錄 - 204 No Content"""
        # 建立運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 刪除記錄
        response = await client.delete(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers
        )

        assert response.status_code == 204
        assert response.content == b""

        # 驗證記錄已被軟刪除（再次取得應該 404 或標記為已刪除）
        get_response = await client.get(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers
        )
        assert get_response.status_code in [404, 200]

        if get_response.status_code == 200:
            # 如果可以取得，應該標記為已刪除
            data = get_response.json()
            assert data.get("is_deleted") is True

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_workout_not_found(
        self, auth_headers: dict, client: AsyncClient
    ):
        """測試刪除不存在的記錄 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.delete(
            f"/api/v1/workouts/{fake_id}", headers=auth_headers
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_workout_already_deleted(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試刪除已刪除的記錄 - 404 Not Found"""
        # 建立並刪除運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]

        # 第一次刪除
        await client.delete(f"/api/v1/workouts/{workout_id}", headers=auth_headers)

        # 第二次刪除應該失敗
        response = await client.delete(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_deleted_workout(
        self, auth_headers: dict, client: AsyncClient, sample_workout_data: dict
    ):
        """測試更新已刪除的記錄 - 404 Not Found"""
        # 建立並刪除運動記錄
        create_response = await client.post(
            "/api/v1/workouts", headers=auth_headers, json=sample_workout_data
        )
        workout_id = create_response.json()["workout"]["id"]
        await client.delete(f"/api/v1/workouts/{workout_id}", headers=auth_headers)

        # 嘗試更新已刪除的記錄
        update_data = {"notes": "Try to update deleted workout"}
        response = await client.put(
            f"/api/v1/workouts/{workout_id}", headers=auth_headers, json=update_data
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"
