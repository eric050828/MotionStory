"""
Authentication Router
使用者註冊、登入、Google OAuth
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta, timezone
from typing import Dict

from ..core.database import get_database
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    validate_password_strength,
    get_current_user_id
)
from ..core.firebase_admin import (
    create_firebase_user,
    verify_firebase_token,
    delete_firebase_user,
    update_firebase_email
)
from ..models import (
    UserCreate,
    UserResponse,
    UserInDB,
    PrivacySettings,
)
from pydantic import BaseModel, EmailStr
from ..services import DashboardService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    """登入請求模型"""
    email: EmailStr
    password: str


@router.post("/register", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    使用者註冊

    - 建立 Firebase Auth 使用者
    - 儲存至 MongoDB
    - 建立預設儀表板
    - 回傳 JWT token
    """
    # 驗證密碼強度
    if not validate_password_strength(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters with uppercase, lowercase, and digit"
        )

    # 檢查 email 是否已存在
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    try:
        # 建立 Firebase 使用者
        firebase_user = await create_firebase_user(user_data.email, user_data.password)

        # 建立 MongoDB 使用者
        user = UserInDB(
            firebase_uid=firebase_user["uid"],
            email=user_data.email,
            display_name=user_data.display_name,
            avatar_url=user_data.avatar_url,
            password_hash=hash_password(user_data.password),
            privacy_settings=user_data.privacy_settings or PrivacySettings(),
            preferences=user_data.preferences
        )

        result = await db.users.insert_one(user.dict(by_alias=True))
        user_id = result.inserted_id

        # 建立預設儀表板
        dashboard_service = DashboardService(db)
        await dashboard_service.create_default_dashboard(str(user_id))

        # 生成 JWT token
        access_token = create_access_token(
            data={"user_id": str(user_id)},
            expires_delta=timedelta(days=7)
        )

        # 設置 user.id 以便回傳正確的 response
        user.id = user_id

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 604800,  # 7 天
            "user": UserResponse(**user.dict(by_alias=True))
        }

    except ValueError as e:
        # 回滾：刪除 Firebase 使用者和 MongoDB 使用者
        if 'firebase_user' in locals():
            try:
                await delete_firebase_user(firebase_user["uid"])
            except:
                pass

        if 'user_id' in locals():
            try:
                await db.users.delete_one({"_id": user_id})
            except:
                pass

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # 回滾：刪除 Firebase 使用者和 MongoDB 使用者
        if 'firebase_user' in locals():
            try:
                await delete_firebase_user(firebase_user["uid"])
            except:
                pass

        if 'user_id' in locals():
            try:
                await db.users.delete_one({"_id": user_id})
            except:
                pass

        # 提供更詳細的錯誤訊息
        error_detail = str(e)
        if hasattr(e, '__class__'):
            error_detail = f"{e.__class__.__name__}: {str(e)}"

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {error_detail}"
        )


@router.post("/login", response_model=Dict)
async def login(
    login_data: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Email/密碼登入
    """
    # 查詢使用者
    user_doc = await db.users.find_one({"email": login_data.email})

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    user = UserInDB(**user_doc)

    # 驗證密碼
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # 更新最後登入時間
    await db.users.update_one(
        {"_id": user.id},
        {"$set": {"last_login_at": datetime.now(timezone.utc)}}
    )

    # 生成 JWT token
    access_token = create_access_token(
        data={"user_id": str(user.id)},
        expires_delta=timedelta(days=7)
    )

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 604800,
        "user": UserResponse(**user.dict(by_alias=True))
    }


@router.post("/google", response_model=Dict)
async def google_oauth(
    id_token: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Google OAuth 登入

    - 驗證 Firebase ID Token
    - 建立或取得使用者
    - 回傳 JWT token
    """
    try:
        # 驗證 Firebase token
        firebase_data = await verify_firebase_token(id_token)
        firebase_uid = firebase_data["uid"]
        email = firebase_data.get("email", "")

        # 查詢使用者
        user_doc = await db.users.find_one({"firebase_uid": firebase_uid})

        if not user_doc:
            # 建立新使用者
            user = UserInDB(
                firebase_uid=firebase_uid,
                email=email,
                display_name=firebase_data.get("name", email.split("@")[0]),
                avatar_url=firebase_data.get("picture"),
                password_hash="",  # Google OAuth 不需要密碼
            )

            result = await db.users.insert_one(user.dict(by_alias=True))
            user.id = result.inserted_id

            # 建立預設儀表板
            dashboard_service = DashboardService(db)
            await dashboard_service.create_default_dashboard(str(user.id))

        else:
            user = UserInDB(**user_doc)

        # 更新最後登入時間
        await db.users.update_one(
            {"_id": user.id},
            {"$set": {"last_login_at": datetime.now(timezone.utc)}}
        )

        # 生成 JWT token
        access_token = create_access_token(
            data={"user_id": str(user.id)},
            expires_delta=timedelta(days=7)
        )

        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 604800,
            "user": UserResponse(**user.dict(by_alias=True))
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    取得當前使用者資訊
    """
    from bson import ObjectId

    user_doc = await db.users.find_one({"_id": ObjectId(current_user_id)})

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(**user_doc)


@router.put("/me/privacy", response_model=UserResponse)
async def update_privacy_settings(
    privacy_settings: PrivacySettings,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    更新隱私設定
    """
    from bson import ObjectId

    result = await db.users.find_one_and_update(
        {"_id": ObjectId(current_user_id)},
        {
            "$set": {
                "privacy_settings": privacy_settings.dict(),
                "updated_at": datetime.now(timezone.utc)
            }
        },
        return_document=True
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(**result)


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    刪除帳號 (30 天後永久刪除)

    - 標記使用者為待刪除
    - 30 天後由背景任務永久刪除
    """
    from bson import ObjectId

    user_doc = await db.users.find_one({"_id": ObjectId(current_user_id)})

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 標記為待刪除
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {
            "$set": {
                "deletion_scheduled": True,
                "deleted_at": datetime.now(timezone.utc),
            }
        }
    )

    return None
