"""
Contract Test: POST /auth/register
測試註冊端點契約遵循性

根據 contracts/auth.yaml 規格測試：
- 201: 註冊成功，回傳使用者資訊與 JWT token
- 400: 密碼格式錯誤
- 409: Email 已被註冊
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """測試成功註冊 - 應回傳 201 與 token"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "display_name": "New User"
        }
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()

    # 驗證回傳結構
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["display_name"] == "New User"
    assert "id" in data["user"]


@pytest.mark.asyncio
async def test_register_password_too_short(client: AsyncClient):
    """測試密碼太短 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "short",  # 少於 8 字元
            "display_name": "Test User"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "error" in data
    assert data["error"] == "BAD_REQUEST"


@pytest.mark.asyncio
async def test_register_password_no_uppercase(client: AsyncClient):
    """測試密碼無大寫字母 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "securepass123",  # 無大寫
            "display_name": "Test User"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_register_password_no_digit(client: AsyncClient):
    """測試密碼無數字 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "SecurePass",  # 無數字
            "display_name": "Test User"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_register_email_already_exists(client: AsyncClient):
    """測試 Email 已存在 - 應回傳 409"""
    # 先註冊一個使用者
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "password": "SecurePass123",
            "display_name": "Existing User"
        }
    )

    # 嘗試用相同 Email 註冊
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "password": "DifferentPass123",
            "display_name": "Another User"
        }
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    data = response.json()
    assert data["error"] == "CONFLICT"
    assert "already registered" in data["message"].lower()


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    """測試無效 Email 格式 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "invalid-email",  # 無效格式
            "password": "SecurePass123",
            "display_name": "Test User"
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
