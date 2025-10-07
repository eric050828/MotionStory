"""
T027: Workout Model 驗證測試
測試運動記錄資料模型的驗證規則
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from api.src.models.workout import (
    WorkoutCreate,
    WorkoutUpdate,
    GeoLocation,
    WorkoutBatchCreate,
)


class TestWorkoutCreate:
    """測試 WorkoutCreate 模型驗證"""

    def test_valid_workout_create(self):
        """測試有效的運動記錄建立"""
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 45,
            "distance_km": 8.5,
            "avg_heart_rate": 150,
        }

        workout = WorkoutCreate(**workout_data)

        assert workout.workout_type == "running"
        assert workout.duration_minutes == 45
        assert workout.distance_km == 8.5
        assert workout.avg_heart_rate == 150

    def test_duration_minimum_validation(self):
        """測試運動時長最小值驗證 (必須 > 0)"""
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 0,  # 無效: 必須 > 0
        }

        with pytest.raises(ValidationError) as exc_info:
            WorkoutCreate(**workout_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("duration_minutes",) for error in errors)

    def test_duration_maximum_validation(self):
        """測試運動時長最大值驗證 (最多 1440 分鐘 = 24 小時)"""
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 1441,  # 無效: 超過 1440 分鐘
        }

        with pytest.raises(ValidationError) as exc_info:
            WorkoutCreate(**workout_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("duration_minutes",) for error in errors)

    def test_valid_duration_range(self):
        """測試有效的運動時長範圍 (1-1440 分鐘)"""
        valid_durations = [1, 30, 60, 120, 600, 1440]

        for duration in valid_durations:
            workout_data = {
                "workout_type": "running",
                "start_time": datetime.now(timezone.utc),
                "duration_minutes": duration,
            }

            workout = WorkoutCreate(**workout_data)
            assert workout.duration_minutes == duration

    def test_distance_negative_validation(self):
        """測試距離不可為負數"""
        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 45,
            "distance_km": -5.0,  # 無效: 負數
        }

        with pytest.raises(ValidationError) as exc_info:
            WorkoutCreate(**workout_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("distance_km",) for error in errors)

    def test_heart_rate_range_validation(self):
        """測試心率範圍驗證 (30-250 bpm)"""
        # 有效範圍
        valid_heart_rates = [30, 60, 120, 180, 250]
        for hr in valid_heart_rates:
            workout_data = {
                "workout_type": "running",
                "start_time": datetime.now(timezone.utc),
                "duration_minutes": 45,
                "avg_heart_rate": hr,
            }
            workout = WorkoutCreate(**workout_data)
            assert workout.avg_heart_rate == hr

        # 無效範圍 (太低)
        with pytest.raises(ValidationError):
            WorkoutCreate(
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=45,
                avg_heart_rate=29,  # < 30
            )

        # 無效範圍 (太高)
        with pytest.raises(ValidationError):
            WorkoutCreate(
                workout_type="running",
                start_time=datetime.now(timezone.utc),
                duration_minutes=45,
                avg_heart_rate=251,  # > 250
            )

    def test_valid_workout_types(self):
        """測試有效的運動類型"""
        valid_types = ["running", "cycling", "swimming", "yoga", "gym", "hiking", "other"]

        for workout_type in valid_types:
            workout_data = {
                "workout_type": workout_type,
                "start_time": datetime.now(timezone.utc),
                "duration_minutes": 45,
            }

            workout = WorkoutCreate(**workout_data)
            assert workout.workout_type == workout_type

    def test_invalid_workout_type(self):
        """測試無效的運動類型"""
        workout_data = {
            "workout_type": "flying",  # 不在支援列表中
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 45,
        }

        with pytest.raises(ValidationError) as exc_info:
            WorkoutCreate(**workout_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("workout_type",) for error in errors)

    def test_notes_max_length(self):
        """測試備註最大長度限制 (500 字元)"""
        long_notes = "x" * 501  # 501 字元

        workout_data = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 45,
            "notes": long_notes,
        }

        with pytest.raises(ValidationError) as exc_info:
            WorkoutCreate(**workout_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("notes",) for error in errors)

    def test_optional_fields(self):
        """測試選填欄位可省略"""
        minimal_workout = {
            "workout_type": "running",
            "start_time": datetime.now(timezone.utc),
            "duration_minutes": 45,
        }

        workout = WorkoutCreate(**minimal_workout)

        assert workout.distance_km is None
        assert workout.pace_min_per_km is None
        assert workout.avg_heart_rate is None
        assert workout.max_heart_rate is None
        assert workout.calories is None
        assert workout.elevation_gain_m is None
        assert workout.location is None
        assert workout.notes is None


class TestGeoLocation:
    """測試 GeoJSON Point 地理位置模型"""

    def test_valid_geolocation(self):
        """測試有效的地理位置"""
        location = GeoLocation(
            type="Point",
            coordinates=[121.5654, 25.0330]  # 台北
        )

        assert location.type == "Point"
        assert location.coordinates == [121.5654, 25.0330]

    def test_longitude_range_validation(self):
        """測試經度範圍驗證 (-180 到 180)"""
        # 有效範圍
        valid_coords = [
            [-180.0, 0.0],
            [0.0, 0.0],
            [180.0, 0.0],
        ]

        for coords in valid_coords:
            location = GeoLocation(coordinates=coords)
            assert location.coordinates == coords

        # 無效範圍
        with pytest.raises(ValidationError):
            GeoLocation(coordinates=[-181.0, 0.0])  # 經度 < -180

        with pytest.raises(ValidationError):
            GeoLocation(coordinates=[181.0, 0.0])  # 經度 > 180

    def test_latitude_range_validation(self):
        """測試緯度範圍驗證 (-90 到 90)"""
        # 有效範圍
        valid_coords = [
            [0.0, -90.0],
            [0.0, 0.0],
            [0.0, 90.0],
        ]

        for coords in valid_coords:
            location = GeoLocation(coordinates=coords)
            assert location.coordinates == coords

        # 無效範圍
        with pytest.raises(ValidationError):
            GeoLocation(coordinates=[0.0, -91.0])  # 緯度 < -90

        with pytest.raises(ValidationError):
            GeoLocation(coordinates=[0.0, 91.0])  # 緯度 > 90

    def test_coordinates_length_validation(self):
        """測試座標陣列長度必須為 2"""
        # 長度不足
        with pytest.raises(ValidationError):
            GeoLocation(coordinates=[121.5654])  # 僅 1 個元素

        # 長度過多
        with pytest.raises(ValidationError):
            GeoLocation(coordinates=[121.5654, 25.0330, 100.0])  # 3 個元素


class TestWorkoutBatchCreate:
    """測試批次建立運動記錄模型"""

    def test_valid_batch_create(self):
        """測試有效的批次建立"""
        workouts_data = [
            {
                "workout_type": "running",
                "start_time": datetime.now(timezone.utc),
                "duration_minutes": 45,
            },
            {
                "workout_type": "cycling",
                "start_time": datetime.now(timezone.utc),
                "duration_minutes": 60,
            },
        ]

        batch = WorkoutBatchCreate(workouts=[WorkoutCreate(**w) for w in workouts_data])

        assert len(batch.workouts) == 2
        assert batch.workouts[0].workout_type == "running"
        assert batch.workouts[1].workout_type == "cycling"

    def test_batch_minimum_validation(self):
        """測試批次最少數量限制 (至少 1 筆)"""
        with pytest.raises(ValidationError) as exc_info:
            WorkoutBatchCreate(workouts=[])  # 空陣列

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("workouts",) for error in errors)

    def test_batch_maximum_validation(self):
        """測試批次最大數量限制 (最多 100 筆)"""
        workouts_data = [
            {
                "workout_type": "running",
                "start_time": datetime.now(timezone.utc),
                "duration_minutes": 45,
            }
        ] * 101  # 101 筆

        with pytest.raises(ValidationError) as exc_info:
            WorkoutBatchCreate(workouts=[WorkoutCreate(**w) for w in workouts_data])

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("workouts",) for error in errors)
