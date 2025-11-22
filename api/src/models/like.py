"""
Like Model
按讚模型，記錄使用者對動態的按讚行為
"""

from datetime import datetime
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


class LikeBase(BaseModel):
    """Like 基礎模型"""
    user_id: PyObjectId = Field(..., description="按讚的使用者 ID")
    activity_id: PyObjectId = Field(..., description="被按讚的動態 ID")


class LikeCreate(BaseModel):
    """建立按讚請求模型"""
    activity_id: str


class LikeInDB(LikeBase):
    """資料庫中的 Like 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    liked_at: datetime = Field(default_factory=datetime.utcnow, description="按讚時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class LikeResponse(BaseModel):
    """API 回傳的 Like 模型"""
    like_id: str
    user_id: str
    activity_id: str
    liked_at: datetime

    class Config:
        json_encoders = {ObjectId: str}
