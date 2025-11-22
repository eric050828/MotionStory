"""
Pydantic Models for MotionStory API
所有資料模型的統一匯出點
"""

from .user import (
    PyObjectId,
    PrivacySettings,
    UserPreferences,
    SubscriptionInfo,
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    UserResponse,
)

from .workout import (
    GeoLocation,
    WorkoutBase,
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutInDB,
    WorkoutResponse,
    WorkoutBatchCreate,
    WorkoutStatsResponse,
    WorkoutExportFormat,
)

from .achievement import (
    AchievementBase,
    AchievementInDB,
    AchievementResponse,
    AchievementTypeInfo,
    ShareCardRequest,
    ShareCardResponse as AchievementShareCard,
)

from .dashboard import (
    WidgetPosition,
    WidgetSize,
    Widget,
    DashboardBase,
    DashboardCreate,
    DashboardUpdate,
    DashboardInDB,
    DashboardResponse,
)

from .milestone import (
    MilestoneBase,
    MilestoneInDB,
    MilestoneResponse,
)

from .annual_review import (
    MonthlyUsageStats,
    WorkoutTypeSummary,
    TrendAnalysis,
    MilestoneSummary,
    AnnualReviewBase,
    AnnualReviewInDB,
    AnnualReviewResponse,
    AnnualReviewExportRequest,
    AnnualReviewExportResponse,
)

from .share_card import (
    ShareCardBase,
    ShareCardInDB,
    ShareCardResponse,
    ShareCardCreateRequest,
    ShareCardStatsUpdate,
)

# Phase 3: Social models
from .friendship import (
    FriendshipBase,
    FriendshipCreate,
    FriendshipInDB,
    FriendshipResponse,
    FriendProfile,
    FriendRequest,
    UserSearchResult,
)

from .activity import (
    ActivityBase,
    ActivityCreate,
    ActivityInDB,
    ActivityResponse,
)

from .like import (
    LikeBase,
    LikeCreate,
    LikeInDB,
    LikeResponse,
)

from .comment import (
    CommentBase,
    CommentCreate,
    CommentInDB,
    CommentResponse,
)

from .challenge import (
    ChallengeBase,
    ChallengeCreate,
    ChallengeInDB,
    ChallengeResponse,
    ChallengeListItem,
    ChallengeDetail,
)

from .participant import (
    ParticipantBase,
    ParticipantCreate,
    ParticipantInDB,
    ParticipantResponse,
    LeaderboardEntry as ChallengeLeaderboardEntry,
)

from .notification import (
    NotificationBase,
    NotificationCreate,
    NotificationInDB,
    NotificationResponse,
    NotificationPreferences,
)

from .leaderboard import (
    LeaderboardBase,
    LeaderboardInDB,
    LeaderboardResponse,
    LeaderboardEntry,
)

from .blocklist import (
    BlockListBase,
    BlockListCreate,
    BlockListInDB,
    BlockListResponse,
)

__all__ = [
    # User models
    "PyObjectId",
    "PrivacySettings",
    "UserPreferences",
    "SubscriptionInfo",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
    "UserResponse",
    # Workout models
    "GeoLocation",
    "WorkoutBase",
    "WorkoutCreate",
    "WorkoutUpdate",
    "WorkoutInDB",
    "WorkoutResponse",
    "WorkoutBatchCreate",
    "WorkoutStatsResponse",
    "WorkoutExportFormat",
    # Achievement models
    "AchievementBase",
    "AchievementInDB",
    "AchievementResponse",
    "AchievementTypeInfo",
    "ShareCardRequest",
    "AchievementShareCard",
    # Dashboard models
    "WidgetPosition",
    "WidgetSize",
    "Widget",
    "DashboardBase",
    "DashboardCreate",
    "DashboardUpdate",
    "DashboardInDB",
    "DashboardResponse",
    # Milestone models
    "MilestoneBase",
    "MilestoneInDB",
    "MilestoneResponse",
    # Annual Review models
    "MonthlyUsageStats",
    "WorkoutTypeSummary",
    "TrendAnalysis",
    "MilestoneSummary",
    "AnnualReviewBase",
    "AnnualReviewInDB",
    "AnnualReviewResponse",
    "AnnualReviewExportRequest",
    "AnnualReviewExportResponse",
    # Share Card models
    "ShareCardBase",
    "ShareCardInDB",
    "ShareCardResponse",
    "ShareCardCreateRequest",
    "ShareCardStatsUpdate",
    # Phase 3: Friendship models
    "FriendshipBase",
    "FriendshipCreate",
    "FriendshipInDB",
    "FriendshipResponse",
    "FriendProfile",
    "FriendRequest",
    "UserSearchResult",
    # Phase 3: Activity models
    "ActivityBase",
    "ActivityCreate",
    "ActivityInDB",
    "ActivityResponse",
    # Phase 3: Like models
    "LikeBase",
    "LikeCreate",
    "LikeInDB",
    "LikeResponse",
    # Phase 3: Comment models
    "CommentBase",
    "CommentCreate",
    "CommentInDB",
    "CommentResponse",
    # Phase 3: Challenge models
    "ChallengeBase",
    "ChallengeCreate",
    "ChallengeInDB",
    "ChallengeResponse",
    "ChallengeListItem",
    "ChallengeDetail",
    # Phase 3: Participant models
    "ParticipantBase",
    "ParticipantCreate",
    "ParticipantInDB",
    "ParticipantResponse",
    "ChallengeLeaderboardEntry",
    # Phase 3: Notification models
    "NotificationBase",
    "NotificationCreate",
    "NotificationInDB",
    "NotificationResponse",
    "NotificationPreferences",
    # Phase 3: Leaderboard models
    "LeaderboardBase",
    "LeaderboardInDB",
    "LeaderboardResponse",
    "LeaderboardEntry",
    # Phase 3: BlockList models
    "BlockListBase",
    "BlockListCreate",
    "BlockListInDB",
    "BlockListResponse",
]
