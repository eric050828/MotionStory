"""
Pytest Configuration & Fixtures
提供測試所需的共用 fixtures
"""

import sys
from pathlib import Path

# 添加 api 目錄到 Python 路徑
api_dir = Path(__file__).parent.parent
sys.path.insert(0, str(api_dir))

import pytest
import asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from unittest.mock import patch, AsyncMock

from src.main import app
from src.core.config import settings
from src.core.database import MongoDB


@pytest.fixture(scope="session")
def event_loop():
    """建立 event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_db():
    """測試資料庫 fixture"""
    # 使用測試專用資料庫
    test_db_name = f"{settings.DB_NAME}_test"
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[test_db_name]

    yield db

    # 清理測試資料庫
    await client.drop_database(test_db_name)
    client.close()


@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """HTTP 測試客戶端"""
    # 初始化資料庫連線
    await MongoDB.connect()

    # Mock Firebase 功能
    with patch('src.routers.auth.create_firebase_user') as mock_create_firebase, \
         patch('src.routers.auth.delete_firebase_user') as mock_delete_firebase:

        # Mock create_firebase_user 回傳假的 Firebase UID
        async def mock_create_user(email: str, password: str):
            return {"uid": f"firebase_{email.replace('@', '_').replace('.', '_')}", "email": email}

        mock_create_firebase.side_effect = mock_create_user
        mock_delete_firebase.return_value = AsyncMock()

        try:
            # 清理測試資料庫（在每個測試之前）
            db = MongoDB.get_database()
            for collection_name in await db.list_collection_names():
                await db[collection_name].delete_many({})

            async with AsyncClient(app=app, base_url="http://test") as ac:
                yield ac
        finally:
            # 清理資料庫連線
            await MongoDB.disconnect()


@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient) -> dict:
    """
    認證 headers fixture
    註冊測試使用者並返回 JWT token headers
    """
    # 註冊測試使用者
    register_data = {
        "email": "test@example.com",
        "password": "SecurePass123",
        "display_name": "Test User"
    }

    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 201

    data = response.json()
    token = data["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture(scope="function")
async def test_user_id(auth_headers: dict, client: AsyncClient) -> str:
    """取得測試使用者 ID"""
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    return data["user"]["id"]


@pytest.fixture(scope="function")
async def sample_workout_data() -> dict:
    """範例運動資料"""
    return {
        "workout_type": "running",
        "start_time": "2025-01-15T08:30:00Z",
        "duration_minutes": 30,
        "distance_km": 5.0,
        "pace_min_per_km": 6.0,
        "avg_heart_rate": 145,
        "calories": 300,
        "notes": "Test workout"
    }
