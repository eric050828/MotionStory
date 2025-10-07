"""
T039: 場景 1 - 小美的首次運動與慶祝動畫
基於 quickstart.md 的使用者場景 1 (Day 1)
測試端到端流程：註冊 → 建立運動 → 成就觸發 → 慶祝動畫
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


class TestBeginnerFirstWorkout:
    """測試新手使用者首次運動完整流程"""

    @pytest.mark.asyncio
    async def test_xiaomei_first_workout_celebration(self, async_client: AsyncClient):
        """
        場景: 小美首次運動與慶祝動畫
        Given: 小美是新註冊的使用者
        When: 完成第一次慢跑 20 分鐘
        Then:
        - ✅ 立即看到慶祝動畫（< 2 秒）
        - ✅ 解鎖「初心者」徽章（achievement_type: first_workout）
        - ✅ 慶祝等級為 basic
        """
        # Step 1: 註冊新帳號
        register_data = {
            "email": f"xiaomei_test_{datetime.now().timestamp()}@example.com",
            "password": "SecurePass123",
            "display_name": "小美",
        }

        register_response = await async_client.post(
            "/api/v1/auth/register",
            json=register_data
        )

        assert register_response.status_code == 201
        register_result = register_response.json()

        assert "access_token" in register_result
        assert register_result["user"]["display_name"] == "小美"

        access_token = register_result["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: 記錄第一次運動
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 20,
            "distance_km": 3.0,
            "pace_min_per_km": 6.67,
            "avg_heart_rate": 140,
            "calories": 200,
            "notes": "第一次慢跑",
        }

        workout_response = await async_client.post(
            "/api/v1/workouts",
            json=workout_data,
            headers=headers
        )

        assert workout_response.status_code == 201
        workout_result = workout_response.json()

        # Step 3: 驗證運動記錄建立成功
        assert "workout" in workout_result
        assert workout_result["workout"]["workout_type"] == "running"
        assert workout_result["workout"]["duration_minutes"] == 20
        assert workout_result["workout"]["notes"] == "第一次慢跑"

        # Step 4: 驗證成就觸發
        assert "achievements_triggered" in workout_result
        achievements = workout_result["achievements_triggered"]

        assert len(achievements) > 0, "應該觸發至少一個成就"

        # 驗證 first_workout 成就
        first_workout_achievement = next(
            (a for a in achievements if a["achievement_type"] == "first_workout"),
            None
        )

        assert first_workout_achievement is not None, "應該觸發 first_workout 成就"
        assert first_workout_achievement["celebration_level"] == "basic"

        # Step 5: 驗證慶祝動畫資訊完整
        assert "id" in first_workout_achievement
        assert "unlocked_at" in first_workout_achievement

    @pytest.mark.asyncio
    async def test_first_workout_response_time(self, async_client: AsyncClient):
        """
        測試回應時間要求
        FR-032: 運動記錄提交後系統回應時間 < 200ms
        """
        # 註冊使用者
        register_data = {
            "email": f"speed_test_{datetime.now().timestamp()}@example.com",
            "password": "SecurePass123",
            "display_name": "速度測試使用者",
        }

        register_response = await async_client.post(
            "/api/v1/auth/register",
            json=register_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 記錄運動並測量回應時間
        import time
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 20,
            "distance_km": 3.0,
        }

        start_time = time.time()
        workout_response = await async_client.post(
            "/api/v1/workouts",
            json=workout_data,
            headers=headers
        )
        elapsed_time = (time.time() - start_time) * 1000  # 轉換為毫秒

        assert workout_response.status_code == 201
        assert elapsed_time < 200, f"回應時間 {elapsed_time:.2f}ms 超過 200ms"

    @pytest.mark.asyncio
    async def test_achievement_persists_in_database(self, async_client: AsyncClient):
        """
        測試成就記錄持久化
        驗證成就確實儲存至資料庫，可後續查詢
        """
        # 註冊使用者並記錄首次運動
        register_data = {
            "email": f"persist_test_{datetime.now().timestamp()}@example.com",
            "password": "SecurePass123",
            "display_name": "持久化測試",
        }

        register_response = await async_client.post(
            "/api/v1/auth/register",
            json=register_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 記錄首次運動
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 20,
            "distance_km": 3.0,
        }

        workout_response = await async_client.post(
            "/api/v1/workouts",
            json=workout_data,
            headers=headers
        )

        achievements_triggered = workout_response.json()["achievements_triggered"]
        achievement_id = achievements_triggered[0]["id"]

        # 查詢成就列表，驗證記錄存在
        achievements_response = await async_client.get(
            "/api/v1/achievements",
            headers=headers
        )

        assert achievements_response.status_code == 200
        all_achievements = achievements_response.json()["achievements"]

        # 驗證 first_workout 成就存在於列表中
        found_achievement = next(
            (a for a in all_achievements if a["id"] == achievement_id),
            None
        )

        assert found_achievement is not None
        assert found_achievement["achievement_type"] == "first_workout"
        assert found_achievement["celebration_level"] == "basic"


class TestBeginnerMultipleWorkouts:
    """測試新手使用者多次運動記錄"""

    @pytest.mark.asyncio
    async def test_second_workout_no_duplicate_achievement(self, async_client: AsyncClient):
        """
        測試第二次運動不應重複觸發 first_workout 成就
        驗證成就唯一性
        """
        # 註冊使用者
        register_data = {
            "email": f"duplicate_test_{datetime.now().timestamp()}@example.com",
            "password": "SecurePass123",
            "display_name": "重複測試",
        }

        register_response = await async_client.post(
            "/api/v1/auth/register",
            json=register_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 第一次運動
        workout_data_1 = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 20,
            "distance_km": 3.0,
        }

        first_response = await async_client.post(
            "/api/v1/workouts",
            json=workout_data_1,
            headers=headers
        )

        first_achievements = first_response.json()["achievements_triggered"]
        assert len(first_achievements) > 0

        # 第二次運動
        workout_data_2 = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 25,
            "distance_km": 4.0,
        }

        second_response = await async_client.post(
            "/api/v1/workouts",
            json=workout_data_2,
            headers=headers
        )

        second_achievements = second_response.json()["achievements_triggered"]

        # 驗證第二次不應觸發 first_workout
        first_workout_in_second = any(
            a["achievement_type"] == "first_workout"
            for a in second_achievements
        )

        assert not first_workout_in_second, "第二次運動不應重複觸發 first_workout 成就"

    @pytest.mark.asyncio
    async def test_achievement_stats_updates(self, async_client: AsyncClient):
        """
        測試成就統計資料更新
        驗證成就統計 API 正確反映解鎖狀態
        """
        # 註冊使用者並記錄運動
        register_data = {
            "email": f"stats_test_{datetime.now().timestamp()}@example.com",
            "password": "SecurePass123",
            "display_name": "統計測試",
        }

        register_response = await async_client.post(
            "/api/v1/auth/register",
            json=register_data
        )
        access_token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 記錄首次運動
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 20,
            "distance_km": 3.0,
        }

        await async_client.post(
            "/api/v1/workouts",
            json=workout_data,
            headers=headers
        )

        # 查詢成就統計
        stats_response = await async_client.get(
            "/api/v1/achievements/stats",
            headers=headers
        )

        assert stats_response.status_code == 200
        stats = stats_response.json()

        assert "total_achievements" in stats
        assert stats["total_achievements"] >= 1
        assert "unlocked_achievements" in stats
        assert stats["unlocked_achievements"] >= 1
