"""
T040: 場景 2 - 大衛的客製化儀表板
基於 quickstart.md 的使用者場景 2
測試端到端流程：建立儀表板 → 新增 Widget → 拖拉排序 → 配置儲存
"""

import pytest
from httpx import AsyncClient
from datetime import datetime


class TestDashboardCreationWorkflow:
    """測試儀表板建立與管理完整流程"""

    @pytest.mark.asyncio
    async def test_david_creates_multiple_dashboards(self, async_client: AsyncClient, auth_headers):
        """
        場景: 大衛建立多個儀表板
        Given: 大衛是馬拉松訓練者
        When: 建立「訓練儀表板」與「恢復儀表板」
        Then:
        - ✅ 成功建立兩個獨立儀表板
        - ✅ 可自由切換不同儀表板
        """
        headers = auth_headers

        # Step 1: 建立訓練儀表板
        training_dashboard_data = {
            "name": "訓練儀表板"
        }

        training_response = await async_client.post(
            "/api/v1/dashboards",
            json=training_dashboard_data,
            headers=headers
        )

        assert training_response.status_code == 201
        training_dashboard = training_response.json()

        assert training_dashboard["name"] == "訓練儀表板"
        assert "id" in training_dashboard
        training_dashboard_id = training_dashboard["id"]

        # Step 2: 建立恢復儀表板
        recovery_dashboard_data = {
            "name": "恢復儀表板"
        }

        recovery_response = await async_client.post(
            "/api/v1/dashboards",
            json=recovery_dashboard_data,
            headers=headers
        )

        assert recovery_response.status_code == 201
        recovery_dashboard = recovery_response.json()

        assert recovery_dashboard["name"] == "恢復儀表板"
        recovery_dashboard_id = recovery_dashboard["id"]

        # Step 3: 取得所有儀表板
        dashboards_response = await async_client.get(
            "/api/v1/dashboards",
            headers=headers
        )

        assert dashboards_response.status_code == 200
        all_dashboards = dashboards_response.json()

        assert "dashboards" in all_dashboards
        assert all_dashboards["total_count"] >= 2

        # 驗證兩個儀表板都存在
        dashboard_ids = [d["id"] for d in all_dashboards["dashboards"]]
        assert training_dashboard_id in dashboard_ids
        assert recovery_dashboard_id in dashboard_ids


class TestWidgetManagement:
    """測試 Widget 新增、配置與拖拉功能"""

    @pytest.mark.asyncio
    async def test_add_multiple_widgets_to_dashboard(self, async_client: AsyncClient, auth_headers):
        """
        場景: 大衛新增多個 Widget
        Given: 訓練儀表板已建立
        When: 新增配速圖表、週里程、HRV 趨勢 Widget
        Then:
        - ✅ Widget 即時顯示數據
        - ✅ 可調整大小與位置
        - ✅ 配置變更立即儲存
        """
        headers = auth_headers

        # 建立儀表板
        dashboard_data = {"name": "測試儀表板"}
        dashboard_response = await async_client.post(
            "/api/v1/dashboards",
            json=dashboard_data,
            headers=headers
        )
        dashboard_id = dashboard_response.json()["id"]

        # Step 1: 新增配速圖表 Widget
        pace_widget_data = {
            "type": "pace_analysis",
            "position": {"x": 0, "y": 0},
            "size": {"width": 12, "height": 6},
            "config": {
                "time_range": "30d",
                "metric": "pace",
                "workout_type": "running",
                "chart_type": "line"
            }
        }

        pace_response = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=pace_widget_data,
            headers=headers
        )

        assert pace_response.status_code == 201
        pace_widget = pace_response.json()
        assert pace_widget["type"] == "pace_analysis"
        pace_widget_id = pace_widget["id"]

        # Step 2: 新增週里程 Widget
        distance_widget_data = {
            "type": "total_distance",
            "position": {"x": 0, "y": 6},
            "size": {"width": 6, "height": 4},
            "config": {
                "time_range": "7d",
                "workout_type": "running"
            }
        }

        distance_response = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=distance_widget_data,
            headers=headers
        )

        assert distance_response.status_code == 201

        # Step 3: 新增 HRV 趨勢 Widget
        hrv_widget_data = {
            "type": "hrv_trend",
            "position": {"x": 6, "y": 6},
            "size": {"width": 6, "height": 4},
            "config": {
                "time_range": "30d"
            }
        }

        hrv_response = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=hrv_widget_data,
            headers=headers
        )

        assert hrv_response.status_code == 201

        # Step 4: 驗證儀表板包含 3 個 Widget
        dashboard_get_response = await async_client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=headers
        )

        assert dashboard_get_response.status_code == 200
        dashboard_detail = dashboard_get_response.json()

        assert "widgets" in dashboard_detail
        assert len(dashboard_detail["widgets"]) == 3

        # Step 5: 更新 Widget 位置（模擬拖拉）
        updated_widget_data = {
            "position": {"x": 0, "y": 2},
            "size": {"width": 8, "height": 5}
        }

        update_response = await async_client.put(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{pace_widget_id}",
            json=updated_widget_data,
            headers=headers
        )

        assert update_response.status_code == 200
        updated_widget = update_response.json()

        assert updated_widget["position"]["x"] == 0
        assert updated_widget["position"]["y"] == 2
        assert updated_widget["size"]["width"] == 8
        assert updated_widget["size"]["height"] == 5

    @pytest.mark.asyncio
    async def test_widget_drag_configuration_persists(self, async_client: AsyncClient, auth_headers):
        """
        測試 Widget 拖拉配置持久化
        FR-033: Widget 拖拉操作即時反應
        驗證配置變更立即儲存，重新載入後仍保持
        """
        headers = auth_headers

        # 建立儀表板與 Widget
        dashboard_data = {"name": "拖拉測試儀表板"}
        dashboard_response = await async_client.post(
            "/api/v1/dashboards",
            json=dashboard_data,
            headers=headers
        )
        dashboard_id = dashboard_response.json()["id"]

        widget_data = {
            "type": "streak_counter",
            "position": {"x": 0, "y": 0},
            "size": {"width": 6, "height": 4},
            "config": {"time_range": "30d"}
        }

        widget_response = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=widget_data,
            headers=headers
        )
        widget_id = widget_response.json()["id"]

        # 更新位置
        new_position = {
            "position": {"x": 6, "y": 8},
            "size": {"width": 12, "height": 6}
        }

        await async_client.put(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_id}",
            json=new_position,
            headers=headers
        )

        # 重新取得儀表板，驗證配置保存
        reload_response = await async_client.get(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=headers
        )

        reloaded_dashboard = reload_response.json()
        reloaded_widget = reloaded_dashboard["widgets"][0]

        assert reloaded_widget["position"]["x"] == 6
        assert reloaded_widget["position"]["y"] == 8
        assert reloaded_widget["size"]["width"] == 12
        assert reloaded_widget["size"]["height"] == 6


class TestWidgetLimits:
    """測試 Widget 數量限制"""

    @pytest.mark.asyncio
    async def test_widget_limit_enforcement(self, async_client: AsyncClient, auth_headers):
        """
        場景: Widget 數量限制測試
        Given: 儀表板已有 11 個 Widget
        When: 嘗試新增第 12 個與第 21 個 Widget
        Then:
        - ✅ 第 12 個成功新增，顯示效能提示
        - ✅ 第 21 個被阻止，回傳錯誤訊息
        """
        headers = auth_headers

        # 建立儀表板
        dashboard_data = {"name": "限制測試儀表板"}
        dashboard_response = await async_client.post(
            "/api/v1/dashboards",
            json=dashboard_data,
            headers=headers
        )
        dashboard_id = dashboard_response.json()["id"]

        # 新增 11 個 Widget
        for i in range(11):
            widget_data = {
                "type": "trend_chart",
                "position": {"x": 0, "y": i * 4},
                "size": {"width": 6, "height": 4},
                "config": {"time_range": "30d", "metric": "distance"}
            }

            response = await async_client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                json=widget_data,
                headers=headers
            )

            assert response.status_code == 201

        # 新增第 12 個 Widget（應成功但有警告）
        widget_12_data = {
            "type": "trend_chart",
            "position": {"x": 6, "y": 44},
            "size": {"width": 6, "height": 4},
            "config": {"time_range": "30d", "metric": "distance"}
        }

        response_12 = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=widget_12_data,
            headers=headers
        )

        assert response_12.status_code == 201
        # 可選：檢查回應中的警告訊息
        result_12 = response_12.json()
        if "warning" in result_12:
            assert "performance" in result_12["warning"].lower()

        # 新增更多 Widget 直到達到 20 個
        for i in range(8):
            widget_data = {
                "type": "trend_chart",
                "position": {"x": 0, "y": (12 + i) * 4},
                "size": {"width": 6, "height": 4},
                "config": {"time_range": "30d", "metric": "distance"}
            }

            await async_client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                json=widget_data,
                headers=headers
            )

        # 嘗試新增第 21 個 Widget（應失敗）
        widget_21_data = {
            "type": "heatmap",
            "position": {"x": 6, "y": 80},
            "size": {"width": 6, "height": 4},
            "config": {"time_range": "30d"}
        }

        response_21 = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=widget_21_data,
            headers=headers
        )

        assert response_21.status_code == 400
        error_result = response_21.json()

        assert "error" in error_result
        assert "limit" in error_result["message"].lower()
        assert error_result["details"]["current_widgets"] == 20
        assert "max" in error_result["details"]["suggestion"].lower()

    @pytest.mark.asyncio
    async def test_widget_delete_allows_new_addition(self, async_client: AsyncClient, auth_headers):
        """
        測試刪除 Widget 後可新增新的 Widget
        驗證數量限制在刪除後正確更新
        """
        headers = auth_headers

        # 建立儀表板並新增 20 個 Widget
        dashboard_data = {"name": "刪除測試儀表板"}
        dashboard_response = await async_client.post(
            "/api/v1/dashboards",
            json=dashboard_data,
            headers=headers
        )
        dashboard_id = dashboard_response.json()["id"]

        widget_ids = []
        for i in range(20):
            widget_data = {
                "type": "trend_chart",
                "position": {"x": 0, "y": i * 4},
                "size": {"width": 6, "height": 4},
                "config": {"time_range": "30d", "metric": "distance"}
            }

            response = await async_client.post(
                f"/api/v1/dashboards/{dashboard_id}/widgets",
                json=widget_data,
                headers=headers
            )
            widget_ids.append(response.json()["id"])

        # 刪除一個 Widget
        delete_response = await async_client.delete(
            f"/api/v1/dashboards/{dashboard_id}/widgets/{widget_ids[0]}",
            headers=headers
        )

        assert delete_response.status_code == 204

        # 新增新的 Widget（應成功）
        new_widget_data = {
            "type": "heatmap",
            "position": {"x": 0, "y": 0},
            "size": {"width": 6, "height": 4},
            "config": {"time_range": "30d"}
        }

        new_response = await async_client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=new_widget_data,
            headers=headers
        )

        assert new_response.status_code == 201
