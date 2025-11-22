"""
Notification Model
通知模型,支援推播通知管理與偏好設定
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field
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


class NotificationBase(BaseModel):
    """Notification 基礎模型"""
    user_id: PyObjectId = Field(..., description="接收者 ID")
    notification_type: Literal["friend_request", "friend_activity", "interaction", "challenge_update"] = Field(
        ...,
        description="通知類型：好友邀請、好友動態、互動、挑戰更新"
    )
    title: str = Field(..., max_length=100, description="通知標題")
    message: str = Field(..., max_length=500, description="通知內容")
    reference_type: Optional[Literal["friendship", "activity", "like", "comment", "challenge"]] = Field(
        None,
        description="關聯物件類型"
    )
    reference_id: Optional[PyObjectId] = Field(None, description="關聯物件 ID")
    sender_id: Optional[PyObjectId] = Field(None, description="發送者 ID")


class NotificationCreate(BaseModel):
    """建立通知請求模型"""
    user_id: str
    notification_type: Literal["friend_request", "friend_activity", "interaction", "challenge_update"]
    title: str = Field(..., max_length=100)
    message: str = Field(..., max_length=500)
    reference_type: Optional[Literal["friendship", "activity", "like", "comment", "challenge"]] = None
    reference_id: Optional[str] = None
    sender_id: Optional[str] = None


class NotificationInDB(NotificationBase):
    """資料庫中的 Notification 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_read: bool = Field(default=False, description="是否已讀")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = Field(None, description="已讀時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class NotificationResponse(BaseModel):
    """API 回傳的 Notification 模型"""
    notification_id: str
    user_id: str
    notification_type: Literal["friend_request", "friend_activity", "interaction", "challenge_update"]
    title: str
    message: str
    reference_type: Optional[Literal["friendship", "activity", "like", "comment", "challenge"]] = None
    reference_id: Optional[str] = None
    sender: Optional[dict] = None  # Sender info
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}


class NotificationPreferences(BaseModel):
    """通知偏好設定模型"""
    user_id: str
    friend_request_enabled: bool = True
    friend_activity_enabled: bool = True
    interaction_enabled: bool = True
    challenge_update_enabled: bool = True
    notification_frequency: Literal["realtime", "daily_digest", "off"] = "realtime"
    daily_digest_time: str = "08:00"
    do_not_disturb_enabled: bool = False
    do_not_disturb_start: Optional[str] = None
    do_not_disturb_end: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}
