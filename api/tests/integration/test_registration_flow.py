"""
Integration Test: User Registration Flow (T050)
測試完整註冊流程：註冊 → Firebase 建立 → MongoDB 儲存 → JWT 回傳
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch


class TestRegistrationFlow:
    """測試完整使用者註冊流程整合"""

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_complete_registration_flow_success(self, client: AsyncClient, test_db):
        """測試成功的完整註冊流程"""
        
        # 準備註冊資料
        registration_data = {
            "email": "newuser@example.com",
            "password": "SecurePass123",
            "display_name": "New User"
        }

        # Step 1: 發送註冊請求
        response = await client.post("/api/v1/auth/register", json=registration_data)
        
        assert response.status_code == 201
        data = response.json()

        # Step 2: 驗證回傳的 JWT token
        assert "access_token" in data
        assert data["token_type"] == "Bearer"
        assert data["expires_in"] == 604800  # 7 天

        # Step 3: 驗證使用者資料
        assert "user" in data
        user = data["user"]
        assert user["email"] == "newuser@example.com"
        assert user["display_name"] == "New User"
        assert "id" in user

        # Step 4: 驗證 MongoDB 儲存
        db_user = await test_db.users.find_one({"email": "newuser@example.com"})
        assert db_user is not None
        assert db_user["display_name"] == "New User"
        assert db_user["created_at"] is not None
        assert db_user["privacy_settings"]["share_location"] == False
        assert db_user["privacy_settings"]["share_detailed_stats"] == True

        # Step 5: 驗證密碼已雜湊
        assert "password_hash" in db_user
        assert db_user["password_hash"] != "SecurePass123"
        assert db_user["password_hash"].startswith("$2b$")

        # Step 6: 驗證 JWT token 可用於後續請求
        headers = {"Authorization": f"Bearer {data['access_token']}"}
        profile_response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["email"] == "newuser@example.com"

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_with_firebase_integration(self, client: AsyncClient, test_db):
        """測試與 Firebase 整合的註冊流程"""
        
        with patch('src.core.firebase_admin.create_firebase_user') as mock_firebase:
            # Mock Firebase 使用者建立
            mock_firebase.return_value = {
                'uid': 'firebase-uid-123',
                'email': 'firebase@example.com'
            }

            registration_data = {
                "email": "firebase@example.com",
                "password": "SecurePass123",
                "display_name": "Firebase User"
            }

            response = await client.post("/api/v1/auth/register", json=registration_data)
            
            assert response.status_code == 201
            
            # 驗證 Firebase 建立被呼叫
            mock_firebase.assert_called_once_with(
                email="firebase@example.com",
                password="SecurePass123"
            )

            # 驗證 MongoDB 儲存包含 Firebase UID
            db_user = await test_db.users.find_one({"email": "firebase@example.com"})
            assert db_user["firebase_uid"] == "firebase-uid-123"

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_duplicate_email_registration_fails(self, client: AsyncClient, test_db):
        """測試重複 email 註冊失敗"""
        
        registration_data = {
            "email": "duplicate@example.com",
            "password": "SecurePass123",
            "display_name": "First User"
        }

        # 第一次註冊成功
        response1 = await client.post("/api/v1/auth/register", json=registration_data)
        assert response1.status_code == 201

        # 第二次註冊應該失敗
        registration_data["display_name"] = "Second User"
        response2 = await client.post("/api/v1/auth/register", json=registration_data)
        
        assert response2.status_code == 400
        data = response2.json()
        assert "email" in data["message"].lower() or "已存在" in data["message"]

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_creates_default_dashboard(self, client: AsyncClient, test_db):
        """測試註冊時自動建立預設儀表板"""
        
        registration_data = {
            "email": "dashboard@example.com",
            "password": "SecurePass123",
            "display_name": "Dashboard User"
        }

        response = await client.post("/api/v1/auth/register", json=registration_data)
        assert response.status_code == 201
        
        user_id = response.json()["user"]["id"]

        # 驗證預設儀表板已建立
        dashboard = await test_db.dashboards.find_one({"user_id": user_id})
        
        assert dashboard is not None
        assert dashboard["name"] == "我的儀表板"
        assert len(dashboard["widgets"]) > 0  # 應包含預設 widgets
        
        # 驗證預設 widgets 包含連續天數計數器
        widget_types = [w["type"] for w in dashboard["widgets"]]
        assert "streak_counter" in widget_types

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_rollback_on_firebase_error(self, client: AsyncClient, test_db):
        """測試 Firebase 錯誤時回滾 MongoDB 寫入"""
        
        with patch('src.core.firebase_admin.create_firebase_user') as mock_firebase:
            # Mock Firebase 建立失敗
            mock_firebase.side_effect = Exception("Firebase service unavailable")

            registration_data = {
                "email": "rollback@example.com",
                "password": "SecurePass123",
                "display_name": "Rollback Test"
            }

            response = await client.post("/api/v1/auth/register", json=registration_data)
            
            # 註冊應該失敗
            assert response.status_code in [500, 503]

            # 驗證 MongoDB 沒有儲存資料（已回滾）
            db_user = await test_db.users.find_one({"email": "rollback@example.com"})
            assert db_user is None

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_with_invalid_password_strength(self, client: AsyncClient):
        """測試密碼強度驗證整合"""
        
        weak_passwords = [
            "short",           # 太短
            "nouppercase123",  # 沒有大寫
            "NOLOWERCASE123",  # 沒有小寫
            "NoNumbers",       # 沒有數字
        ]

        for weak_password in weak_passwords:
            registration_data = {
                "email": f"test_{weak_password}@example.com",
                "password": weak_password,
                "display_name": "Test User"
            }

            response = await client.post("/api/v1/auth/register", json=registration_data)
            
            assert response.status_code == 400
            data = response.json()
            assert "password" in data["message"].lower() or "密碼" in data["message"]

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_and_immediate_login(self, client: AsyncClient):
        """測試註冊後立即登入"""
        
        # Step 1: 註冊
        registration_data = {
            "email": "immediate@example.com",
            "password": "SecurePass123",
            "display_name": "Immediate Login"
        }

        register_response = await client.post("/api/v1/auth/register", json=registration_data)
        assert register_response.status_code == 201
        register_token = register_response.json()["access_token"]

        # Step 2: 使用相同帳密登入
        login_data = {
            "email": "immediate@example.com",
            "password": "SecurePass123"
        }

        login_response = await client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_token = login_response.json()["access_token"]

        # 兩個 token 應該不同（不同時間簽發）
        assert register_token != login_token

        # 但兩個 token 都應該有效
        headers1 = {"Authorization": f"Bearer {register_token}"}
        headers2 = {"Authorization": f"Bearer {login_token}"}

        profile1 = await client.get("/api/v1/auth/me", headers=headers1)
        profile2 = await client.get("/api/v1/auth/me", headers=headers2)

        assert profile1.status_code == 200
        assert profile2.status_code == 200
        assert profile1.json()["email"] == profile2.json()["email"]

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_with_privacy_settings(self, client: AsyncClient, test_db):
        """測試註冊時設定隱私選項"""
        
        registration_data = {
            "email": "privacy@example.com",
            "password": "SecurePass123",
            "display_name": "Privacy User",
            "privacy_settings": {
                "share_location": True,
                "share_detailed_stats": False
            }
        }

        response = await client.post("/api/v1/auth/register", json=registration_data)
        assert response.status_code == 201

        # 驗證自訂隱私設定已儲存
        user_id = response.json()["user"]["id"]
        db_user = await test_db.users.find_one({"_id": user_id})
        
        assert db_user["privacy_settings"]["share_location"] == True
        assert db_user["privacy_settings"]["share_detailed_stats"] == False

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_registration_performance(self, client: AsyncClient):
        """測試註冊流程效能（應在 1 秒內完成）"""
        import time

        registration_data = {
            "email": "performance@example.com",
            "password": "SecurePass123",
            "display_name": "Performance Test"
        }

        start_time = time.time()
        response = await client.post("/api/v1/auth/register", json=registration_data)
        end_time = time.time()

        assert response.status_code == 201
        
        # 整個註冊流程應在 1 秒內完成
        duration = end_time - start_time
        assert duration < 1.0, f"Registration took {duration:.2f}s, expected < 1.0s"
