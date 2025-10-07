"""
Dashboards Widgets API Contract Tests (T023)
測試儀表板 Widget CRUD 端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestDashboardsWidgets:
    """T023: Contract test for Dashboards and Widgets CRUD"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_dashboards_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得儀表板列表 - 200 OK (FR-007, FR-011)"""
        response = await client.get("/api/v1/dashboards", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "dashboards" in data
        assert "total_count" in data
        assert isinstance(data["dashboards"], list)
        assert isinstance(data["total_count"], int)

        # 驗證儀表板 schema
        if len(data["dashboards"]) > 0:
            dashboard = data["dashboards"][0]
            assert "id" in dashboard
            assert "user_id" in dashboard
            assert "name" in dashboard
            assert "widgets" in dashboard
            assert "created_at" in dashboard
            assert "updated_at" in dashboard
            assert isinstance(dashboard["widgets"], list)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_success(self, auth_headers: dict, client: AsyncClient):
        """測試新增 Widget - 201 Created (FR-008)"""
        # 取得現有儀表板
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            # 新增 Widget
            widget_request = {
                "type": "streak_counter",
                "position": {"x": 0, "y": 0},
                "size": {"width": 6, "height": 4},
                "config": {"time_range": "30d"}
            }

            response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                headers=auth_headers,
                json=widget_request
            )

            assert response.status_code == 201

            # 驗證 response schema
            data = response.json()
            assert "id" in data
            assert "widgets" in data

            # 驗證新增的 Widget
            widgets = data["widgets"]
            new_widget = next((w for w in widgets if w["type"] == "streak_counter"), None)
            assert new_widget is not None
            assert "id" in new_widget
            assert new_widget["type"] == "streak_counter"
            assert "position" in new_widget
            assert "size" in new_widget
            assert "config" in new_widget

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_with_all_types(self, auth_headers: dict, client: AsyncClient):
        """測試新增各類型 Widget - 201 Created (FR-009)"""
        widget_types = [
            "total_duration",
            "total_distance",
            "calories_burned",
            "trend_chart",
            "heatmap",
            "pace_analysis"
        ]

        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            for idx, widget_type in enumerate(widget_types):
                widget_request = {
                    "type": widget_type,
                    "position": {"x": 0, "y": idx * 4},
                    "size": {"width": 12, "height": 4}
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/widgets",
                    headers=auth_headers,
                    json=widget_request
                )

                assert response.status_code == 201

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_exceeds_limit(self, auth_headers: dict, client: AsyncClient):
        """測試超過 Widget 數量限制 - 400 Bad Request (硬限制 20 個)"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            # 新增 21 個 Widget (超過硬限制 20 個)
            for i in range(21):
                widget_request = {
                    "type": "streak_counter",
                    "position": {"x": 0, "y": i * 4},
                    "size": {"width": 6, "height": 4}
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/widgets",
                    headers=auth_headers,
                    json=widget_request
                )

                if i < 20:
                    assert response.status_code == 201
                else:
                    # 第 21 個應該失敗
                    assert response.status_code == 400
                    data = response.json()
                    assert data["error"] == "BAD_REQUEST"
                    assert "limit" in data["message"].lower() or "max" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_widget_success(self, auth_headers: dict, client: AsyncClient):
        """測試更新 Widget - 200 OK (FR-008, FR-033)"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            if len(dashboard["widgets"]) > 0:
                widget_id = dashboard["widgets"][0]["id"]

                # 更新 Widget 位置和大小
                update_request = {
                    "position": {"x": 6, "y": 0},
                    "size": {"width": 6, "height": 6},
                    "config": {"time_range": "90d"}
                }

                response = await client.put(
                    f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
                    headers=auth_headers,
                    json=update_request
                )

                assert response.status_code == 200

                # 驗證更新成功
                data = response.json()
                updated_widget = next((w for w in data["widgets"] if w["id"] == widget_id), None)
                assert updated_widget is not None
                assert updated_widget["position"]["x"] == 6
                assert updated_widget["size"]["width"] == 6

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_widget_position_only(self, auth_headers: dict, client: AsyncClient):
        """測試只更新 Widget 位置 - 200 OK (拖拉操作)"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            if len(dashboard["widgets"]) > 0:
                widget_id = dashboard["widgets"][0]["id"]

                # 只更新位置
                update_request = {"position": {"x": 12, "y": 4}}

                response = await client.put(
                    f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
                    headers=auth_headers,
                    json=update_request
                )

                assert response.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_widget_success(self, auth_headers: dict, client: AsyncClient):
        """測試刪除 Widget - 204 No Content (FR-008)"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            # 新增一個 Widget
            widget_response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                headers=auth_headers,
                json={
                    "type": "streak_counter",
                    "position": {"x": 0, "y": 0},
                    "size": {"width": 6, "height": 4}
                }
            )

            if widget_response.status_code == 201:
                widgets = widget_response.json()["widgets"]
                widget_id = widgets[-1]["id"]

                # 刪除 Widget
                response = await client.delete(
                    f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
                    headers=auth_headers
                )

                assert response.status_code == 204

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_widget_not_found(self, auth_headers: dict, client: AsyncClient):
        """測試刪除不存在的 Widget - 404 Not Found"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]
            fake_widget_id = "widget-999999"

            response = await client.delete(
                f"/api/v1/dashboards/{dashboard_id}/widgets/{fake_widget_id}",
                headers=auth_headers
            )

            assert response.status_code == 404
            data = response.json()
            assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_unauthorized(self, client: AsyncClient):
        """測試未認證新增 Widget - 401 Unauthorized"""
        widget_request = {
            "type": "streak_counter",
            "position": {"x": 0, "y": 0},
            "size": {"width": 6, "height": 4}
        }

        response = await client.post(
            "/api/v1/dashboards/507f1f77bcf86cd799439014/widgets",
            json=widget_request
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_widget_unauthorized(self, client: AsyncClient):
        """測試未認證更新 Widget - 401 Unauthorized"""
        update_request = {"position": {"x": 6, "y": 0}}

        response = await client.put(
            "/api/v1/dashboards/507f1f77bcf86cd799439014/widgets/widget-001",
            json=update_request
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_widget_unauthorized(self, client: AsyncClient):
        """測試未認證刪除 Widget - 401 Unauthorized"""
        response = await client.delete(
            "/api/v1/dashboards/507f1f77bcf86cd799439014/widgets/widget-001"
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_invalid_type(self, auth_headers: dict, client: AsyncClient):
        """測試無效 Widget 類型 - 400 Bad Request"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            widget_request = {
                "type": "invalid_widget_type",
                "position": {"x": 0, "y": 0},
                "size": {"width": 6, "height": 4}
            }

            response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                headers=auth_headers,
                json=widget_request
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_add_widget_missing_required_fields(self, auth_headers: dict, client: AsyncClient):
        """測試缺少必要欄位 - 400 Bad Request"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            # 缺少 position
            widget_request = {
                "type": "streak_counter",
                "size": {"width": 6, "height": 4}
            }

            response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                headers=auth_headers,
                json=widget_request
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"
