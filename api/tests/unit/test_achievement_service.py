"""
T032: Achievement Service 業務邏輯測試
測試成就檢查引擎與業務邏輯
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId

from src.services.achievement_service import AchievementService
from src.models.workout import WorkoutInDB


class TestAchievementServiceFirstWorkout:
    """測試首次運動成就檢測"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.achievements = AsyncMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def achievement_service(self, mock_db):
        """Achievement Service fixture"""
        return AchievementService(mock_db)

    @pytest.mark.asyncio
    async def test_first_workout_achievement_triggered(self, achievement_service, mock_db):
        """測試首次運動成就觸發"""
        user_id = str(ObjectId())

        # 模擬尚未有 first_workout 成就
        mock_db.achievements.find_one = AsyncMock(return_value=None)

        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_db.achievements.insert_one = AsyncMock(return_value=mock_result)

        achievement = await achievement_service._check_first_workout(user_id)

        assert achievement is not None
        assert achievement.achievement_type == "first_workout"
        assert achievement.celebration_level == "basic"
        mock_db.achievements.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_first_workout_already_achieved(self, achievement_service, mock_db):
        """測試首次運動成就已達成"""
        user_id = str(ObjectId())

        # 模擬已有 first_workout 成就
        mock_existing = {
            "_id": ObjectId(),
            "user_id": ObjectId(user_id),
            "achievement_type": "first_workout",
            "celebration_level": "basic",
        }
        mock_db.achievements.find_one = AsyncMock(return_value=mock_existing)

        achievement = await achievement_service._check_first_workout(user_id)

        assert achievement is None


class TestAchievementServiceStreakDays:
    """測試連續天數成就檢測"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.achievements = AsyncMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def achievement_service(self, mock_db):
        """Achievement Service fixture"""
        return AchievementService(mock_db)

    @pytest.mark.asyncio
    async def test_calculate_streak_consecutive_days(self, achievement_service, mock_db):
        """測試計算連續天數 (連續 7 天)"""
        user_id = str(ObjectId())

        # 模擬 7 天連續運動記錄
        base_date = datetime(2024, 12, 31, tzinfo=timezone.utc)
        mock_workouts = [
            {"start_time": base_date - timedelta(days=i)} for i in range(7)
        ]

        mock_cursor = MagicMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(return_value=mock_workouts)
        mock_db.workouts.find = MagicMock(return_value=mock_cursor)

        current_workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=base_date,
            duration_minutes=45,
            created_at=base_date,
            updated_at=base_date,
        )

        streak_days = await achievement_service._calculate_streak_days(user_id, current_workout)

        assert streak_days == 7

    @pytest.mark.asyncio
    async def test_calculate_streak_broken(self, achievement_service, mock_db):
        """測試計算連續天數 (中斷)"""
        user_id = str(ObjectId())

        # 模擬運動記錄有中斷 (第 3、4 天缺席)
        base_date = datetime(2024, 12, 31, tzinfo=timezone.utc)
        mock_workouts = [
            {"start_time": base_date},
            {"start_time": base_date - timedelta(days=1)},
            {"start_time": base_date - timedelta(days=2)},
            {"start_time": base_date - timedelta(days=5)},  # 中斷
        ]

        mock_cursor = MagicMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(return_value=mock_workouts)
        mock_db.workouts.find = MagicMock(return_value=mock_cursor)

        current_workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=base_date,
            duration_minutes=45,
            created_at=base_date,
            updated_at=base_date,
        )

        streak_days = await achievement_service._calculate_streak_days(user_id, current_workout)

        assert streak_days == 3  # 僅連續 3 天

    @pytest.mark.asyncio
    async def test_streak_7_achievement_triggered(self, achievement_service, mock_db):
        """測試連續 7 天成就觸發"""
        user_id = str(ObjectId())

        # 模擬 7 天連續
        base_date = datetime(2024, 12, 31, tzinfo=timezone.utc)
        mock_workouts = [
            {"start_time": base_date - timedelta(days=i)} for i in range(7)
        ]

        mock_cursor = MagicMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(return_value=mock_workouts)
        mock_db.workouts.find = MagicMock(return_value=mock_cursor)

        # 模擬尚未達成 streak_7
        mock_db.achievements.find_one = AsyncMock(return_value=None)

        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_db.achievements.insert_one = AsyncMock(return_value=mock_result)

        current_workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=base_date,
            duration_minutes=45,
            created_at=base_date,
            updated_at=base_date,
        )

        achievements = await achievement_service._check_streak_achievements(user_id, current_workout)

        assert len(achievements) > 0
        assert any(a.achievement_type == "streak_7" for a in achievements)


class TestAchievementServiceDistanceMilestones:
    """測試距離里程碑成就檢測"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.achievements = AsyncMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def achievement_service(self, mock_db):
        """Achievement Service fixture"""
        return AchievementService(mock_db)

    @pytest.mark.asyncio
    async def test_distance_5k_achievement_triggered(self, achievement_service, mock_db):
        """測試首次 5K 成就觸發"""
        user_id = str(ObjectId())

        # 模擬尚未達成 distance_5k
        mock_db.achievements.find_one = AsyncMock(return_value=None)

        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_db.achievements.insert_one = AsyncMock(return_value=mock_result)

        workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=datetime.now(timezone.utc),
            duration_minutes=30,
            distance_km=5.2,  # 超過 5K
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        achievements = await achievement_service._check_distance_achievements(user_id, workout)

        assert len(achievements) > 0
        assert any(a.achievement_type == "distance_5k" for a in achievements)

    @pytest.mark.asyncio
    async def test_distance_half_marathon_achievement_triggered(self, achievement_service, mock_db):
        """測試首次半馬成就觸發"""
        user_id = str(ObjectId())

        # 模擬尚未達成 distance_half_marathon
        mock_db.achievements.find_one = AsyncMock(return_value=None)

        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_db.achievements.insert_one = AsyncMock(return_value=mock_result)

        workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=datetime.now(timezone.utc),
            duration_minutes=120,
            distance_km=21.5,  # 超過半馬 21.1K
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        achievements = await achievement_service._check_distance_achievements(user_id, workout)

        assert len(achievements) > 0
        assert any(a.achievement_type == "distance_half_marathon" for a in achievements)
        # 應同時觸發 5K 和 10K 成就
        assert any(a.achievement_type == "distance_5k" for a in achievements)
        assert any(a.achievement_type == "distance_10k" for a in achievements)

    @pytest.mark.asyncio
    async def test_distance_achievement_no_distance(self, achievement_service, mock_db):
        """測試無距離運動不觸發距離成就"""
        user_id = str(ObjectId())

        workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="yoga",  # 瑜伽無距離
            start_time=datetime.now(timezone.utc),
            duration_minutes=60,
            distance_km=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        achievements = await achievement_service._check_distance_achievements(user_id, workout)

        assert len(achievements) == 0


class TestAchievementServicePersonalRecords:
    """測試個人紀錄成就檢測"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.achievements = AsyncMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def achievement_service(self, mock_db):
        """Achievement Service fixture"""
        return AchievementService(mock_db)

    @pytest.mark.asyncio
    async def test_personal_record_distance_triggered(self, achievement_service, mock_db):
        """測試個人距離紀錄成就觸發"""
        user_id = str(ObjectId())

        # 模擬之前最佳距離為 8.0 公里
        mock_previous_record = {
            "_id": ObjectId(),
            "user_id": ObjectId(user_id),
            "workout_type": "running",
            "distance_km": 8.0,
        }
        mock_db.workouts.find_one = AsyncMock(return_value=mock_previous_record)

        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_db.achievements.insert_one = AsyncMock(return_value=mock_result)

        # 新運動記錄打破紀錄
        workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=datetime.now(timezone.utc),
            duration_minutes=50,
            distance_km=10.0,  # 打破 8.0 紀錄
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        achievements = await achievement_service._check_personal_records(user_id, workout)

        assert len(achievements) > 0
        assert achievements[0].achievement_type == "personal_record_distance"
        assert achievements[0].celebration_level == "fireworks"

    @pytest.mark.asyncio
    async def test_personal_record_not_broken(self, achievement_service, mock_db):
        """測試未打破個人紀錄"""
        user_id = str(ObjectId())

        # 模擬之前最佳距離為 10.0 公里
        mock_previous_record = {
            "_id": ObjectId(),
            "user_id": ObjectId(user_id),
            "workout_type": "running",
            "distance_km": 10.0,
        }
        mock_db.workouts.find_one = AsyncMock(return_value=mock_previous_record)

        # 新運動記錄未打破紀錄
        workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=datetime.now(timezone.utc),
            duration_minutes=45,
            distance_km=8.5,  # 未打破 10.0 紀錄
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        achievements = await achievement_service._check_personal_records(user_id, workout)

        assert len(achievements) == 0

    @pytest.mark.asyncio
    async def test_personal_record_first_workout_of_type(self, achievement_service, mock_db):
        """測試首次該類型運動不觸發個人紀錄"""
        user_id = str(ObjectId())

        # 模擬沒有之前的記錄
        mock_db.workouts.find_one = AsyncMock(return_value=None)

        workout = WorkoutInDB(
            id=ObjectId(),
            user_id=ObjectId(user_id),
            workout_type="running",
            start_time=datetime.now(timezone.utc),
            duration_minutes=45,
            distance_km=8.5,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        achievements = await achievement_service._check_personal_records(user_id, workout)

        assert len(achievements) == 0  # 首次運動不觸發個人紀錄成就
