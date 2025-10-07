"""
T045: Backend Core - 依賴注入
FastAPI dependencies for database, authentication, and services
"""
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
import jwt

from .database import get_database
from .config import settings
from ..models.user import UserInDB


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> UserInDB:
    """
    驗證 JWT token 並取得當前使用者

    Args:
        credentials: HTTP Bearer token
        db: MongoDB database connection

    Returns:
        UserInDB: 當前使用者資料

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    # Get user from database
    user_data = await db.users.find_one({"_id": user_id})
    if user_data is None:
        raise credentials_exception

    return UserInDB(**user_data)


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    確認使用者帳號為啟用狀態

    Args:
        current_user: 當前使用者

    Returns:
        UserInDB: 啟用的使用者

    Raises:
        HTTPException: 403 if user is inactive or deleted
    """
    if current_user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deleted"
        )

    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Optional[UserInDB]:
    """
    取得可選的使用者（用於公開端點）

    Args:
        credentials: Optional HTTP Bearer token
        db: MongoDB database connection

    Returns:
        Optional[UserInDB]: 使用者資料或 None
    """
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        user_data = await db.users.find_one({"_id": user_id})
        if user_data is None:
            return None

        return UserInDB(**user_data)
    except jwt.InvalidTokenError:
        return None
