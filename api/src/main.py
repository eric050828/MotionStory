"""
MotionStory API - FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.database import MongoDB
from .core.firebase_admin import initialize_firebase
from .core.config import settings
from .core.middleware import ErrorHandlerMiddleware, RequestLoggingMiddleware
from .routers import (
    auth_router,
    workouts_router,
    achievements_router,
    dashboards_router,
    timeline_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    # Startup
    print("🚀 Starting MotionStory API...")
    await MongoDB.connect()
    initialize_firebase()
    yield
    # Shutdown
    print("🛑 Shutting down MotionStory API...")
    await MongoDB.disconnect()


app = FastAPI(
    title="MotionStory API",
    description="運動追蹤與動機平台 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 限制為特定 domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# T100: Custom Middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(workouts_router, prefix="/api/v1")
app.include_router(achievements_router, prefix="/api/v1")
app.include_router(dashboards_router, prefix="/api/v1")
app.include_router(timeline_router, prefix="/api/v1")


@app.get("/")
async def root():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "service": "MotionStory API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """詳細健康檢查端點"""
    # Check database connection
    db_status = "connected"
    try:
        db = MongoDB.get_database()
        await db.command("ping")
    except Exception:
        db_status = "disconnected"

    # Check Firebase (simple check)
    firebase_status = "configured" if settings.FIREBASE_PROJECT_ID else "not_configured"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
        "firebase": firebase_status,
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
