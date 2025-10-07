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

__all__ = [
    # User models
    "PyObjectId",
    "PrivacySettings",
    "UserPreferences",
    "SubscriptionInfo",
    "UserBase",
    "UserCreate",
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
]
