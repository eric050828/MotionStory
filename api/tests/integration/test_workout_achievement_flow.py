"""
Integration Test: Workout Creation with Achievements (T051)
測試完整運動建立流程：建立運動 → 成就檢查 → 慶祝動畫觸發
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock


class TestWorkoutAchievementFlow:
    """測試運動建立與成就觸發整合"""

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_first_workout_triggers_achievement(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試首次運動觸發成就"""
        
        # 建立第一筆運動記錄
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.0,
            "pace_min_per_km": 6.0,
            "avg_heart_rate": 145,
            "calories": 300,
            "notes": "First workout!"
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )

        assert response.status_code == 201
        data = response.json()

        # 驗證運動記錄已建立
        assert "workout" in data
        workout = data["workout"]
        assert workout["workout_type"] == "running"

        # 驗證首次運動成就被觸發
        assert "achievements_triggered" in data
        achievements = data["achievements_triggered"]
        
        assert len(achievements) > 0
        first_workout_achievement = next(
            (a for a in achievements if a["achievement_type"] == "first_workout"), 
            None
        )
        assert first_workout_achievement is not None
        assert first_workout_achievement["celebration_level"] == "basic"

        # 驗證成就已儲存到資料庫
        db_achievement = await test_db.achievements.find_one({
            "achievement_type": "first_workout"
        })
        assert db_achievement is not None
        assert db_achievement["workout_id"] == workout["id"]

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_streak_achievement_triggers_on_consecutive_days(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試連續天數成就觸發"""
        
        # 建立連續 3 天的運動記錄
        for i in range(3):
            workout_date = datetime.now(timezone.utc) - timedelta(days=2-i)
            workout_data = {
                "workout_type": "running",
                "start_time": workout_date.isoformat(),
                "duration_minutes": 30,
                "distance_km": 5.0
            }

            response = await client.post(
                "/api/v1/workouts",
                headers=auth_headers,
                json=workout_data
            )

            assert response.status_code == 201

        # 最後一筆應該觸發 streak_3 成就
        last_response_data = response.json()
        achievements = last_response_data["achievements_triggered"]
        
        streak_3 = next(
            (a for a in achievements if a["achievement_type"] == "streak_3"),
            None
        )
        assert streak_3 is not None
        assert streak_3["celebration_level"] == "basic"
        assert streak_3["metadata"]["streak_days"] == 3

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_distance_milestone_achievement(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試距離里程碑成就"""
        
        # 建立一筆 5.2 公里的運動（超過 5K）
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2,
            "pace_min_per_km": 5.77,
            "avg_heart_rate": 145,
            "calories": 320
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )

        assert response.status_code == 201
        data = response.json()

        # 驗證 distance_5k 成就被觸發
        achievements = data["achievements_triggered"]
        distance_5k = next(
            (a for a in achievements if a["achievement_type"] == "distance_5k"),
            None
        )
        
        assert distance_5k is not None
        assert distance_5k["celebration_level"] == "fireworks"
        assert distance_5k["metadata"]["distance_km"] == 5.2

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_personal_record_achievement(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試個人紀錄成就"""
        
        # 建立第一筆運動（10km）
        workout1 = {
            "workout_type": "running",
            "start_time": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "duration_minutes": 60,
            "distance_km": 10.0
        }

        response1 = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout1
        )
        assert response1.status_code == 201

        # 建立第二筆運動（12km，打破紀錄）
        workout2 = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 70,
            "distance_km": 12.0
        }

        response2 = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout2
        )
        assert response2.status_code == 201
        data = response2.json()

        # 驗證個人紀錄成就被觸發
        achievements = data["achievements_triggered"]
        personal_record = next(
            (a for a in achievements if a["achievement_type"] == "personal_record_distance"),
            None
        )
        
        assert personal_record is not None
        assert personal_record["metadata"]["previous_record"] == 10.0
        assert personal_record["metadata"]["new_record"] == 12.0

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_multiple_achievements_triggered_simultaneously(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試同時觸發多個成就"""
        
        # 建立首次 5K 運動（同時觸發 first_workout 和 distance_5k）
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2,
            "pace_min_per_km": 5.77
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )

        assert response.status_code == 201
        data = response.json()

        achievements = data["achievements_triggered"]
        achievement_types = [a["achievement_type"] for a in achievements]

        # 應該同時觸發兩個成就
        assert "first_workout" in achievement_types
        assert "distance_5k" in achievement_types
        assert len(achievements) >= 2

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_achievement_not_duplicated(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試成就不會重複觸發"""
        
        # 建立第一筆 5K 運動
        workout1 = {
            "workout_type": "running",
            "start_time": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2
        }

        response1 = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout1
        )
        assert response1.status_code == 201
        achievements1 = response1.json()["achievements_triggered"]
        
        # 第一次應該觸發 distance_5k
        assert any(a["achievement_type"] == "distance_5k" for a in achievements1)

        # 建立第二筆 5K 運動
        workout2 = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.5
        }

        response2 = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout2
        )
        assert response2.status_code == 201
        achievements2 = response2.json()["achievements_triggered"]

        # 第二次不應該再觸發 distance_5k（已達成過）
        assert not any(a["achievement_type"] == "distance_5k" for a in achievements2)

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_achievement_share_card_generation(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試成就分享卡片生成"""
        
        # 建立運動觸發成就
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )
        assert response.status_code == 201
        
        achievements = response.json()["achievements_triggered"]
        achievement_id = achievements[0]["id"]

        # 生成分享卡片
        share_response = await client.post(
            f"/api/v1/achievements/{achievement_id}/share-card",
            headers=auth_headers
        )

        assert share_response.status_code == 201
        share_data = share_response.json()

        # 驗證分享卡片資料
        assert "share_card" in share_data
        share_card = share_data["share_card"]
        assert share_card["image_url"].startswith("https://")
        assert share_card["achievement_type"] in ["first_workout", "distance_5k"]

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_celebration_animation_data_in_response(self, auth_headers: dict, client: AsyncClient):
        """測試回應包含慶祝動畫資料"""
        
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2
        }

        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )

        assert response.status_code == 201
        data = response.json()

        achievements = data["achievements_triggered"]
        
        for achievement in achievements:
            # 每個成就應包含慶祝等級
            assert "celebration_level" in achievement
            assert achievement["celebration_level"] in ["basic", "fireworks", "epic"]
            
            # 應包含前端顯示用的元數據
            assert "metadata" in achievement
            assert "achieved_at" in achievement

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_workout_deletion_does_not_remove_achievements(self, auth_headers: dict, client: AsyncClient, test_db):
        """測試刪除運動不會移除已觸發的成就"""
        
        # 建立運動觸發成就
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2
        }

        create_response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )
        assert create_response.status_code == 201
        
        workout_id = create_response.json()["workout"]["id"]
        achievements = create_response.json()["achievements_triggered"]
        achievement_id = achievements[0]["id"]

        # 刪除運動
        delete_response = await client.delete(
            f"/api/v1/workouts/{workout_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200

        # 驗證成就仍然存在
        achievement_response = await client.get(
            f"/api/v1/achievements/{achievement_id}",
            headers=auth_headers
        )
        assert achievement_response.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_achievement_performance_under_load(self, auth_headers: dict, client: AsyncClient):
        """測試成就檢測效能（應在 500ms 內完成）"""
        import time

        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 30,
            "distance_km": 5.2
        }

        start_time = time.time()
        response = await client.post(
            "/api/v1/workouts",
            headers=auth_headers,
            json=workout_data
        )
        end_time = time.time()

        assert response.status_code == 201
        
        # 運動建立 + 成就檢查應在 500ms 內完成
        duration = end_time - start_time
        assert duration < 0.5, f"Workout creation + achievement check took {duration:.2f}s, expected < 0.5s"

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_achievement_types_list_endpoint(self, auth_headers: dict, client: AsyncClient):
        """測試成就類型列表 API"""
        
        response = await client.get(
            "/api/v1/achievements/types",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "achievement_types" in data
        types = data["achievement_types"]

        # 驗證包含所有主要成就類型
        type_names = [t["type"] for t in types]
        assert "first_workout" in type_names
        assert "streak_3" in type_names
        assert "streak_7" in type_names
        assert "distance_5k" in type_names
        assert "distance_10k" in type_names

        # 每個類型應包含描述和慶祝等級
        for achievement_type in types:
            assert "type" in achievement_type
            assert "title" in achievement_type
            assert "description" in achievement_type
            assert "celebration_level" in achievement_type
