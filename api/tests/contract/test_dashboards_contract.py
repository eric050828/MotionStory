"""
Dashboards API Contract Tests (T032-T035)
測試 Dashboards API 端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestDashboardsList:
    """T032: Contract test GET /dashboards"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_dashboards_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得儀表板列表 - 200 OK"""
        response = await client.get("/api/v1/dashboards", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "dashboards" in data
        assert "total_count" in data
        assert isinstance(data["dashboards"], list)
        assert isinstance(data["total_count"], int)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_list_dashboards_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/dashboards")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestDashboardsCreate:
    """T033: Contract test POST /dashboards"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_dashboard_success(self, auth_headers: dict, client: AsyncClient):
        """測試建立儀表板 - 201 Created"""
        dashboard_data = {"name": "訓練儀表板"}

        response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json=dashboard_data
        )

        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "id" in data
        assert "user_id" in data
        assert "name" in data
        assert data["name"] == dashboard_data["name"]
        assert "widgets" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert isinstance(data["widgets"], list)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_dashboard_missing_name(self, auth_headers: dict, client: AsyncClient):
        """測試缺少名稱 - 400 Bad Request"""
        dashboard_data = {}

        response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json=dashboard_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_create_dashboard_unauthorized(self, client: AsyncClient):
        """測試未認證建立 - 401 Unauthorized"""
        dashboard_data = {"name": "測試儀表板"}

        response = await client.post("/api/v1/dashboards", json=dashboard_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_dashboard_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得單一儀表板 - 200 OK"""
        # 建立儀表板
        create_response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "測試儀表板"}
        )
        dashboard_id = create_response.json()["id"]

        # 取得儀表板
        response = await client.get(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert data["id"] == dashboard_id
        assert "name" in data
        assert "widgets" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_dashboard_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的儀表板 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.get(f"/api/v1/dashboards/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestDashboardsUpdate:
    """T034: Contract test PUT /dashboards/{dashboard_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_dashboard_name(self, auth_headers: dict, client: AsyncClient):
        """測試更新儀表板名稱 - 200 OK"""
        # 建立儀表板
        create_response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "原始名稱"}
        )
        dashboard_id = create_response.json()["id"]

        # 更新名稱
        update_data = {"name": "更新後名稱"}
        response = await client.put(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == 200

        # 驗證更新結果
        data = response.json()
        assert data["id"] == dashboard_id
        assert data["name"] == "更新後名稱"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_dashboard_widgets(self, auth_headers: dict, client: AsyncClient):
        """測試更新 Widget 配置 - 200 OK"""
        # 建立儀表板
        create_response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "Widget 儀表板"}
        )
        dashboard_id = create_response.json()["id"]

        # 更新 Widget 配置
        update_data = {
            "widgets": [
                {
                    "id": "widget-001",
                    "type": "streak_counter",
                    "position": {"x": 0, "y": 0},
                    "size": {"width": 6, "height": 4},
                    "config": {"time_range": "30d"}
                }
            ]
        }
        response = await client.put(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == 200

        # 驗證 Widget 配置
        data = response.json()
        assert len(data["widgets"]) == 1
        assert data["widgets"][0]["type"] == "streak_counter"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_dashboard_widget_limit_exceeded(self, auth_headers: dict, client: AsyncClient):
        """測試超過 Widget 數量限制 - 400 Bad Request"""
        # 建立儀表板
        create_response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "測試儀表板"}
        )
        dashboard_id = create_response.json()["id"]

        # 嘗試新增超過 20 個 Widget
        widgets = [
            {
                "id": f"widget-{i:03d}",
                "type": "streak_counter",
                "position": {"x": 0, "y": i * 4},
                "size": {"width": 6, "height": 4},
                "config": {}
            }
            for i in range(21)  # 21 個 Widget
        ]

        update_data = {"widgets": widgets}
        response = await client.put(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"
        assert "limit" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_dashboard_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試更新不存在的儀表板 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        update_data = {"name": "新名稱"}

        response = await client.put(
            f"/api/v1/dashboards/{fake_id}",
            headers=auth_headers,
            json=update_data
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"


class TestDashboardsDelete:
    """T035: Contract test DELETE /dashboards/{dashboard_id}"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_dashboard_success(self, auth_headers: dict, client: AsyncClient):
        """測試刪除儀表板 - 204 No Content"""
        # 建立兩個儀表板（確保不是最後一個）
        await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "儀表板 1"}
        )
        create_response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "儀表板 2"}
        )
        dashboard_id = create_response.json()["id"]

        # 刪除儀表板
        response = await client.delete(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)

        assert response.status_code == 204
        assert response.content == b''

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_last_dashboard_forbidden(self, auth_headers: dict, client: AsyncClient):
        """測試刪除最後一個儀表板 - 400 Bad Request"""
        # 取得所有儀表板
        list_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = list_response.json()["dashboards"]

        # 如果只有一個儀表板，嘗試刪除應該失敗
        if len(dashboards) == 1:
            dashboard_id = dashboards[0]["id"]
            response = await client.delete(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"
            assert "last" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_dashboard_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試刪除不存在的儀表板 - 404 Not Found"""
        fake_id = "507f1f77bcf86cd799439999"
        response = await client.delete(f"/api/v1/dashboards/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_to_dashboard(self, auth_headers: dict, client: AsyncClient):
        """測試新增 Widget 至儀表板 - 201 Created"""
        # 建立儀表板
        create_response = await client.post(
            "/api/v1/dashboards",
            headers=auth_headers,
            json={"name": "測試儀表板"}
        )
        dashboard_id = create_response.json()["id"]

        # 新增 Widget
        widget_data = {
            "type": "pace_analysis",
            "position": {"x": 0, "y": 0},
            "size": {"width": 12, "height": 6},
            "config": {
                "time_range": "30d",
                "metric": "pace",
                "chart_type": "line"
            }
        }

        response = await client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            headers=auth_headers,
            json=widget_data
        )

        assert response.status_code == 201

        # 驗證儀表板包含新 Widget
        data = response.json()
        assert len(data["widgets"]) > 0
        # 找到新增的 Widget
        added_widget = next((w for w in data["widgets"] if w["type"] == "pace_analysis"), None)
        assert added_widget is not None
        assert added_widget["position"] == {"x": 0, "y": 0}

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_widget_types_success(self, client: AsyncClient):
        """測試取得 Widget 類型列表 - 200 OK (不需認證)"""
        response = await client.get("/api/v1/widgets/types")

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "widget_types" in data
        assert isinstance(data["widget_types"], list)

        # 驗證 Widget 類型定義 schema
        if len(data["widget_types"]) > 0:
            widget_type = data["widget_types"][0]
            assert "type" in widget_type
            assert "name" in widget_type
            assert "description" in widget_type
            assert "category" in widget_type
            assert "default_size" in widget_type
            assert widget_type["category"] in ["basic_stats", "charts", "advanced_stats"]
