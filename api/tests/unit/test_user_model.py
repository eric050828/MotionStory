"""
T026: User Model Pydantic 驗證測試
測試使用者資料模型的驗證規則
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from src.models.user import (
    UserCreate,
    UserUpdate,
    PrivacySettings,
    UserPreferences,
    SubscriptionInfo,
)


class TestUserCreate:
    """測試 UserCreate 模型驗證"""

    def test_valid_user_create(self):
        """測試有效的使用者建立資料"""
        user_data = {
            "firebase_uid": "abc123xyz456789",
            "email": "test@example.com",
            "display_name": "測試使用者",
            "password": "SecurePassword123!",
        }

        user = UserCreate(**user_data)

        assert user.firebase_uid == "abc123xyz456789"
        assert user.email == "test@example.com"
        assert user.display_name == "測試使用者"
        assert user.password == "SecurePassword123!"

    def test_invalid_email_format(self):
        """測試無效的 Email 格式"""
        user_data = {
            "firebase_uid": "abc123xyz456789",
            "email": "invalid-email",  # 無效格式
            "display_name": "測試使用者",
            "password": "SecurePassword123!",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("email",) for error in errors)

    def test_password_too_short(self):
        """測試密碼長度不足 (最少 8 字元)"""
        user_data = {
            "firebase_uid": "abc123xyz456789",
            "email": "test@example.com",
            "display_name": "測試使用者",
            "password": "Short1!",  # 僅 7 字元
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("password",) for error in errors)

    def test_firebase_uid_too_short(self):
        """測試 Firebase UID 長度不足 (最少 10 字元)"""
        user_data = {
            "firebase_uid": "short123",  # 僅 8 字元
            "email": "test@example.com",
            "display_name": "測試使用者",
            "password": "SecurePassword123!",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("firebase_uid",) for error in errors)

    def test_firebase_uid_too_long(self):
        """測試 Firebase UID 長度超過限制 (最多 128 字元)"""
        user_data = {
            "firebase_uid": "x" * 129,  # 129 字元
            "email": "test@example.com",
            "display_name": "測試使用者",
            "password": "SecurePassword123!",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("firebase_uid",) for error in errors)

    def test_display_name_empty(self):
        """測試顯示名稱為空"""
        user_data = {
            "firebase_uid": "abc123xyz456789",
            "email": "test@example.com",
            "display_name": "",  # 空字串
            "password": "SecurePassword123!",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("display_name",) for error in errors)

    def test_display_name_too_long(self):
        """測試顯示名稱超過長度限制 (最多 50 字元)"""
        user_data = {
            "firebase_uid": "abc123xyz456789",
            "email": "test@example.com",
            "display_name": "x" * 51,  # 51 字元
            "password": "SecurePassword123!",
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("display_name",) for error in errors)

    def test_missing_required_fields(self):
        """測試缺少必填欄位"""
        user_data = {
            "email": "test@example.com",
            # 缺少 firebase_uid, display_name, password
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        errors = exc_info.value.errors()
        missing_fields = [error["loc"][0] for error in errors]
        assert "firebase_uid" in missing_fields
        assert "display_name" in missing_fields
        assert "password" in missing_fields


class TestPrivacySettings:
    """測試隱私設定模型"""

    def test_default_privacy_settings(self):
        """測試隱私設定預設值"""
        settings = PrivacySettings()

        assert settings.share_location is False
        assert settings.share_detailed_stats is True
        assert settings.share_achievements is True
        assert settings.public_profile is False

    def test_custom_privacy_settings(self):
        """測試自訂隱私設定"""
        settings = PrivacySettings(
            share_location=True,
            share_detailed_stats=False,
            share_achievements=False,
            public_profile=True,
        )

        assert settings.share_location is True
        assert settings.share_detailed_stats is False
        assert settings.share_achievements is False
        assert settings.public_profile is True


class TestUserPreferences:
    """測試使用者偏好設定模型"""

    def test_default_preferences(self):
        """測試偏好設定預設值"""
        prefs = UserPreferences()

        assert prefs.language == "zh-TW"
        assert prefs.measurement_unit == "metric"
        assert prefs.notification_enabled is True

    def test_valid_language_options(self):
        """測試有效的語言選項"""
        for lang in ["zh-TW", "en", "ja"]:
            prefs = UserPreferences(language=lang)
            assert prefs.language == lang

    def test_invalid_language(self):
        """測試無效的語言選項"""
        with pytest.raises(ValidationError) as exc_info:
            UserPreferences(language="fr")  # 法文不在選項中

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("language",) for error in errors)

    def test_valid_measurement_units(self):
        """測試有效的測量單位"""
        for unit in ["metric", "imperial"]:
            prefs = UserPreferences(measurement_unit=unit)
            assert prefs.measurement_unit == unit

    def test_invalid_measurement_unit(self):
        """測試無效的測量單位"""
        with pytest.raises(ValidationError) as exc_info:
            UserPreferences(measurement_unit="nautical")

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("measurement_unit",) for error in errors)


class TestSubscriptionInfo:
    """測試訂閱方案資訊模型"""

    def test_default_subscription(self):
        """測試訂閱方案預設值"""
        subscription = SubscriptionInfo()

        assert subscription.tier == "free"
        assert subscription.expires_at is None

    def test_premium_subscription(self):
        """測試付費訂閱方案"""
        expiry_date = datetime(2025, 12, 31, 23, 59, 59)
        subscription = SubscriptionInfo(
            tier="premium",
            expires_at=expiry_date,
        )

        assert subscription.tier == "premium"
        assert subscription.expires_at == expiry_date

    def test_invalid_subscription_tier(self):
        """測試無效的訂閱方案"""
        with pytest.raises(ValidationError) as exc_info:
            SubscriptionInfo(tier="enterprise")  # 僅支援 free, premium

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("tier",) for error in errors)


class TestUserUpdate:
    """測試使用者更新模型"""

    def test_partial_update(self):
        """測試部分欄位更新"""
        update_data = {
            "display_name": "新名稱",
        }

        update = UserUpdate(**update_data)

        assert update.display_name == "新名稱"
        assert update.avatar_url is None
        assert update.privacy_settings is None
        assert update.preferences is None

    def test_update_all_fields(self):
        """測試更新所有欄位"""
        update_data = {
            "display_name": "新名稱",
            "avatar_url": "https://example.com/avatar.jpg",
            "privacy_settings": PrivacySettings(share_location=True),
            "preferences": UserPreferences(language="en"),
        }

        update = UserUpdate(**update_data)

        assert update.display_name == "新名稱"
        assert update.avatar_url == "https://example.com/avatar.jpg"
        assert update.privacy_settings.share_location is True
        assert update.preferences.language == "en"

    def test_update_display_name_validation(self):
        """測試更新時顯示名稱驗證"""
        with pytest.raises(ValidationError) as exc_info:
            UserUpdate(display_name="")  # 空字串

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("display_name",) for error in errors)
