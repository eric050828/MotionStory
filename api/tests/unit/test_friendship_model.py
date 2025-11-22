"""
T208: Friendship Model 驗證測試
基於 api/src/models/friendship.py
"""

import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError


class TestFriendshipModel:
    """Friendship Model 驗證測試"""

    def test_friendship_create_valid(self):
        """建立好友關係 - 有效資料"""
        from src.models.friendship import FriendshipCreate

        data = FriendshipCreate(
            friend_id="507f1f77bcf86cd799439011"
        )

        assert data.friend_id == "507f1f77bcf86cd799439011"

    def test_friendship_status_literal(self):
        """好友關係 - 狀態 Literal 驗證"""
        from src.models.friendship import FriendshipBase

        # 測試有效狀態
        data = FriendshipBase(
            user_id="507f1f77bcf86cd799439011",
            friend_id="507f1f77bcf86cd799439022",
            status="pending"
        )
        assert data.status == "pending"

        # 測試其他有效狀態
        data2 = FriendshipBase(
            user_id="507f1f77bcf86cd799439011",
            friend_id="507f1f77bcf86cd799439022",
            status="accepted"
        )
        assert data2.status == "accepted"

    def test_friendship_in_db_defaults(self):
        """好友關係 - 預設值驗證"""
        from src.models.friendship import FriendshipInDB

        data = FriendshipInDB(
            user_id="507f1f77bcf86cd799439011",
            friend_id="507f1f77bcf86cd799439022"
        )

        assert data.status == "pending"
        assert data.invited_at is not None
        assert data.accepted_at is None

    def test_friendship_response_schema(self):
        """好友關係 - Response schema"""
        from src.models.friendship import FriendshipResponse
        from datetime import timezone

        data = FriendshipResponse(
            friendship_id="507f1f77bcf86cd799439001",
            user_id="507f1f77bcf86cd799439011",
            friend_id="507f1f77bcf86cd799439022",
            status="pending",
            invited_at=datetime.now(timezone.utc)
        )

        assert data.friendship_id is not None
        assert data.status == "pending"

    def test_friend_profile_schema(self):
        """好友檔案 - FriendProfile schema"""
        from src.models.friendship import FriendProfile

        data = FriendProfile(
            user_id="507f1f77bcf86cd799439011",
            display_name="Test User",
            avatar_url=None,
            last_workout_at=None,
            total_workouts=10,
            friendship_since=datetime.utcnow()
        )

        assert data.user_id is not None
        assert data.display_name == "Test User"
        assert data.total_workouts == 10


class TestBlockListModel:
    """BlockList Model 驗證測試"""

    def test_blocklist_create(self):
        """封鎖名單 - 建立"""
        from src.models.blocklist import BlockListCreate

        data = BlockListCreate(
            blocked_user_id="507f1f77bcf86cd799439011",
            reason="Spam"
        )

        assert data.blocked_user_id is not None
        assert data.reason == "Spam"

    def test_blocklist_reason_optional(self):
        """封鎖名單 - 原因為可選"""
        from src.models.blocklist import BlockListCreate

        data = BlockListCreate(
            blocked_user_id="507f1f77bcf86cd799439011"
        )

        assert data.blocked_user_id is not None
        assert data.reason is None

    def test_blocklist_in_db(self):
        """封鎖名單 - 資料庫模型"""
        from src.models.blocklist import BlockListInDB

        data = BlockListInDB(
            user_id="507f1f77bcf86cd799439011",
            blocked_user_id="507f1f77bcf86cd799439022"
        )

        assert data.user_id is not None
        assert data.blocked_user_id is not None
        assert data.blocked_at is not None
