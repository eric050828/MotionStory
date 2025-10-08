"""
T031: Workout Service 業務邏輯測試
測試運動記錄服務的 CRUD 操作與業務邏輯
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId

from src.services.workout_service import WorkoutService
from src.models.workout import WorkoutCreate, WorkoutUpdate


class TestWorkoutServiceCRUD:
    """測試 Workout Service CRUD 操作"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def workout_service(self, mock_db):
        """Workout Service fixture"""
        return WorkoutService(mock_db)

    @pytest.mark.asyncio
    async def test_create_workout_success(self, workout_service, mock_db):
        """測試建立運動記錄成功"""
        user_id = str(ObjectId())
        workout_data = WorkoutCreate(
            workout_type="running",
            start_time=datetime.now(timezone.utc),
            duration_minutes=45,
            distance_km=8.5,
        )

        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_db.workouts.insert_one = AsyncMock(return_value=mock_result)

        result = await workout_service.create_workout(user_id, workout_data)

        assert result is not None
        assert result.workout_type == "running"
        assert result.duration_minutes == 45
        mock_db.workouts.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_workout_existing(self, workout_service, mock_db):
        """測試取得存在的運動記錄"""
        user_id = str(ObjectId())
        workout_id = str(ObjectId())

        mock_workout = {
            "_id": ObjectId(workout_id),
            "user_id": ObjectId(user_id),
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 45,
            "distance_km": 8.5,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        mock_db.workouts.find_one = AsyncMock(return_value=mock_workout)

        result = await workout_service.get_workout(workout_id, user_id)

        assert result is not None
        assert result.workout_type == "running"
        mock_db.workouts.find_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_workout_not_found(self, workout_service, mock_db):
        """測試取得不存在的運動記錄"""
        user_id = str(ObjectId())
        workout_id = str(ObjectId())

        mock_db.workouts.find_one = AsyncMock(return_value=None)

        result = await workout_service.get_workout(workout_id, user_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_workout_wrong_user(self, workout_service, mock_db):
        """測試取得其他使用者的運動記錄"""
        user_id = str(ObjectId())
        wrong_user_id = str(ObjectId())
        workout_id = str(ObjectId())

        mock_db.workouts.find_one = AsyncMock(return_value=None)

        result = await workout_service.get_workout(workout_id, wrong_user_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_update_workout_success(self, workout_service, mock_db):
        """測試更新運動記錄成功"""
        user_id = str(ObjectId())
        workout_id = str(ObjectId())

        update_data = WorkoutUpdate(
            duration_minutes=50,
            distance_km=9.0,
        )

        mock_updated = {
            "_id": ObjectId(workout_id),
            "user_id": ObjectId(user_id),
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 50,
            "distance_km": 9.0,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        mock_db.workouts.find_one_and_update = AsyncMock(return_value=mock_updated)

        result = await workout_service.update_workout(workout_id, user_id, update_data)

        assert result is not None
        assert result.duration_minutes == 50
        assert result.distance_km == 9.0
        mock_db.workouts.find_one_and_update.assert_called_once()

    @pytest.mark.asyncio
    async def test_soft_delete_workout_success(self, workout_service, mock_db):
        """測試軟刪除運動記錄成功"""
        user_id = str(ObjectId())
        workout_id = str(ObjectId())

        mock_result = MagicMock()
        mock_result.modified_count = 1
        mock_db.workouts.update_one = AsyncMock(return_value=mock_result)

        result = await workout_service.soft_delete_workout(workout_id, user_id)

        assert result is True
        mock_db.workouts.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_restore_workout_success(self, workout_service, mock_db):
        """測試復原已刪除運動記錄成功"""
        user_id = str(ObjectId())
        workout_id = str(ObjectId())

        mock_deleted_workout = {
            "_id": ObjectId(workout_id),
            "user_id": ObjectId(user_id),
            "workout_type": "running",
            "is_deleted": True,
            "deleted_at": datetime.now(timezone.utc),
            "delete_after": datetime.now(timezone.utc) + timedelta(days=30),
        }

        mock_restored = {**mock_deleted_workout, "is_deleted": False}

        mock_db.workouts.find_one = AsyncMock(return_value=mock_deleted_workout)
        mock_db.workouts.find_one_and_update = AsyncMock(return_value=mock_restored)

        result = await workout_service.restore_workout(workout_id, user_id)

        assert result is not None
        mock_db.workouts.find_one.assert_called_once()
        mock_db.workouts.find_one_and_update.assert_called_once()

    @pytest.mark.asyncio
    async def test_restore_workout_expired(self, workout_service, mock_db):
        """測試復原超過期限的已刪除記錄"""
        user_id = str(ObjectId())
        workout_id = str(ObjectId())

        mock_deleted_workout = {
            "_id": ObjectId(workout_id),
            "user_id": ObjectId(user_id),
            "workout_type": "running",
            "is_deleted": True,
            "deleted_at": datetime.now(timezone.utc) - timedelta(days=31),
            "delete_after": datetime.now(timezone.utc) - timedelta(days=1),  # 已過期
        }

        mock_db.workouts.find_one = AsyncMock(return_value=mock_deleted_workout)

        result = await workout_service.restore_workout(workout_id, user_id)

        assert result is None


class TestWorkoutServiceBatch:
    """測試 Workout Service 批次操作"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def workout_service(self, mock_db):
        """Workout Service fixture"""
        return WorkoutService(mock_db)

    @pytest.mark.asyncio
    async def test_batch_create_all_success(self, workout_service):
        """測試批次建立全部成功"""
        user_id = str(ObjectId())
        workouts_data = [
            WorkoutCreate(
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=45,
            ),
            WorkoutCreate(
                workout_type="cycling",
                start_time=datetime.now(timezone.utc),
                duration_minutes=60,
            ),
        ]

        created, failed = await workout_service.batch_create_workouts(user_id, workouts_data)

        assert len(created) == 2
        assert len(failed) == 0

    @pytest.mark.asyncio
    async def test_batch_create_partial_failure(self, workout_service, mock_db):
        """測試批次建立部分失敗"""
        user_id = str(ObjectId())

        # 模擬第二筆失敗
        call_count = 0

        async def mock_insert_one(data):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("Database error")
            mock_result = MagicMock()
            mock_result.inserted_id = ObjectId()
            return mock_result

        mock_db.workouts.insert_one = mock_insert_one

        workouts_data = [
            WorkoutCreate(
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=45,
            ),
            WorkoutCreate(
                workout_type="cycling",
                start_time=datetime.now(timezone.utc),
                duration_minutes=60,
            ),
        ]

        created, failed = await workout_service.batch_create_workouts(user_id, workouts_data)

        assert len(created) == 1
        assert len(failed) == 1
        assert failed[0]["index"] == 1


class TestWorkoutServiceCSVExport:
    """測試 Workout Service CSV 匯出功能"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def workout_service(self, mock_db):
        """Workout Service fixture"""
        return WorkoutService(mock_db)

    @pytest.mark.asyncio
    async def test_export_csv_success(self, workout_service, mock_db):
        """測試 CSV 匯出成功"""
        user_id = str(ObjectId())

        mock_workouts = [
            {
                "workout_type": "running",
                "start_time": datetime(2024, 12, 31, 7, 0, 0, tzinfo=timezone.utc),
                "duration_minutes": 45,
                "distance_km": 8.5,
                "pace_min_per_km": 5.29,
                "avg_heart_rate": 150,
                "calories": 450,
                "notes": "晨跑",
            },
        ]

        mock_cursor = MagicMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(return_value=mock_workouts)
        mock_db.workouts.find = MagicMock(return_value=mock_cursor)

        csv_content = await workout_service.export_to_csv(user_id)

        assert csv_content is not None
        assert "running" in csv_content
        assert "8.5" in csv_content
        assert "晨跑" in csv_content

    @pytest.mark.asyncio
    async def test_export_csv_empty(self, workout_service, mock_db):
        """測試匯出空資料"""
        user_id = str(ObjectId())

        mock_cursor = MagicMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(return_value=[])
        mock_db.workouts.find = MagicMock(return_value=mock_cursor)

        csv_content = await workout_service.export_to_csv(user_id)

        assert csv_content is not None
        lines = csv_content.split("\n")
        assert len(lines) >= 1  # 至少有標頭行


class TestWorkoutServiceStats:
    """測試 Workout Service 統計功能"""

    @pytest.fixture
    def mock_db(self):
        """模擬資料庫連線"""
        db = MagicMock()
        db.workouts = AsyncMock()
        return db

    @pytest.fixture
    def workout_service(self, mock_db):
        """Workout Service fixture"""
        return WorkoutService(mock_db)

    @pytest.mark.asyncio
    async def test_get_stats_with_data(self, workout_service, mock_db):
        """測試取得統計資料"""
        user_id = str(ObjectId())

        mock_stats = [
            {
                "_id": None,
                "total_workouts": 10,
                "total_duration_minutes": 450,
                "total_distance_km": 85.0,
                "total_calories": 4500,
                "avg_heart_rate": 150.0,
            }
        ]

        mock_type_stats = [
            {"_id": "running", "count": 7},
            {"_id": "cycling", "count": 3},
        ]

        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(side_effect=[mock_stats, mock_type_stats])
        mock_db.workouts.aggregate = MagicMock(return_value=mock_cursor)

        stats = await workout_service.get_stats(user_id)

        assert stats.total_workouts == 10
        assert stats.total_duration_minutes == 450
        assert stats.total_distance_km == 85.0
        assert stats.workout_types_count["running"] == 7
        assert stats.workout_types_count["cycling"] == 3

    @pytest.mark.asyncio
    async def test_get_stats_no_data(self, workout_service, mock_db):
        """測試取得空統計資料"""
        user_id = str(ObjectId())

        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[])
        mock_db.workouts.aggregate = MagicMock(return_value=mock_cursor)

        stats = await workout_service.get_stats(user_id)

        assert stats.total_workouts == 0
        assert stats.total_duration_minutes == 0
        assert stats.total_distance_km == 0.0
