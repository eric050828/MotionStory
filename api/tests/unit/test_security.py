"""
Security Unit Tests (T041)
測試密碼雜湊、驗證與 JWT token 生成邏輯
"""

import pytest
from datetime import datetime, timedelta, timezone


class TestPasswordHashing:
    """測試密碼雜湊功能"""

    def test_password_hash_generation(self):
        """測試密碼雜湊生成"""
        from src.core.security import hash_password

        password = "SecurePass123"
        hashed = hash_password(password)

        # 驗證雜湊值格式
        assert hashed.startswith("$2b$")
        assert len(hashed) == 60  # bcrypt 固定長度

    def test_password_hash_uniqueness(self):
        """測試相同密碼產生不同雜湊值 (salt)"""
        from src.core.security import hash_password

        password = "SecurePass123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # 由於 salt 不同，雜湊值應該不同
        assert hash1 != hash2

    def test_password_verification_success(self):
        """測試正確密碼驗證成功"""
        from src.core.security import hash_password, verify_password

        password = "SecurePass123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) == True

    def test_password_verification_failure(self):
        """測試錯誤密碼驗證失敗"""
        from src.core.security import hash_password, verify_password

        password = "SecurePass123"
        wrong_password = "WrongPass456"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) == False

    def test_password_hash_consistency(self):
        """測試雜湊值一致性"""
        from src.core.security import hash_password, verify_password

        password = "TestPassword789"
        hashed = hash_password(password)

        # 多次驗證應該都成功
        assert verify_password(password, hashed) == True
        assert verify_password(password, hashed) == True
        assert verify_password(password, hashed) == True


class TestJWTTokenGeneration:
    """測試 JWT token 生成與驗證"""

    def test_jwt_token_creation(self):
        """測試 JWT token 建立"""
        from src.core.security import create_access_token

        user_id = "507f191e810c19729de860ea"
        token = create_access_token(user_id)

        # 驗證 token 格式 (JWT 包含 3 個部分，以 . 分隔)
        parts = token.split(".")
        assert len(parts) == 3

    def test_jwt_token_payload(self):
        """測試 JWT token payload 包含正確資料"""
        from src.core.security import create_access_token, decode_access_token

        user_id = "507f191e810c19729de860ea"
        token = create_access_token(user_id)

        # 解碼 token
        payload = decode_access_token(token)

        assert payload["sub"] == user_id
        assert "exp" in payload
        assert "iat" in payload

    def test_jwt_token_expiration(self):
        """測試 JWT token 過期時間設定 (7 天)"""
        from src.core.security import create_access_token, decode_access_token

        user_id = "507f191e810c19729de860ea"
        token = create_access_token(user_id)

        payload = decode_access_token(token)
        exp_timestamp = payload["exp"]
        iat_timestamp = payload["iat"]

        # 驗證過期時間為 7 天 (604800 秒)
        expiration_seconds = exp_timestamp - iat_timestamp
        assert expiration_seconds == 604800

    def test_jwt_token_verification_success(self):
        """測試有效 token 驗證成功"""
        from src.core.security import create_access_token, decode_access_token

        user_id = "507f191e810c19729de860ea"
        token = create_access_token(user_id)

        # 驗證應該成功
        payload = decode_access_token(token)
        assert payload["sub"] == user_id

    def test_jwt_token_verification_invalid_token(self):
        """測試無效 token 驗證失敗"""
        from src.core.security import decode_access_token

        invalid_token = "invalid.token.string"

        with pytest.raises(Exception):  # 應拋出 JWT 驗證錯誤
            decode_access_token(invalid_token)

    def test_jwt_token_verification_expired_token(self):
        """測試過期 token 驗證失敗"""
        from src.core.security import create_access_token, decode_access_token

        user_id = "507f191e810c19729de860ea"

        # 建立已過期的 token (expires_delta = -1 天)
        expired_token = create_access_token(
            user_id,
            expires_delta=timedelta(days=-1)
        )

        with pytest.raises(Exception):  # 應拋出過期錯誤
            decode_access_token(expired_token)

    def test_jwt_token_custom_expiration(self):
        """測試自訂過期時間"""
        from src.core.security import create_access_token, decode_access_token

        user_id = "507f191e810c19729de860ea"

        # 建立 1 小時過期的 token
        token = create_access_token(
            user_id,
            expires_delta=timedelta(hours=1)
        )

        payload = decode_access_token(token)
        exp_timestamp = payload["exp"]
        iat_timestamp = payload["iat"]

        # 驗證過期時間為 1 小時 (3600 秒)
        expiration_seconds = exp_timestamp - iat_timestamp
        assert expiration_seconds == 3600


class TestPasswordStrengthValidation:
    """測試密碼強度驗證"""

    def test_password_minimum_length(self):
        """測試密碼最短長度 (8 字元)"""
        from src.core.security import validate_password_strength

        # 太短的密碼
        assert validate_password_strength("Short1") == False

        # 符合長度要求
        assert validate_password_strength("LongPass1") == True

    def test_password_requires_uppercase(self):
        """測試密碼必須包含大寫字母"""
        from src.core.security import validate_password_strength

        # 沒有大寫字母
        assert validate_password_strength("lowercase123") == False

        # 包含大寫字母
        assert validate_password_strength("Uppercase123") == True

    def test_password_requires_lowercase(self):
        """測試密碼必須包含小寫字母"""
        from src.core.security import validate_password_strength

        # 沒有小寫字母
        assert validate_password_strength("UPPERCASE123") == False

        # 包含小寫字母
        assert validate_password_strength("Lowercase123") == True

    def test_password_requires_number(self):
        """測試密碼必須包含數字"""
        from src.core.security import validate_password_strength

        # 沒有數字
        assert validate_password_strength("NoNumbers") == False

        # 包含數字
        assert validate_password_strength("WithNumbers1") == True

    def test_password_strength_all_requirements(self):
        """測試密碼滿足所有強度要求"""
        from src.core.security import validate_password_strength

        # 符合所有要求：至少 8 字元、包含大小寫字母與數字
        valid_passwords = [
            "SecurePass123",
            "MyPassword1",
            "StrongPwd99",
            "ComplexPass123"
        ]

        for password in valid_passwords:
            assert validate_password_strength(password) == True

        # 不符合要求的密碼
        invalid_passwords = [
            "short1",           # 太短
            "nouppercase123",   # 沒有大寫
            "NOLOWERCASE123",   # 沒有小寫
            "NoNumbers",        # 沒有數字
            "weakpwd"           # 多項不符合
        ]

        for password in invalid_passwords:
            assert validate_password_strength(password) == False


class TestFirebaseTokenVerification:
    """測試 Firebase ID token 驗證"""

    def test_firebase_token_verification_mock(self):
        """測試 Firebase token 驗證 (使用 mock)"""
        from unittest.mock import patch
        from src.core.firebase_admin import verify_firebase_token

        # Mock Firebase Admin SDK
        with patch('firebase_admin.auth.verify_id_token') as mock_verify:
            mock_verify.return_value = {
                'uid': 'firebase-uid-123',
                'email': 'user@example.com'
            }

            result = verify_firebase_token("valid-firebase-token")

            assert result['uid'] == 'firebase-uid-123'
            assert result['email'] == 'user@example.com'
            mock_verify.assert_called_once_with("valid-firebase-token")

    def test_firebase_token_verification_invalid_token(self):
        """測試無效 Firebase token 驗證失敗"""
        from unittest.mock import patch
        from src.core.firebase_admin import verify_firebase_token

        # Mock Firebase Admin SDK 拋出錯誤
        with patch('firebase_admin.auth.verify_id_token') as mock_verify:
            mock_verify.side_effect = Exception("Invalid token")

            with pytest.raises(ValueError) as exc_info:
                verify_firebase_token("invalid-token")

            assert "Invalid Firebase token" in str(exc_info.value)
