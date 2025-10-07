"""
API Routers
FastAPI 路由定義
"""

from .auth import router as auth_router
from .workouts import router as workouts_router
from .achievements import router as achievements_router
from .dashboards import router as dashboards_router
from .timeline import router as timeline_router

__all__ = [
    "auth_router",
    "workouts_router",
    "achievements_router",
    "dashboards_router",
    "timeline_router",
]
