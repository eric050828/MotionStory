"""
BlockList Model
封鎖名單模型,記錄使用者封鎖關係
"""

from datetime import datetime
from typing import Optional
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


class BlockListBase(BaseModel):
    """BlockList 基礎模型"""
    user_id: PyObjectId = Field(..., description="封鎖者 ID")
    blocked_user_id: PyObjectId = Field(..., description="被封鎖者 ID")
    reason: Optional[str] = Field(None, max_length=200, description="封鎖原因")


class BlockListCreate(BaseModel):
    """建立封鎖請求模型"""
    blocked_user_id: str
    reason: Optional[str] = Field(None, max_length=200)


class BlockListInDB(BlockListBase):
    """資料庫中的 BlockList 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    blocked_at: datetime = Field(default_factory=datetime.utcnow, description="封鎖時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class BlockListResponse(BaseModel):
    """API 回傳的 BlockList 模型"""
    block_id: str
    user_id: str
    blocked_user_id: str
    blocked_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
