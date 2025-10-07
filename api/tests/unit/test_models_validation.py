"""
Pydantic Models Validation Unit Tests (T040)
測試所有 Pydantic 資料模型的驗證邏輯
"""

import pytest
from pydantic import ValidationError
from datetime import datetime, timezone


class TestUserModel:
    """測試 User model 驗證"""

    def test_valid_user_creation(self):
        """測試有效的使用者建立"""
        from src.models.user import User

        user_data = {
            "email": "test@example.com",
            "password_hash": "$2b$12$abcdefghijklmnopqrstuvwxyz123456",
            "display_name": "Test User",
            "privacy_settings": {
                "share_location": False,
                "share_detailed_stats": True
            }
        }

        user = User(**user_data)
        assert user.email == "test@example.com"
        assert user.display_name == "Test User"
        assert user.privacy_settings.share_location == False

    def test_invalid_email_format(self):
        """測試無效的 email 格式"""
        from src.models.user import User

        with pytest.raises(ValidationError) as exc_info:
            User(
                email="invalid-email",
                password_hash="hash",
                display_name="Test"
            )

        assert "email" in str(exc_info.value).lower()

    def test_display_name_length_validation(self):
        """測試顯示名稱長度限制"""
        from src.models.user import User

        # 名稱過長 (>50 字元)
        with pytest.raises(ValidationError):
            User(
                email="test@example.com",
                password_hash="hash",
                display_name="A" * 51
            )

    def test_privacy_settings_defaults(self):
        """測試隱私設定預設值"""
        from src.models.user import User

        user = User(
            email="test@example.com",
            password_hash="hash",
            display_name="Test"
        )

        # 驗證預設隱私設定
        assert user.privacy_settings.share_location == False
        assert user.privacy_settings.share_detailed_stats == True


class TestWorkoutModel:
    """測試 Workout model 驗證"""

    def test_valid_workout_creation(self):
        """測試有效的運動記錄建立"""
        from src.models.workout import Workout

        workout_data = {
            "user_id": "507f191e810c19729de860ea",
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 30,
            "distance_km": 5.2,
            "pace_min_per_km": 5.77,
            "avg_heart_rate": 145,
            "calories": 320
        }

        workout = Workout(**workout_data)
        assert workout.workout_type == "running"
        assert workout.duration_minutes == 30
        assert workout.distance_km == 5.2

    def test_workout_type_enum_validation(self):
        """測試運動類型枚舉驗證"""
        from src.models.workout import Workout

        with pytest.raises(ValidationError) as exc_info:
            Workout(
                user_id="507f191e810c19729de860ea",
                workout_type="invalid_type",
                start_time=datetime.now(timezone.utc),
                duration_minutes=30
            )

        assert "workout_type" in str(exc_info.value).lower()

    def test_duration_minutes_positive_validation(self):
        """測試運動時長必須為正數"""
        from src.models.workout import Workout

        with pytest.raises(ValidationError):
            Workout(
                user_id="507f191e810c19729de860ea",
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=-10
            )

    def test_heart_rate_range_validation(self):
        """測試心率範圍驗證 (30-250)"""
        from src.models.workout import Workout

        # 心率過低
        with pytest.raises(ValidationError):
            Workout(
                user_id="507f191e810c19729de860ea",
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=30,
                avg_heart_rate=25
            )

        # 心率過高
        with pytest.raises(ValidationError):
            Workout(
                user_id="507f191e810c19729de860ea",
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=30,
                avg_heart_rate=260
            )

    def test_optional_fields_nullable(self):
        """測試選填欄位可為 None"""
        from src.models.workout import Workout

        workout = Workout(
            user_id="507f191e810c19729de860ea",
            workout_type="gym",
            start_time=datetime.now(timezone.utc),
            duration_minutes=45,
            # 不提供距離、配速、心率等選填欄位
        )

        assert workout.distance_km is None
        assert workout.pace_min_per_km is None
        assert workout.avg_heart_rate is None


class TestAchievementModel:
    """測試 Achievement model 驗證"""

    def test_valid_achievement_creation(self):
        """測試有效的成就建立"""
        from src.models.achievement import Achievement

        achievement_data = {
            "user_id": "507f191e810c19729de860ea",
            "achievement_type": "streak_7",
            "celebration_level": "fireworks",
            "workout_id": "507f1f77bcf86cd799439011",
            "achieved_at": datetime.now(timezone.utc),
            "metadata": {
                "streak_days": 7
            }
        }

        achievement = Achievement(**achievement_data)
        assert achievement.achievement_type == "streak_7"
        assert achievement.celebration_level == "fireworks"
        assert achievement.metadata["streak_days"] == 7

    def test_celebration_level_enum_validation(self):
        """測試慶祝等級枚舉驗證"""
        from src.models.achievement import Achievement

        with pytest.raises(ValidationError) as exc_info:
            Achievement(
                user_id="507f191e810c19729de860ea",
                achievement_type="first_workout",
                celebration_level="invalid_level",
                achieved_at=datetime.now(timezone.utc)
            )

        assert "celebration_level" in str(exc_info.value).lower()

    def test_achievement_type_validation(self):
        """測試成就類型驗證"""
        from src.models.achievement import Achievement

        # 有效的成就類型
        valid_types = [
            "first_workout", "streak_3", "streak_7", "streak_30",
            "distance_5k", "distance_10k", "personal_record_distance"
        ]

        for achievement_type in valid_types:
            achievement = Achievement(
                user_id="507f191e810c19729de860ea",
                achievement_type=achievement_type,
                celebration_level="basic",
                achieved_at=datetime.now(timezone.utc)
            )
            assert achievement.achievement_type == achievement_type


class TestDashboardModel:
    """測試 Dashboard model 驗證"""

    def test_valid_dashboard_creation(self):
        """測試有效的儀表板建立"""
        from src.models.dashboard import Dashboard, Widget

        dashboard_data = {
            "user_id": "507f191e810c19729de860ea",
            "name": "訓練儀表板",
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

        dashboard = Dashboard(**dashboard_data)
        assert dashboard.name == "訓練儀表板"
        assert len(dashboard.widgets) == 1
        assert dashboard.widgets[0].type == "streak_counter"

    def test_dashboard_name_length_validation(self):
        """測試儀表板名稱長度限制 (1-50)"""
        from src.models.dashboard import Dashboard

        # 名稱為空
        with pytest.raises(ValidationError):
            Dashboard(
                user_id="507f191e810c19729de860ea",
                name="",
                widgets=[]
            )

        # 名稱過長
        with pytest.raises(ValidationError):
            Dashboard(
                user_id="507f191e810c19729de860ea",
                name="A" * 51,
                widgets=[]
            )

    def test_widget_count_limit(self):
        """測試 Widget 數量限制 (最多 20 個)"""
        from src.models.dashboard import Dashboard

        # 建立 21 個 Widget
        widgets = [
            {
                "id": f"widget-{i:03d}",
                "type": "streak_counter",
                "position": {"x": 0, "y": i * 4},
                "size": {"width": 6, "height": 4},
                "config": {}
            }
            for i in range(21)
        ]

        with pytest.raises(ValidationError) as exc_info:
            Dashboard(
                user_id="507f191e810c19729de860ea",
                name="測試",
                widgets=widgets
            )

        assert "widget" in str(exc_info.value).lower()

    def test_widget_size_validation(self):
        """測試 Widget 大小驗證 (width: 1-12, height: 1-8)"""
        from src.models.dashboard import Dashboard

        # Width 過大
        with pytest.raises(ValidationError):
            Dashboard(
                user_id="507f191e810c19729de860ea",
                name="測試",
                widgets=[{
                    "id": "widget-001",
                    "type": "streak_counter",
                    "position": {"x": 0, "y": 0},
                    "size": {"width": 13, "height": 4},
                    "config": {}
                }]
            )

        # Height 過大
        with pytest.raises(ValidationError):
            Dashboard(
                user_id="507f191e810c19729de860ea",
                name="測試",
                widgets=[{
                    "id": "widget-001",
                    "type": "streak_counter",
                    "position": {"x": 0, "y": 0},
                    "size": {"width": 6, "height": 9},
                    "config": {}
                }]
            )

    def test_widget_type_enum_validation(self):
        """測試 Widget 類型枚舉驗證"""
        from src.models.dashboard import Dashboard

        with pytest.raises(ValidationError):
            Dashboard(
                user_id="507f191e810c19729de860ea",
                name="測試",
                widgets=[{
                    "id": "widget-001",
                    "type": "invalid_widget_type",
                    "position": {"x": 0, "y": 0},
                    "size": {"width": 6, "height": 4},
                    "config": {}
                }]
            )


class TestAnnualReviewModel:
    """測試 AnnualReview model 驗證"""

    def test_valid_annual_review_creation(self):
        """測試有效的年度回顧建立"""
        from src.models.annual_review import AnnualReview

        review_data = {
            "user_id": "507f191e810c19729de860ea",
            "year": 2024,
            "usage_months": 12,
            "stats": {
                "total_workout_days": 248,
                "total_duration_minutes": 12400,
                "total_distance_km": 2145.8,
                "total_calories": 186000,
                "max_streak_days": 45,
                "workout_by_type": {
                    "running": 180,
                    "cycling": 48,
                    "swimming": 20
                },
                "favorite_workout_type": "running"
            },
            "trends": {
                "monthly_summary": [],
                "progress_percentage": 35.2,
                "best_month": {
                    "month": 6,
                    "workouts": 28,
                    "distance_km": 245.8
                }
            },
            "milestones": [],
            "achievements": []
        }

        review = AnnualReview(**review_data)
        assert review.year == 2024
        assert review.stats.total_workout_days == 248

    def test_year_range_validation(self):
        """測試年度範圍驗證 (2020-2100)"""
        from src.models.annual_review import AnnualReview

        # 年度過早
        with pytest.raises(ValidationError):
            AnnualReview(
                user_id="507f191e810c19729de860ea",
                year=2019,
                usage_months=12,
                stats={},
                trends={},
                milestones=[],
                achievements=[]
            )

        # 年度過晚
        with pytest.raises(ValidationError):
            AnnualReview(
                user_id="507f191e810c19729de860ea",
                year=2101,
                usage_months=12,
                stats={},
                trends={},
                milestones=[],
                achievements=[]
            )
