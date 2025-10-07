"""
Auth Service (T061-T062)
Firebase token 驗證與使用者管理
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..core.firebase_admin import verify_firebase_token, create_firebase_user
from ..core.security import create_access_token, hash_password, verify_password
from ..models import UserCreate, UserInDB, UserResponse


class AuthService:
    """認證服務"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users_collection = db.users

    async def verify_token(self, firebase_id_token: str) -> Dict:
        """
        T061: Firebase token 驗證

        Args:
            firebase_id_token: Firebase ID token

        Returns:
            Dict: 解碼的 token payload

        Raises:
            ValueError: Token 無效或過期
        """
        return await verify_firebase_token(firebase_id_token)

    async def register(
        self,
        email: str,
        password: str,
        display_name: str,
        avatar_url: Optional[str] = None
    ) -> tuple[UserInDB, str]:
        """
        T062: 使用者註冊

        Args:
            email: Email
            password: 密碼
            display_name: 顯示名稱
            avatar_url: 頭像 URL

        Returns:
            tuple: (使用者, JWT token)
        """
        # 檢查 email 是否已存在
        existing = await self.users_collection.find_one({"email": email})
        if existing:
            raise ValueError("Email already registered")

        # 建立 Firebase 使用者
        firebase_user = await create_firebase_user(email, password)

        # 建立 MongoDB 使用者
        user = UserInDB(
            firebase_uid=firebase_user["uid"],
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            password_hash=hash_password(password),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        result = await self.users_collection.insert_one(user.dict(by_alias=True))
        user.id = result.inserted_id

        # 生成 JWT token
        access_token = create_access_token(
            data={"user_id": str(user.id)},
            expires_delta=timedelta(days=7)
        )

        return user, access_token

    async def login(self, email: str, password: str) -> tuple[UserInDB, str]:
        """
        T062: 使用者登入

        Args:
            email: Email
            password: 密碼

        Returns:
            tuple: (使用者, JWT token)
        """
        # 查詢使用者
        user_doc = await self.users_collection.find_one({"email": email})
        if not user_doc:
            raise ValueError("Invalid email or password")

        user = UserInDB(**user_doc)

        # 驗證密碼
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        # 更新最後登入時間
        await self.users_collection.update_one(
            {"_id": user.id},
            {"$set": {"last_login_at": datetime.now(timezone.utc)}}
        )

        # 生成 JWT token
        access_token = create_access_token(
            data={"user_id": str(user.id)},
            expires_delta=timedelta(days=7)
        )

        return user, access_token

    async def google_login(self, firebase_id_token: str) -> tuple[UserInDB, str]:
        """
        Google OAuth 登入

        Args:
            firebase_id_token: Firebase ID token

        Returns:
            tuple: (使用者, JWT token)
        """
        # 驗證 Firebase token
        firebase_data = await self.verify_token(firebase_id_token)
        firebase_uid = firebase_data["uid"]
        email = firebase_data.get("email", "")

        # 查詢或建立使用者
        user_doc = await self.users_collection.find_one({"firebase_uid": firebase_uid})

        if not user_doc:
            # 建立新使用者
            user = UserInDB(
                firebase_uid=firebase_uid,
                email=email,
                display_name=firebase_data.get("name", email.split("@")[0]),
                avatar_url=firebase_data.get("picture"),
                password_hash="",  # Google OAuth 不需要密碼
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            result = await self.users_collection.insert_one(user.dict(by_alias=True))
            user.id = result.inserted_id
        else:
            user = UserInDB(**user_doc)

        # 更新最後登入時間
        await self.users_collection.update_one(
            {"_id": user.id},
            {"$set": {"last_login_at": datetime.now(timezone.utc)}}
        )

        # 生成 JWT token
        access_token = create_access_token(
            data={"user_id": str(user.id)},
            expires_delta=timedelta(days=7)
        )

        return user, access_token

    async def get_user(self, user_id: str) -> Optional[UserInDB]:
        """取得使用者資訊"""
        user_doc = await self.users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return None
        return UserInDB(**user_doc)
