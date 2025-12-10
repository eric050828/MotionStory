"""
Activity Model
社交動態模型，記錄使用者的運動、成就與挑戰分享
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


class ActivityBase(BaseModel):
    """Activity 基礎模型"""
    user_id: PyObjectId = Field(..., description="發布動態的使用者 ID")
    activity_type: Literal["workout", "achievement", "challenge"] = Field(
        ...,
        description="動態類型：運動記錄、成就解鎖、挑戰完成"
    )
    reference_id: PyObjectId = Field(..., description="關聯物件 ID（workout_id/achievement_id/challenge_id）")


class ActivityCreate(BaseModel):
    """建立動態請求模型"""
    activity_type: Literal["workout", "achievement", "challenge"]
    reference_id: str
    content: Optional[dict] = Field(default_factory=dict, description="動態內容快照")
    image_url: Optional[str] = Field(default=None, description="動態配圖 URL")
    caption: Optional[str] = Field(default=None, max_length=500, description="使用者短文/心得")


class ActivityInDB(ActivityBase):
    """資料庫中的 Activity 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    content: dict = Field(default_factory=dict, description="動態內容快照（避免關聯查詢）")
    image_url: Optional[str] = Field(default=None, description="動態配圖 URL")
    caption: Optional[str] = Field(default=None, description="使用者短文/心得")
    likes_count: int = Field(default=0, description="按讚數量")
    comments_count: int = Field(default=0, description="留言數量")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ActivityResponse(BaseModel):
    """API 回傳的 Activity 模型"""
    activity_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    activity_type: Literal["workout", "achievement", "challenge"]
    reference_id: str
    content: dict
    image_url: Optional[str] = None
    caption: Optional[str] = None
    likes_count: int
    comments_count: int
    is_liked_by_me: bool = False
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
