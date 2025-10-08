"""
T028: Achievement Model 驗證測試
測試成就資料模型的驗證規則
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from src.models.achievement import (
    AchievementCreate,
    AchievementTypeInfo,
    ShareCardRequest,
)


class TestAchievementCreate:
    """測試 AchievementCreate 模型驗證"""

    def test_valid_achievement_create(self):
        """測試有效的成就建立"""
        achievement_data = {
            "achievement_type": "streak_7",
            "celebration_level": "fireworks",
            "metadata": {
                "streak_days": 7,
                "description": "連續運動 7 天",
            },
        }

        achievement = AchievementCreate(**achievement_data)

        assert achievement.achievement_type == "streak_7"
        assert achievement.celebration_level == "fireworks"
        assert achievement.metadata["streak_days"] == 7

    def test_valid_celebration_levels(self):
        """測試有效的慶祝等級"""
        valid_levels = ["basic", "fireworks", "epic"]

        for level in valid_levels:
            achievement_data = {
                "achievement_type": "first_workout",
                "celebration_level": level,
                "metadata": {},
            }

            achievement = AchievementCreate(**achievement_data)
            assert achievement.celebration_level == level

    def test_invalid_celebration_level(self):
        """測試無效的慶祝等級"""
        achievement_data = {
            "achievement_type": "first_workout",
            "celebration_level": "legendary",  # 不在支援列表中
            "metadata": {},
        }

        with pytest.raises(ValidationError) as exc_info:
            AchievementCreate(**achievement_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("celebration_level",) for error in errors)

    def test_achievement_type_required(self):
        """測試成就類型為必填欄位"""
        achievement_data = {
            "celebration_level": "basic",
            "metadata": {},
            # 缺少 achievement_type
        }

        with pytest.raises(ValidationError) as exc_info:
            AchievementCreate(**achievement_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("achievement_type",) for error in errors)

    def test_metadata_default_empty_dict(self):
        """測試 metadata 預設為空字典"""
        achievement_data = {
            "achievement_type": "first_workout",
            "celebration_level": "basic",
        }

        achievement = AchievementCreate(**achievement_data)

        assert achievement.metadata == {}

    def test_metadata_custom_structure(self):
        """測試 metadata 可儲存自訂結構"""
        custom_metadata = {
            "streak_days": 30,
            "total_workouts": 35,
            "workout_types": ["running", "cycling"],
            "best_workout_id": "workout_123",
            "extra_info": {
                "location": "台北",
                "weather": "sunny",
            },
        }

        achievement_data = {
            "achievement_type": "streak_30",
            "celebration_level": "epic",
            "metadata": custom_metadata,
        }

        achievement = AchievementCreate(**achievement_data)

        assert achievement.metadata["streak_days"] == 30
        assert achievement.metadata["total_workouts"] == 35
        assert achievement.metadata["workout_types"] == ["running", "cycling"]
        assert achievement.metadata["extra_info"]["location"] == "台北"

    def test_optional_workout_id(self):
        """測試 workout_id 為選填欄位"""
        achievement_data = {
            "achievement_type": "first_workout",
            "celebration_level": "basic",
            "metadata": {},
        }

        achievement = AchievementCreate(**achievement_data)

        assert achievement.workout_id is None

    def test_with_workout_id(self):
        """測試提供 workout_id"""
        achievement_data = {
            "achievement_type": "distance_10k",
            "celebration_level": "fireworks",
            "metadata": {"distance_km": 10.5},
            "workout_id": "507f1f77bcf86cd799439012",
        }

        achievement = AchievementCreate(**achievement_data)

        assert achievement.workout_id == "507f1f77bcf86cd799439012"


class TestAchievementTypeInfo:
    """測試成就類型資訊模型"""

    def test_valid_achievement_type_info(self):
        """測試有效的成就類型資訊"""
        type_info_data = {
            "type": "streak_7",
            "title": "一週連續",
            "description": "連續運動 7 天",
            "celebration_level": "fireworks",
            "icon": "🔥",
            "criteria": {
                "streak_days": 7,
                "allow_skip": False,
            },
        }

        type_info = AchievementTypeInfo(**type_info_data)

        assert type_info.type == "streak_7"
        assert type_info.title == "一週連續"
        assert type_info.description == "連續運動 7 天"
        assert type_info.celebration_level == "fireworks"
        assert type_info.icon == "🔥"
        assert type_info.criteria["streak_days"] == 7

    def test_criteria_structure_flexible(self):
        """測試 criteria 結構可彈性定義"""
        # 距離成就
        distance_criteria = {
            "type": "distance_10k",
            "title": "首次 10K",
            "description": "完成 10 公里運動",
            "celebration_level": "fireworks",
            "icon": "🏃",
            "criteria": {
                "min_distance_km": 10.0,
                "workout_types": ["running", "cycling"],
            },
        }

        type_info = AchievementTypeInfo(**distance_criteria)

        assert type_info.criteria["min_distance_km"] == 10.0
        assert type_info.criteria["workout_types"] == ["running", "cycling"]

        # 個人紀錄成就
        pr_criteria = {
            "type": "personal_best_pace",
            "title": "速度之王",
            "description": "打破個人最佳配速紀錄",
            "celebration_level": "epic",
            "icon": "⚡",
            "criteria": {
                "compare_field": "pace_min_per_km",
                "direction": "lower_is_better",
                "improvement_threshold": 0.1,
            },
        }

        type_info = AchievementTypeInfo(**pr_criteria)

        assert type_info.criteria["compare_field"] == "pace_min_per_km"
        assert type_info.criteria["direction"] == "lower_is_better"

    def test_all_fields_required(self):
        """測試所有欄位皆為必填"""
        incomplete_data = {
            "type": "streak_7",
            "title": "一週連續",
            # 缺少 description, celebration_level, icon, criteria
        }

        with pytest.raises(ValidationError) as exc_info:
            AchievementTypeInfo(**incomplete_data)

        errors = exc_info.value.errors()
        missing_fields = [error["loc"][0] for error in errors]

        assert "description" in missing_fields
        assert "celebration_level" in missing_fields
        assert "icon" in missing_fields
        assert "criteria" in missing_fields


class TestShareCardRequest:
    """測試分享卡片生成請求模型"""

    def test_default_template(self):
        """測試分享卡片預設模板"""
        request = ShareCardRequest()

        assert request.template == "default"
        assert request.include_stats is True

    def test_valid_templates(self):
        """測試有效的卡片模板"""
        valid_templates = ["default", "minimalist", "colorful"]

        for template in valid_templates:
            request = ShareCardRequest(template=template)
            assert request.template == template

    def test_invalid_template(self):
        """測試無效的卡片模板"""
        with pytest.raises(ValidationError) as exc_info:
            ShareCardRequest(template="vintage")  # 不在支援列表中

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("template",) for error in errors)

    def test_include_stats_options(self):
        """測試統計數據顯示選項"""
        # 包含統計數據
        request_with_stats = ShareCardRequest(include_stats=True)
        assert request_with_stats.include_stats is True

        # 不包含統計數據
        request_without_stats = ShareCardRequest(include_stats=False)
        assert request_without_stats.include_stats is False

    def test_custom_configuration(self):
        """測試自訂卡片配置"""
        request = ShareCardRequest(
            template="minimalist",
            include_stats=False,
        )

        assert request.template == "minimalist"
        assert request.include_stats is False
