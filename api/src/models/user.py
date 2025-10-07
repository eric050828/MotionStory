"""
User Model
使用者帳號、個人資料、隱私設定
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class PyObjectId(str):
    """Custom ObjectId for Pydantic V2"""
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ], serialization=core_schema.plain_serializer_function_ser_schema(str))

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class PrivacySettings(BaseModel):
    """隱私設定"""
    share_location: bool = Field(default=False, description="分享卡片是否顯示地點")
    share_detailed_stats: bool = Field(default=True, description="是否分享詳細統計數據")
    share_achievements: bool = Field(default=True, description="是否分享成就至社群")
    public_profile: bool = Field(default=False, description="公開個人檔案 (未來功能)")


class UserPreferences(BaseModel):
    """使用者偏好設定"""
    language: Literal["zh-TW", "en", "ja"] = Field(default="zh-TW", description="介面語言")
    measurement_unit: Literal["metric", "imperial"] = Field(default="metric", description="測量單位")
    notification_enabled: bool = Field(default=True, description="是否啟用通知")


class SubscriptionInfo(BaseModel):
    """訂閱方案資訊"""
    tier: Literal["free", "premium"] = Field(default="free", description="訂閱方案")
    expires_at: Optional[datetime] = Field(default=None, description="付費版到期日")


class UserBase(BaseModel):
    """User 基礎模型"""
    firebase_uid: str = Field(..., min_length=10, max_length=128, description="Firebase Auth UID")
    email: EmailStr = Field(..., description="使用者 Email")
    display_name: str = Field(..., min_length=1, max_length=50, description="顯示名稱")
    avatar_url: Optional[str] = Field(default=None, description="使用者頭像 URL")


class UserCreate(UserBase):
    """建立使用者請求模型"""
    password: str = Field(..., min_length=8, description="密碼 (建立時需要)")
    privacy_settings: Optional[PrivacySettings] = Field(default_factory=PrivacySettings)
    preferences: Optional[UserPreferences] = Field(default_factory=UserPreferences)


class UserUpdate(BaseModel):
    """更新使用者請求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=50)
    avatar_url: Optional[str] = None
    privacy_settings: Optional[PrivacySettings] = None
    preferences: Optional[UserPreferences] = None


class UserInDB(UserBase):
    """資料庫中的 User 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str = Field(..., description="密碼雜湊值")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    privacy_settings: PrivacySettings = Field(default_factory=PrivacySettings)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    subscription: SubscriptionInfo = Field(default_factory=SubscriptionInfo)
    deleted_at: Optional[datetime] = None
    deletion_scheduled: bool = Field(default=False)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(UserBase):
    """API 回傳的 User 模型 (不含敏感資訊)"""
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    privacy_settings: PrivacySettings
    preferences: UserPreferences
    subscription: SubscriptionInfo

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
