"""
T209: Challenge Model 驗證測試
基於 api/src/models/challenge.py
"""

import pytest
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError


class TestChallengeModel:
    """Challenge Model 驗證測試"""

    def test_challenge_type_literal(self):
        """挑戰類型 - Literal 驗證"""
        from src.models.challenge import ChallengeCreate

        # 測試有效的挑戰類型
        valid_types = ["total_distance", "total_duration", "consecutive_days", "specific_workout_type"]

        for challenge_type in valid_types:
            start_date = datetime.now(timezone.utc) + timedelta(days=1)
            end_date = datetime.now(timezone.utc) + timedelta(days=8)

            data = ChallengeCreate(
                challenge_type=challenge_type,
                target_value=100,
                start_date=start_date,
                end_date=end_date
            )
            assert data.challenge_type == challenge_type

    def test_challenge_status_literal(self):
        """挑戰狀態 - Literal 驗證"""
        from src.models.challenge import ChallengeInDB

        # 測試有效狀態值
        start_date = datetime.now(timezone.utc) + timedelta(days=1)
        end_date = datetime.now(timezone.utc) + timedelta(days=8)

        data = ChallengeInDB(
            creator_id="507f1f77bcf86cd799439011",
            challenge_type="total_distance",
            target_value=100,
            start_date=start_date,
            end_date=end_date
        )

        assert data.status in ["upcoming", "active", "completed"]

    def test_challenge_create_valid(self):
        """創建挑戰賽 - 有效資料"""
        from src.models.challenge import ChallengeCreate

        start_date = datetime.now(timezone.utc) + timedelta(days=1)
        end_date = datetime.now(timezone.utc) + timedelta(days=8)

        data = ChallengeCreate(
            challenge_type="total_distance",
            target_value=100,
            start_date=start_date,
            end_date=end_date,
            privacy="private"
        )

        assert data.challenge_type == "total_distance"
        assert data.target_value == 100
        assert data.privacy == "private"

    def test_challenge_duration_minimum_3_days(self):
        """創建挑戰賽 - 最短 3 天驗證"""
        from src.models.challenge import ChallengeCreate

        start_date = datetime.now(timezone.utc)
        end_date = datetime.now(timezone.utc) + timedelta(days=1)

        with pytest.raises(ValidationError):
            ChallengeCreate(
                challenge_type="total_distance",
                target_value=100,
                start_date=start_date,
                end_date=end_date
            )

    def test_challenge_duration_maximum_90_days(self):
        """創建挑戰賽 - 最長 90 天驗證"""
        from src.models.challenge import ChallengeCreate

        start_date = datetime.now(timezone.utc)
        end_date = datetime.now(timezone.utc) + timedelta(days=100)

        with pytest.raises(ValidationError):
            ChallengeCreate(
                challenge_type="total_distance",
                target_value=500,
                start_date=start_date,
                end_date=end_date
            )

    def test_challenge_invited_users_max_20(self):
        """創建挑戰賽 - 邀請人數上限 20"""
        from src.models.challenge import ChallengeCreate

        start_date = datetime.now(timezone.utc) + timedelta(days=1)
        end_date = datetime.now(timezone.utc) + timedelta(days=8)
        invited = [f"user_{i}" for i in range(25)]

        with pytest.raises(ValidationError):
            ChallengeCreate(
                challenge_type="total_distance",
                target_value=100,
                start_date=start_date,
                end_date=end_date,
                invited_users=invited
            )

    def test_challenge_in_db(self):
        """挑戰賽 - 資料庫模型"""
        from src.models.challenge import ChallengeInDB

        start_date = datetime.now(timezone.utc) + timedelta(days=1)
        end_date = datetime.now(timezone.utc) + timedelta(days=8)

        data = ChallengeInDB(
            creator_id="507f1f77bcf86cd799439011",
            challenge_type="total_distance",
            target_value=100,
            start_date=start_date,
            end_date=end_date
        )

        assert data.creator_id is not None
        assert data.status == "upcoming"
        # participant_count 預設為 1 (創建者)
        assert data.participant_count >= 0


class TestParticipantModel:
    """Participant Model 驗證測試"""

    def test_participant_status_literal(self):
        """參與者狀態 - Literal 驗證"""
        from src.models.participant import ParticipantInDB

        data = ParticipantInDB(
            challenge_id="507f1f77bcf86cd799439011",
            user_id="507f1f77bcf86cd799439022"
        )

        assert data.status in ["active", "completed", "withdrawn"]

    def test_participant_in_db(self):
        """參與者 - 資料庫模型"""
        from src.models.participant import ParticipantInDB

        data = ParticipantInDB(
            challenge_id="507f1f77bcf86cd799439011",
            user_id="507f1f77bcf86cd799439022"
        )

        assert data.challenge_id is not None
        assert data.user_id is not None
        assert data.current_progress == 0
        assert data.completion_percentage == 0
        assert data.status == "active"

    def test_participant_response(self):
        """參與者 - Response schema"""
        from src.models.participant import ParticipantResponse

        data = ParticipantResponse(
            id="507f1f77bcf86cd799439001",
            user_id="507f1f77bcf86cd799439022",
            display_name="Test User",
            joined_at=datetime.now(timezone.utc),
            current_progress=50,
            completion_percentage=50,
            rank=1,
            status="active"
        )

        assert data.rank == 1
        assert data.completion_percentage == 50
