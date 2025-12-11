"""
MotionStory API - FastAPI Application Entry Point
# Reload trigger - v3
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
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
    # Phase 3: Social Features
    friends_router,
    social_router,
    challenges_router,
    notifications_router,
    leaderboard_router,
    profiles_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    # Startup
    print("Starting MotionStory API...")
    await MongoDB.connect()
    initialize_firebase()
    yield
    # Shutdown
    print("Shutting down MotionStory API...")
    await MongoDB.disconnect()


# CORS allowed origins
CORS_ORIGINS = [
    "http://localhost:8081",   # Expo web dev
    "http://localhost:19006",  # Expo web alternate port
    "http://localhost:3000",   # Local development
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19006",
    "http://127.0.0.1:3000",
]

app = FastAPI(
    title="MotionStory API",
    description="運動追蹤與動機平台 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# Custom exception handler to ensure CORS headers are always present
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with proper CORS headers"""
    origin = request.headers.get("origin", "")

    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

    # Add CORS headers if origin is allowed
    if origin in CORS_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"

    return response

# T100: Custom Middleware (add first, execute last)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# CORS Configuration (add last, execute first - required for proper CORS handling)
# Note: allow_credentials=True requires specific origins, not wildcard "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(workouts_router, prefix="/api/v1")
app.include_router(achievements_router, prefix="/api/v1")
app.include_router(dashboards_router, prefix="/api/v1")
app.include_router(timeline_router, prefix="/api/v1")

# Phase 3: Social Features
app.include_router(friends_router, prefix="/api/v1")
app.include_router(social_router, prefix="/api/v1")
app.include_router(challenges_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(leaderboard_router, prefix="/api/v1")
app.include_router(profiles_router, prefix="/api/v1")


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
