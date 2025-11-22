"""
T210: Notification Model 驗證測試
基於 api/src/models/notification.py
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError


class TestNotificationModel:
    """Notification Model 驗證測試"""

    def test_notification_type_literal(self):
        """通知類型 - Literal 驗證"""
        from src.models.notification import NotificationInDB

        valid_types = ["friend_request", "friend_activity", "interaction", "challenge_update"]

        for notification_type in valid_types:
            data = NotificationInDB(
                user_id="507f1f77bcf86cd799439011",
                notification_type=notification_type,
                title="測試通知",
                message="這是一則測試通知"
            )
            assert data.notification_type == notification_type

    def test_notification_frequency_literal(self):
        """通知頻率 - Literal 驗證"""
        from src.models.notification import NotificationPreferences

        valid_frequencies = ["realtime", "daily_digest", "off"]

        for frequency in valid_frequencies:
            data = NotificationPreferences(
                user_id="507f1f77bcf86cd799439011",
                notification_frequency=frequency
            )
            assert data.notification_frequency == frequency

    def test_notification_in_db(self):
        """通知 - 資料庫模型"""
        from src.models.notification import NotificationInDB

        data = NotificationInDB(
            user_id="507f1f77bcf86cd799439011",
            notification_type="friend_request",
            title="新好友邀請",
            message="User A 想加你為好友"
        )

        assert data.user_id is not None
        assert data.notification_type == "friend_request"
        assert data.is_read is False
        assert data.created_at is not None

    def test_notification_with_reference(self):
        """通知 - 關聯物件"""
        from src.models.notification import NotificationInDB

        data = NotificationInDB(
            user_id="507f1f77bcf86cd799439011",
            notification_type="interaction",
            title="新按讚",
            message="User B 對你的運動按讚",
            reference_type="like",
            reference_id="507f1f77bcf86cd799439022"
        )

        assert data.reference_type == "like"
        assert data.reference_id is not None

    def test_notification_response(self):
        """通知 - Response schema"""
        from src.models.notification import NotificationResponse

        data = NotificationResponse(
            notification_id="507f1f77bcf86cd799439001",
            user_id="507f1f77bcf86cd799439011",
            notification_type="friend_request",
            title="新好友邀請",
            message="User A 想加你為好友",
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )

        assert data.notification_id is not None
        assert data.is_read is False


class TestNotificationPreferencesModel:
    """Notification Preferences Model 驗證測試"""

    def test_preferences_defaults(self):
        """通知偏好 - 預設值"""
        from src.models.notification import NotificationPreferences

        data = NotificationPreferences(
            user_id="507f1f77bcf86cd799439011"
        )

        assert data.friend_request_enabled is True
        assert data.friend_activity_enabled is True
        assert data.interaction_enabled is True
        assert data.challenge_update_enabled is True
        assert data.notification_frequency == "realtime"
        assert data.do_not_disturb_enabled is False

    def test_preferences_custom_values(self):
        """通知偏好 - 自訂值"""
        from src.models.notification import NotificationPreferences

        data = NotificationPreferences(
            user_id="507f1f77bcf86cd799439011",
            friend_request_enabled=False,
            notification_frequency="daily_digest",
            do_not_disturb_enabled=True,
            do_not_disturb_start="22:00",
            do_not_disturb_end="07:00"
        )

        assert data.friend_request_enabled is False
        assert data.notification_frequency == "daily_digest"
        assert data.do_not_disturb_enabled is True
        assert data.do_not_disturb_start == "22:00"
        assert data.do_not_disturb_end == "07:00"

    def test_preferences_time_format(self):
        """通知偏好 - 時間格式"""
        from src.models.notification import NotificationPreferences

        # 有效格式
        data = NotificationPreferences(
            user_id="507f1f77bcf86cd799439011",
            do_not_disturb_start="08:00",
            do_not_disturb_end="23:59"
        )
        assert data.do_not_disturb_start == "08:00"

    def test_preferences_response(self):
        """通知偏好 - Response schema"""
        from src.models.notification import NotificationPreferences

        data = NotificationPreferences(
            user_id="507f1f77bcf86cd799439011",
            friend_request_enabled=True,
            friend_activity_enabled=True,
            interaction_enabled=True,
            challenge_update_enabled=True,
            notification_frequency="realtime",
            do_not_disturb_enabled=False
        )

        assert data.user_id is not None
        assert data.notification_frequency == "realtime"
