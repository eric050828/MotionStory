"""
API Routers
FastAPI 路由定義
"""

from .auth import router as auth_router
from .workouts import router as workouts_router
from .achievements import router as achievements_router
from .dashboards import router as dashboards_router
from .timeline import router as timeline_router

# Phase 3: Social Features Routers
from .friends import router as friends_router
from .social import router as social_router
from .challenges import router as challenges_router
from .notifications import router as notifications_router
from .leaderboard import router as leaderboard_router
from .profiles import router as profiles_router

__all__ = [
    # Phase 1-2 Routers
    "auth_router",
    "workouts_router",
    "achievements_router",
    "dashboards_router",
    "timeline_router",
    # Phase 3 Routers
    "friends_router",
    "social_router",
    "challenges_router",
    "notifications_router",
    "leaderboard_router",
    "profiles_router",
]
