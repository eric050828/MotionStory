"""
Soft Delete Logic Unit Tests (T043)
測試軟刪除標記、復原邏輯、過期清理 (FR-024)
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock


class TestSoftDeleteMarking:
    """測試軟刪除標記功能"""

    @pytest.mark.asyncio
    async def test_soft_delete_marks_is_deleted(self):
        """測試軟刪除標記 is_deleted=true"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()
        service.db = MagicMock()
        service.db.workouts.update_one = AsyncMock()

        user_id = "507f191e810c19729de860ea"
        workout_id = "507f1f77bcf86cd799439011"

        await service.soft_delete_workout(user_id, workout_id)

        # 驗證更新操作
        service.db.workouts.update_one.assert_called_once()
        call_args = service.db.workouts.update_one.call_args

        # 檢查更新內容
        update_data = call_args[0][1]["$set"]
        assert update_data["is_deleted"] == True
        assert "deleted_at" in update_data

    @pytest.mark.asyncio
    async def test_soft_delete_preserves_data(self):
        """測試軟刪除保留原始資料"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 找到運動記錄
        mock_workout = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "507f191e810c19729de860ea",
            "workout_type": "running",
            "duration_minutes": 30,
            "distance_km": 5.2,
            "is_deleted": False
        }

        service.db = MagicMock()
        service.db.workouts.find_one = AsyncMock(return_value=mock_workout)
        service.db.workouts.update_one = AsyncMock()

        user_id = "507f191e810c19729de860ea"
        workout_id = "507f1f77bcf86cd799439011"

        await service.soft_delete_workout(user_id, workout_id)

        # 驗證只更新 is_deleted 和 deleted_at，不刪除其他資料
        update_data = service.db.workouts.update_one.call_args[0][1]["$set"]
        assert "workout_type" not in update_data  # 原始資料未被移除
        assert "duration_minutes" not in update_data

    @pytest.mark.asyncio
    async def test_soft_delete_sets_deleted_at_timestamp(self):
        """測試軟刪除設定 deleted_at 時間戳記"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()
        service.db = MagicMock()
        service.db.workouts.update_one = AsyncMock()

        user_id = "507f191e810c19729de860ea"
        workout_id = "507f1f77bcf86cd799439011"

        before_delete = datetime.now(timezone.utc)
        await service.soft_delete_workout(user_id, workout_id)
        after_delete = datetime.now(timezone.utc)

        # 驗證 deleted_at 在合理時間範圍內
        update_data = service.db.workouts.update_one.call_args[0][1]["$set"]
        deleted_at = update_data["deleted_at"]

        assert before_delete <= deleted_at <= after_delete


class TestRestoreLogic:
    """測試復原邏輯"""

    @pytest.mark.asyncio
    async def test_restore_within_30_days_success(self):
        """測試 30 天內復原成功"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 軟刪除的運動記錄（5 天前刪除）
        deleted_5_days_ago = datetime.now(timezone.utc) - timedelta(days=5)
        mock_workout = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "507f191e810c19729de860ea",
            "is_deleted": True,
            "deleted_at": deleted_5_days_ago
        }

        service.db = MagicMock()
        service.db.workouts.find_one = AsyncMock(return_value=mock_workout)
        service.db.workouts.update_one = AsyncMock()

        user_id = "507f191e810c19729de860ea"
        workout_id = "507f1f77bcf86cd799439011"

        result = await service.restore_workout(user_id, workout_id)

        # 驗證復原成功
        assert result == True
        service.db.workouts.update_one.assert_called_once()

        # 驗證更新內容
        update_data = service.db.workouts.update_one.call_args[0][1]["$set"]
        assert update_data["is_deleted"] == False
        assert update_data["deleted_at"] == None

    @pytest.mark.asyncio
    async def test_restore_after_30_days_fails(self):
        """測試超過 30 天復原失敗"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 軟刪除的運動記錄（35 天前刪除）
        deleted_35_days_ago = datetime.now(timezone.utc) - timedelta(days=35)
        mock_workout = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "507f191e810c19729de860ea",
            "is_deleted": True,
            "deleted_at": deleted_35_days_ago
        }

        service.db = MagicMock()
        service.db.workouts.find_one = AsyncMock(return_value=mock_workout)

        user_id = "507f191e810c19729de860ea"
        workout_id = "507f1f77bcf86cd799439011"

        with pytest.raises(ValueError) as exc_info:
            await service.restore_workout(user_id, workout_id)

        assert "超過 30 天" in str(exc_info.value) or "expired" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_restore_not_deleted_workout_fails(self):
        """測試復原未刪除的記錄失敗"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 未被刪除的運動記錄
        mock_workout = {
            "_id": "507f1f77bcf86cd799439011",
            "user_id": "507f191e810c19729de860ea",
            "is_deleted": False
        }

        service.db = MagicMock()
        service.db.workouts.find_one = AsyncMock(return_value=mock_workout)

        user_id = "507f191e810c19729de860ea"
        workout_id = "507f1f77bcf86cd799439011"

        with pytest.raises(ValueError) as exc_info:
            await service.restore_workout(user_id, workout_id)

        assert "not deleted" in str(exc_info.value).lower() or "未刪除" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_calculate_days_until_permanent_delete(self):
        """測試計算剩餘復原天數"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 軟刪除的運動記錄（25 天前刪除）
        deleted_25_days_ago = datetime.now(timezone.utc) - timedelta(days=25)
        mock_workout = {
            "_id": "507f1f77bcf86cd799439011",
            "is_deleted": True,
            "deleted_at": deleted_25_days_ago
        }

        days_remaining = service.calculate_days_until_permanent_delete(mock_workout)

        # 應該剩餘 5 天 (30 - 25)
        assert days_remaining == 5


class TestPermanentDeletion:
    """測試永久刪除邏輯"""

    @pytest.mark.asyncio
    async def test_cleanup_expired_soft_deleted_records(self):
        """測試清理超過 30 天的軟刪除記錄"""
        from src.services.cleanup_service import CleanupService

        service = CleanupService()

        # Mock 查詢超過 30 天的軟刪除記錄
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

        service.db = MagicMock()
        service.db.workouts.delete_many = AsyncMock(return_value=MagicMock(deleted_count=5))

        deleted_count = await service.cleanup_expired_workouts()

        # 驗證刪除操作
        service.db.workouts.delete_many.assert_called_once()
        call_args = service.db.workouts.delete_many.call_args[0][0]

        # 檢查查詢條件
        assert call_args["is_deleted"] == True
        assert "$lt" in call_args["deleted_at"]

        # 驗證刪除數量
        assert deleted_count == 5

    @pytest.mark.asyncio
    async def test_cleanup_only_affects_soft_deleted_records(self):
        """測試清理僅影響軟刪除記錄"""
        from src.services.cleanup_service import CleanupService

        service = CleanupService()
        service.db = MagicMock()
        service.db.workouts.delete_many = AsyncMock()

        await service.cleanup_expired_workouts()

        # 驗證查詢條件包含 is_deleted=True
        call_args = service.db.workouts.delete_many.call_args[0][0]
        assert call_args["is_deleted"] == True

    @pytest.mark.asyncio
    async def test_cleanup_preserves_recent_soft_deleted_records(self):
        """測試清理保留 30 天內的軟刪除記錄"""
        from src.services.cleanup_service import CleanupService

        service = CleanupService()

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

        service.db = MagicMock()
        service.db.workouts.delete_many = AsyncMock()

        await service.cleanup_expired_workouts()

        # 驗證只刪除 deleted_at < cutoff_date 的記錄
        call_args = service.db.workouts.delete_many.call_args[0][0]
        assert "$lt" in call_args["deleted_at"]


class TestTrashListQuery:
    """測試垃圾桶列表查詢"""

    @pytest.mark.asyncio
    async def test_get_trash_workouts_list(self):
        """測試取得垃圾桶運動記錄列表"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 軟刪除的記錄
        mock_trash_workouts = [
            {
                "_id": "507f1f77bcf86cd799439011",
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc) - timedelta(days=10)
            },
            {
                "_id": "507f1f77bcf86cd799439012",
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc) - timedelta(days=25)
            }
        ]

        service.db = MagicMock()
        service.db.workouts.find = MagicMock(return_value=MagicMock(
            sort=MagicMock(return_value=MagicMock(
                to_list=AsyncMock(return_value=mock_trash_workouts)
            ))
        ))

        user_id = "507f191e810c19729de860ea"
        trash_list = await service.get_trash_workouts(user_id)

        # 驗證查詢條件
        query = service.db.workouts.find.call_args[0][0]
        assert query["user_id"] == user_id
        assert query["is_deleted"] == True

        # 驗證回傳列表
        assert len(trash_list) == 2

    @pytest.mark.asyncio
    async def test_trash_list_includes_days_until_permanent_delete(self):
        """測試垃圾桶列表包含剩餘天數資訊"""
        from src.services.workout_service import WorkoutService

        service = WorkoutService()

        # Mock 軟刪除 20 天前的記錄
        deleted_20_days_ago = datetime.now(timezone.utc) - timedelta(days=20)
        mock_trash_workouts = [
            {
                "_id": "507f1f77bcf86cd799439011",
                "is_deleted": True,
                "deleted_at": deleted_20_days_ago
            }
        ]

        service.db = MagicMock()
        service.db.workouts.find = MagicMock(return_value=MagicMock(
            sort=MagicMock(return_value=MagicMock(
                to_list=AsyncMock(return_value=mock_trash_workouts)
            ))
        ))

        user_id = "507f191e810c19729de860ea"
        trash_list = await service.get_trash_workouts(user_id)

        # 驗證包含剩餘天數
        assert "days_until_permanent_delete" in trash_list[0]
        assert trash_list[0]["days_until_permanent_delete"] == 10  # 30 - 20 = 10
