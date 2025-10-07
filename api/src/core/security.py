"""
Security Module
密碼雜湊、JWT Token 驗證
"""

from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

# 密碼雜湊設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 設定
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# HTTP Bearer Token
security = HTTPBearer()


def hash_password(password: str) -> str:
    """
    密碼雜湊

    Args:
        password: 原始密碼

    Returns:
        str: bcrypt 雜湊後的密碼
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證密碼

    Args:
        plain_password: 原始密碼
        hashed_password: 雜湊後的密碼

    Returns:
        bool: 密碼是否正確
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    建立 JWT access token

    Args:
        data: 要編碼的資料 (通常包含 user_id)
        expires_delta: 過期時間增量，預設 7 天

    Returns:
        str: JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    解碼 JWT token

    Args:
        token: JWT token

    Returns:
        dict: 解碼後的資料

    Raises:
        HTTPException: Token 無效或過期
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    從 Bearer token 取得當前使用者 ID

    Args:
        credentials: HTTP Authorization header

    Returns:
        str: 使用者 ID

    Raises:
        HTTPException: Token 無效
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id: str = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


def validate_password_strength(password: str) -> bool:
    """
    驗證密碼強度

    規則:
    - 至少 8 個字元
    - 至少 1 個大寫字母
    - 至少 1 個小寫字母
    - 至少 1 個數字

    Args:
        password: 密碼

    Returns:
        bool: 密碼是否符合強度要求
    """
    if len(password) < 8:
        return False

    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)

    return has_upper and has_lower and has_digit
