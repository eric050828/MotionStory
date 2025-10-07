"""
Authentication API Contract Tests (T012-T017)
測試 Auth API 端點的 request/response contract 符合規格
"""

import pytest
from httpx import AsyncClient


class TestAuthRegister:
    """T012: Contract test POST /auth/register"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_register_success(self, client: AsyncClient):
        """測試成功註冊 - 201 Created"""
        request_data = {
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "display_name": "New User"
        }

        response = await client.post("/api/v1/auth/register", json=request_data)

        # 驗證狀態碼
        assert response.status_code == 201

        # 驗證 response schema
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data

        # 驗證 user object
        user = data["user"]
        assert "id" in user
        assert "email" in user
        assert user["email"] == request_data["email"]
        assert user["display_name"] == request_data["display_name"]
        assert "privacy_settings" in user
        assert "created_at" in user

        # 驗證 token
        assert data["token_type"] == "Bearer"
        assert data["expires_in"] == 604800  # 7 days in seconds

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_register_invalid_email(self, client: AsyncClient):
        """測試無效 email 格式 - 400 Bad Request"""
        request_data = {
            "email": "invalid-email",
            "password": "SecurePass123",
            "display_name": "Test User"
        }

        response = await client.post("/api/v1/auth/register", json=request_data)

        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert data["error"] == "BAD_REQUEST"
        assert "message" in data

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_register_weak_password(self, client: AsyncClient):
        """測試弱密碼 - 400 Bad Request"""
        request_data = {
            "email": "test@example.com",
            "password": "weak",  # 少於 8 字元
            "display_name": "Test User"
        }

        response = await client.post("/api/v1/auth/register", json=request_data)

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"
        assert "password" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_register_duplicate_email(self, client: AsyncClient):
        """測試重複 email - 409 Conflict"""
        request_data = {
            "email": "duplicate@example.com",
            "password": "SecurePass123",
            "display_name": "First User"
        }

        # 第一次註冊成功
        response1 = await client.post("/api/v1/auth/register", json=request_data)
        assert response1.status_code == 201

        # 第二次註冊相同 email - 應該失敗
        response2 = await client.post("/api/v1/auth/register", json=request_data)
        assert response2.status_code == 409
        data = response2.json()
        assert data["error"] == "CONFLICT"
        assert "already registered" in data["message"].lower()


class TestAuthLogin:
    """T013: Contract test POST /auth/login"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_login_success(self, client: AsyncClient):
        """測試成功登入 - 200 OK"""
        # 先註冊使用者
        register_data = {
            "email": "login@example.com",
            "password": "SecurePass123",
            "display_name": "Login User"
        }
        await client.post("/api/v1/auth/register", json=register_data)

        # 登入
        login_data = {
            "email": "login@example.com",
            "password": "SecurePass123"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)

        # 驗證狀態碼
        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        assert data["token_type"] == "Bearer"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_login_invalid_email(self, client: AsyncClient):
        """測試錯誤的 email - 401 Unauthorized"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "SecurePass123"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
        assert "invalid" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_login_invalid_password(self, client: AsyncClient):
        """測試錯誤的密碼 - 401 Unauthorized"""
        # 先註冊使用者
        register_data = {
            "email": "pwdtest@example.com",
            "password": "CorrectPass123",
            "display_name": "Pwd Test User"
        }
        await client.post("/api/v1/auth/register", json=register_data)

        # 用錯誤密碼登入
        login_data = {
            "email": "pwdtest@example.com",
            "password": "WrongPass123"
        }
        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestAuthGoogle:
    """T014: Contract test POST /auth/google"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_google_auth_invalid_token(self, client: AsyncClient):
        """測試無效的 Firebase ID token - 401 Unauthorized"""
        request_data = {
            "firebase_id_token": "invalid-firebase-token-xyz"
        }
        response = await client.post("/api/v1/auth/google", json=request_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"
        assert "firebase" in data["message"].lower() or "token" in data["message"].lower()

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_google_auth_missing_token(self, client: AsyncClient):
        """測試缺少 token - 400 Bad Request"""
        request_data = {}
        response = await client.post("/api/v1/auth/google", json=request_data)

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"


class TestAuthMe:
    """T015: Contract test GET /auth/me"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_current_user_success(self, auth_headers: dict, client: AsyncClient):
        """測試取得目前使用者 - 200 OK"""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "display_name" in data
        assert "privacy_settings" in data
        assert "created_at" in data

        # 驗證 privacy_settings schema
        privacy = data["privacy_settings"]
        assert "share_location" in privacy
        assert "share_detailed_stats" in privacy
        assert isinstance(privacy["share_location"], bool)
        assert isinstance(privacy["share_detailed_stats"], bool)

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """測試未認證存取 - 401 Unauthorized"""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """測試無效 token - 401 Unauthorized"""
        headers = {"Authorization": "Bearer invalid-token-xyz"}
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"


class TestAuthUpdatePrivacy:
    """T016: Contract test PUT /auth/me/privacy"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_privacy_settings_success(self, auth_headers: dict, client: AsyncClient):
        """測試更新隱私設定 - 200 OK"""
        request_data = {
            "share_location": False,
            "share_detailed_stats": True,
            "share_achievements": True,
            "public_profile": False
        }
        response = await client.put(
            "/api/v1/auth/me/privacy",
            headers=auth_headers,
            json=request_data
        )

        assert response.status_code == 200

        # 驗證 response schema
        data = response.json()
        assert "message" in data
        assert "privacy_settings" in data

        privacy = data["privacy_settings"]
        assert privacy["share_location"] == False
        assert privacy["share_detailed_stats"] == True
        assert privacy["share_achievements"] == True
        assert privacy["public_profile"] == False

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_privacy_unauthorized(self, client: AsyncClient):
        """測試未認證更新 - 401 Unauthorized"""
        request_data = {"share_location": False}
        response = await client.put("/api/v1/auth/me/privacy", json=request_data)

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_update_privacy_invalid_data(self, auth_headers: dict, client: AsyncClient):
        """測試無效資料格式 - 400 Bad Request"""
        request_data = {
            "share_location": "invalid-boolean"  # 應該是 boolean
        }
        response = await client.put(
            "/api/v1/auth/me/privacy",
            headers=auth_headers,
            json=request_data
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"


class TestAuthDelete:
    """T017: Contract test DELETE /auth/delete"""

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_user_success(self, auth_headers: dict, client: AsyncClient):
        """測試刪除使用者帳號 - 204 No Content"""
        response = await client.delete("/api/v1/auth/delete", headers=auth_headers)

        # 驗證狀態碼 (204 No Content)
        assert response.status_code == 204

        # 204 應該沒有回應內容
        assert response.content == b''

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_user_unauthorized(self, client: AsyncClient):
        """測試未認證刪除 - 401 Unauthorized"""
        response = await client.delete("/api/v1/auth/delete")

        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    @pytest.mark.contract
    async def test_delete_user_then_access(self, client: AsyncClient):
        """測試刪除帳號後無法再存取 - 401 Unauthorized"""
        # 註冊並取得 token
        register_data = {
            "email": "todelete@example.com",
            "password": "SecurePass123",
            "display_name": "To Delete"
        }
        reg_response = await client.post("/api/v1/auth/register", json=register_data)
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 刪除帳號
        delete_response = await client.delete("/api/v1/auth/delete", headers=headers)
        assert delete_response.status_code == 204

        # 嘗試用相同 token 存取 - 應該失敗
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 401
