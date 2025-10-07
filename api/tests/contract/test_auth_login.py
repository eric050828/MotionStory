"""
Contract Test: POST /auth/login
測試登入端點契約遵循性

根據 contracts/auth.yaml 規格測試：
- 200: 登入成功
- 401: Email 或密碼錯誤
- 400: 請求格式錯誤
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """測試成功登入 - 應回傳 200 與 token"""
    # 先註冊使用者
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "logintest@example.com",
            "password": "SecurePass123",
            "display_name": "Login Test"
        }
    )

    # 嘗試登入
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "logintest@example.com",
            "password": "SecurePass123"
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 驗證回傳結構
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "logintest@example.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """測試錯誤密碼 - 應回傳 401"""
    # 先註冊使用者
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpass@example.com",
            "password": "CorrectPass123",
            "display_name": "Wrong Pass Test"
        }
    )

    # 使用錯誤密碼登入
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "WrongPassword123"
        }
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["error"] == "UNAUTHORIZED"
    assert "invalid" in data["message"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    """測試不存在的 Email - 應回傳 401"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "SomePass123"
        }
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["error"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_missing_password(client: AsyncClient):
    """測試缺少密碼欄位 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com"
            # 缺少 password
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_login_missing_email(client: AsyncClient):
    """測試缺少 Email 欄位 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "password": "SecurePass123"
            # 缺少 email
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
