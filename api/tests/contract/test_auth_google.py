"""
Contract Test: POST /auth/google
測試 Google OAuth 登入端點契約遵循性

根據 contracts/auth.yaml 規格測試：
- 200: Google OAuth 成功
- 401: 無效的 Google ID token
- 400: 請求格式錯誤
"""
import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_google_oauth_success(client: AsyncClient):
    """測試 Google OAuth 成功 - 應回傳 200 與 token

    注意：此測試需要 mock Firebase Admin SDK
    """
    response = await client.post(
        "/api/v1/auth/google",
        json={
            "id_token": "valid_google_id_token_mock"
        }
    )

    # 預期成功（需實作 Firebase mock）
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "access_token" in data
    assert "user" in data
    assert "email" in data["user"]


@pytest.mark.asyncio
async def test_google_oauth_invalid_token(client: AsyncClient):
    """測試無效 Google ID token - 應回傳 401"""
    response = await client.post(
        "/api/v1/auth/google",
        json={
            "id_token": "invalid_token_12345"
        }
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["error"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_google_oauth_missing_token(client: AsyncClient):
    """測試缺少 id_token 欄位 - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/google",
        json={}
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_google_oauth_empty_token(client: AsyncClient):
    """測試空白 id_token - 應回傳 400"""
    response = await client.post(
        "/api/v1/auth/google",
        json={
            "id_token": ""
        }
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
