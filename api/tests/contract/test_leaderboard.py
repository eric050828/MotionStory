"""
T206: Leaderboard Contract - 好友排行榜測試
基於 contracts/leaderboard.yaml 定義
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestLeaderboardContract:
    """好友排行榜 API 契約測試"""

    # ========== GET /leaderboard ==========

    async def test_get_leaderboard_success(self, client: AsyncClient, auth_headers: dict):
        """取得好友排行榜 - 成功"""
        response = await client.get(
            "/api/v1/leaderboard?period=week&metric=total_distance",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        assert "period" in data
        assert "metric" in data

    async def test_get_leaderboard_all_periods(self, client: AsyncClient, auth_headers: dict):
        """取得好友排行榜 - 各種週期"""
        periods = ["week", "month", "year", "all_time"]

        for period in periods:
            response = await client.get(
                f"/api/v1/leaderboard?period={period}&metric=total_distance",
                headers=auth_headers
            )
            assert response.status_code == 200

    async def test_get_leaderboard_all_metrics(self, client: AsyncClient, auth_headers: dict):
        """取得好友排行榜 - 各種指標"""
        metrics = ["total_distance", "total_duration", "workout_days", "achievement_count"]

        for metric in metrics:
            response = await client.get(
                f"/api/v1/leaderboard?period=week&metric={metric}",
                headers=auth_headers
            )
            assert response.status_code == 200

    async def test_get_leaderboard_missing_params(self, client: AsyncClient, auth_headers: dict):
        """取得好友排行榜 - 缺少必要參數"""
        response = await client.get(
            "/api/v1/leaderboard",
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation Error

    async def test_get_leaderboard_invalid_period(self, client: AsyncClient, auth_headers: dict):
        """取得好友排行榜 - 無效週期"""
        response = await client.get(
            "/api/v1/leaderboard?period=invalid&metric=total_distance",
            headers=auth_headers
        )

        assert response.status_code == 422

    async def test_get_leaderboard_with_pagination(self, client: AsyncClient, auth_headers: dict):
        """取得好友排行榜 - 分頁"""
        response = await client.get(
            "/api/v1/leaderboard?period=week&metric=total_distance&limit=10&offset=0",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "limit" in data
        assert "offset" in data

    async def test_get_leaderboard_unauthorized(self, client: AsyncClient):
        """取得好友排行榜 - 未授權返回 401"""
        response = await client.get(
            "/api/v1/leaderboard?period=week&metric=total_distance"
        )

        assert response.status_code == 401

    # ========== Leaderboard Schema ==========

    async def test_leaderboard_schema(self, client: AsyncClient, auth_headers: dict):
        """好友排行榜 - LeaderboardEntry schema 驗證"""
        response = await client.get(
            "/api/v1/leaderboard?period=week&metric=total_distance",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "leaderboard" in data
        assert "my_rank" in data
        assert "period" in data
        assert "metric" in data
        assert "period_start" in data
        assert "period_end" in data
        assert "last_updated" in data
        assert "total_count" in data

        for entry in data.get("leaderboard", []):
            assert "rank" in entry
            assert "user_id" in entry
            assert "display_name" in entry
            assert "value" in entry
            assert "unit" in entry
            assert "is_me" in entry

    async def test_my_rank_info(self, client: AsyncClient, auth_headers: dict):
        """好友排行榜 - 當前使用者排名資訊"""
        response = await client.get(
            "/api/v1/leaderboard?period=week&metric=total_distance",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        my_rank = data.get("my_rank")
        if my_rank is not None:
            assert "rank" in my_rank
            assert "value" in my_rank
            # gap_to_next 可能為 null
