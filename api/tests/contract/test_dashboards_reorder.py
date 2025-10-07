"""
Dashboards Reorder API Contract Tests (T024)
測試儀表板拖拉排序端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestDashboardsReorder:
    """T024: Contract test POST /dashboards/reorder"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_success(self, auth_headers: dict, client: AsyncClient):
        """測試 Widget 拖拉排序 - 200 OK (FR-010, FR-033)"""
        # 取得儀表板
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            # 確保至少有 2 個 Widget
            if len(dashboard["widgets"]) < 2:
                # 新增 Widget
                for i in range(2):
                    await client.post(
                        f"/api/v1/dashboards/{dashboard_id}/widgets",
                        headers=auth_headers,
                        json={
                            "type": "streak_counter",
                            "position": {"x": 0, "y": i * 4},
                            "size": {"width": 6, "height": 4}
                        }
                    )

            # 重新取得儀表板
            dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
            dashboard = dashboards_response.json()["dashboards"][0]
            widgets = dashboard["widgets"]

            # 建立新的排序順序 (交換前兩個 Widget 位置)
            reorder_request = {
                "widgets": [
                    {
                        "id": widgets[1]["id"],
                        "position": widgets[0]["position"]
                    },
                    {
                        "id": widgets[0]["id"],
                        "position": widgets[1]["position"]
                    }
                ]
            }

            # 執行排序
            response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/reorder",
                headers=auth_headers,
                json=reorder_request
            )

            assert response.status_code == 200

            # 驗證排序成功
            data = response.json()
            assert "widgets" in data
            assert isinstance(data["widgets"], list)

            # 驗證即時儲存 (updated_at 應該更新)
            assert "updated_at" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_immediate_save(self, auth_headers: dict, client: AsyncClient):
        """測試即時儲存功能 - 200 OK"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]
            original_updated_at = dashboard["updated_at"]

            if len(dashboard["widgets"]) > 0:
                widget = dashboard["widgets"][0]

                # 更新 Widget 位置
                reorder_request = {
                    "widgets": [
                        {
                            "id": widget["id"],
                            "position": {"x": 6, "y": 0}
                        }
                    ]
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/reorder",
                    headers=auth_headers,
                    json=reorder_request
                )

                assert response.status_code == 200

                # 驗證 updated_at 已更新 (即時儲存)
                data = response.json()
                assert data["updated_at"] != original_updated_at

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_multiple_widgets(self, auth_headers: dict, client: AsyncClient):
        """測試多個 Widget 同時排序 - 200 OK"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            # 新增 3 個 Widget
            widget_ids = []
            for i in range(3):
                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/widgets",
                    headers=auth_headers,
                    json={
                        "type": "streak_counter",
                        "position": {"x": 0, "y": i * 4},
                        "size": {"width": 6, "height": 4}
                    }
                )
                if response.status_code == 201:
                    widgets = response.json()["widgets"]
                    widget_ids.append(widgets[-1]["id"])

            if len(widget_ids) >= 3:
                # 重新排序所有 Widget
                reorder_request = {
                    "widgets": [
                        {"id": widget_ids[2], "position": {"x": 0, "y": 0}},
                        {"id": widget_ids[0], "position": {"x": 0, "y": 4}},
                        {"id": widget_ids[1], "position": {"x": 0, "y": 8}}
                    ]
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/reorder",
                    headers=auth_headers,
                    json=reorder_request
                )

                assert response.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_invalid_widget_id(self, auth_headers: dict, client: AsyncClient):
        """測試無效 Widget ID - 400 Bad Request"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            reorder_request = {
                "widgets": [
                    {"id": "invalid-widget-id", "position": {"x": 0, "y": 0}}
                ]
            }

            response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/reorder",
                headers=auth_headers,
                json=reorder_request
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_missing_position(self, auth_headers: dict, client: AsyncClient):
        """測試缺少 position 欄位 - 400 Bad Request"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            if len(dashboard["widgets"]) > 0:
                widget_id = dashboard["widgets"][0]["id"]

                reorder_request = {
                    "widgets": [
                        {"id": widget_id}  # 缺少 position
                    ]
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/reorder",
                    headers=auth_headers,
                    json=reorder_request
                )

                assert response.status_code == 400
                data = response.json()
                assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_empty_list(self, auth_headers: dict, client: AsyncClient):
        """測試空 Widget 列表 - 400 Bad Request"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard_id = dashboards[0]["id"]

            reorder_request = {"widgets": []}

            response = await client.post(
                f"/api/v1/dashboards/{dashboard_id}/reorder",
                headers=auth_headers,
                json=reorder_request
            )

            assert response.status_code == 400
            data = response.json()
            assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_nonexistent_dashboard(self, auth_headers: dict, client: AsyncClient):
        """測試不存在的儀表板 - 404 Not Found"""
        fake_dashboard_id = "507f1f77bcf86cd799439999"

        reorder_request = {
            "widgets": [
                {"id": "widget-001", "position": {"x": 0, "y": 0}}
            ]
        }

        response = await client.post(
            f"/api/v1/dashboards/{fake_dashboard_id}/reorder",
            headers=auth_headers,
            json=reorder_request
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NOT_FOUND"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_unauthorized(self, client: AsyncClient):
        """測試未認證排序 - 401 Unauthorized"""
        reorder_request = {
            "widgets": [
                {"id": "widget-001", "position": {"x": 0, "y": 0}}
            ]
        }

        response = await client.post(
            "/api/v1/dashboards/507f1f77bcf86cd799439014/reorder",
            json=reorder_request
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_invalid_position_values(self, auth_headers: dict, client: AsyncClient):
        """測試無效的位置值 - 400 Bad Request"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            if len(dashboard["widgets"]) > 0:
                widget_id = dashboard["widgets"][0]["id"]

                # 負數位置值
                reorder_request = {
                    "widgets": [
                        {"id": widget_id, "position": {"x": -1, "y": 0}}
                    ]
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/reorder",
                    headers=auth_headers,
                    json=reorder_request
                )

                assert response.status_code == 400
                data = response.json()
                assert data["error"] == "BAD_REQUEST"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_reorder_widgets_cross_device_sync(self, auth_headers: dict, client: AsyncClient):
        """測試跨裝置同步 (即時儲存) - 200 OK"""
        dashboards_response = await client.get("/api/v1/dashboards", headers=auth_headers)
        dashboards = dashboards_response.json()["dashboards"]

        if len(dashboards) > 0:
            dashboard = dashboards[0]
            dashboard_id = dashboard["id"]

            if len(dashboard["widgets"]) > 0:
                widget = dashboard["widgets"][0]

                # 執行排序
                reorder_request = {
                    "widgets": [
                        {"id": widget["id"], "position": {"x": 12, "y": 0}}
                    ]
                }

                response = await client.post(
                    f"/api/v1/dashboards/{dashboard_id}/reorder",
                    headers=auth_headers,
                    json=reorder_request
                )

                assert response.status_code == 200

                # 模擬另一裝置重新取得儀表板，應看到更新後的位置
                verify_response = await client.get(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)
                assert verify_response.status_code == 200

                verify_data = verify_response.json()
                updated_widget = next((w for w in verify_data["widgets"] if w["id"] == widget["id"]), None)
                assert updated_widget is not None
                assert updated_widget["position"]["x"] == 12
