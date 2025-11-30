"""
Firebase Admin SDK Configuration
用於驗證 Firebase Authentication tokens
"""

import firebase_admin
from firebase_admin import credentials, auth
from .config import settings
import base64
import json


def initialize_firebase():
    """初始化 Firebase Admin SDK"""
    try:
        # Decode the complete service account JSON from base64
        service_account_json = base64.b64decode(settings.FIREBASE_PRIVATE_KEY).decode('utf-8')
        cred_dict = json.loads(service_account_json)

        # Validate that all required fields are present
        required_fields = ['type', 'project_id', 'private_key', 'client_email', 'token_uri']
        missing_fields = [field for field in required_fields if field not in cred_dict]
        if missing_fields:
            raise ValueError(f"Missing required fields in service account JSON: {missing_fields}")

        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        print(" Firebase Admin SDK initialized")
    except json.JSONDecodeError as e:
        print(f" Firebase initialization failed: Invalid JSON in FIREBASE_PRIVATE_KEY: {e}")
        raise
    except Exception as e:
        print(f" Firebase initialization failed: {e}")
        raise


async def verify_firebase_token(id_token: str) -> dict:
    """
    驗證 Firebase ID Token

    Args:
        id_token: Firebase ID Token from client

    Returns:
        dict: Decoded token containing user info

    Raises:
        ValueError: If token is invalid
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {e}")


async def get_user_by_uid(uid: str):
    """
    根據 UID 取得 Firebase 使用者資訊

    Args:
        uid: Firebase UID

    Returns:
        UserRecord: Firebase user record
    """
    try:
        user = auth.get_user(uid)
        return user
    except Exception as e:
        raise ValueError(f"User not found: {e}")


async def create_firebase_user(email: str, password: str) -> dict:
    """
    在 Firebase Authentication 建立使用者

    Args:
        email: 使用者 email
        password: 密碼

    Returns:
        dict: {"uid": "firebase_uid", "email": "user@example.com"}

    Raises:
        ValueError: Firebase 建立失敗
    """
    try:
        user = auth.create_user(
            email=email,
            password=password,
            email_verified=False
        )

        return {
            "uid": user.uid,
            "email": user.email
        }

    except auth.EmailAlreadyExistsError:
        raise ValueError("Email already exists in Firebase")
    except Exception as e:
        raise ValueError(f"Failed to create Firebase user: {str(e)}")


async def delete_firebase_user(firebase_uid: str) -> None:
    """
    刪除 Firebase Authentication 使用者

    Args:
        firebase_uid: Firebase UID

    Raises:
        ValueError: 刪除失敗
    """
    try:
        auth.delete_user(firebase_uid)

    except auth.UserNotFoundError:
        # 使用者已不存在，視為成功
        pass
    except Exception as e:
        raise ValueError(f"Failed to delete Firebase user: {str(e)}")


async def update_firebase_email(firebase_uid: str, new_email: str) -> None:
    """
    更新 Firebase 使用者 email

    Args:
        firebase_uid: Firebase UID
        new_email: 新的 email

    Raises:
        ValueError: 更新失敗
    """
    try:
        auth.update_user(
            firebase_uid,
            email=new_email,
            email_verified=False
        )

    except auth.UserNotFoundError:
        raise ValueError("Firebase user not found")
    except auth.EmailAlreadyExistsError:
        raise ValueError("Email already exists in Firebase")
    except Exception as e:
        raise ValueError(f"Failed to update Firebase email: {str(e)}")
