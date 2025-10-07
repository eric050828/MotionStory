"""
Application Configuration
使用 Pydantic Settings 管理環境變數
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """應用程式設定"""

    # MongoDB Configuration
    MONGODB_URI: str
    DB_NAME: str = "motionstory"

    # Firebase Configuration
    # FIREBASE_PRIVATE_KEY should contain the complete service account JSON (base64 encoded)
    FIREBASE_PRIVATE_KEY: str
    # The following are optional - they will be extracted from FIREBASE_PRIVATE_KEY if not provided
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None

    # Cloudflare R2 Configuration
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_BUCKET_NAME: str = "motionstory-bucket"

    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_DAYS: int = 7

    # Application Configuration
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
