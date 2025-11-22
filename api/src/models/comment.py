"""
Comment Model
留言模型,記錄使用者對動態的留言與回覆
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


class CommentBase(BaseModel):
    """Comment 基礎模型"""
    user_id: PyObjectId = Field(..., description="留言的使用者 ID")
    activity_id: PyObjectId = Field(..., description="被留言的動態 ID")
    content: str = Field(..., min_length=1, max_length=200, description="留言內容")
    parent_id: Optional[PyObjectId] = Field(None, description="父留言 ID（回覆功能）")


class CommentCreate(BaseModel):
    """建立留言請求模型"""
    content: str = Field(..., min_length=1, max_length=200)
    parent_id: Optional[str] = None


class CommentInDB(CommentBase):
    """資料庫中的 Comment 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: Literal["normal", "filtered", "reported"] = Field(
        default="normal",
        description="留言狀態：正常、已過濾、已檢舉"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CommentResponse(BaseModel):
    """API 回傳的 Comment 模型"""
    comment_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    content: str
    parent_id: Optional[str] = None
    status: Literal["normal", "filtered", "reported"]
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
