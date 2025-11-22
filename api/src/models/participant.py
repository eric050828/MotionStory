"""
Participant Model
挑戰參與者模型,記錄使用者在挑戰中的進度與狀態
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


class ParticipantBase(BaseModel):
    """Participant 基礎模型"""
    challenge_id: PyObjectId = Field(..., description="挑戰 ID")
    user_id: PyObjectId = Field(..., description="參與者 ID")
    status: Literal["active", "completed", "withdrawn"] = Field(
        default="active",
        description="參與狀態：進行中、已完成、已退出"
    )


class ParticipantCreate(BaseModel):
    """加入挑戰請求模型"""
    challenge_id: str


class ParticipantInDB(ParticipantBase):
    """資料庫中的 Participant 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    joined_at: datetime = Field(default_factory=datetime.utcnow, description="加入時間")
    current_progress: float = Field(default=0, description="當前進度數值")
    completion_percentage: float = Field(default=0, description="完成百分比")
    rank: Optional[int] = Field(None, description="當前排名")
    badge: Optional[Literal["gold", "silver", "bronze", "challenger", "super_challenger"]] = Field(
        None,
        description="獲得的徽章（挑戰完成後）"
    )
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="最後更新時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ParticipantResponse(BaseModel):
    """API 回傳的 Participant 模型"""
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    joined_at: datetime
    current_progress: float
    completion_percentage: float
    rank: Optional[int] = None
    status: Literal["active", "completed", "withdrawn"]

    class Config:
        json_encoders = {ObjectId: str}


class LeaderboardEntry(BaseModel):
    """排行榜條目模型"""
    rank: int
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    current_progress: float
    completion_percentage: float
    badge: Optional[Literal["gold", "silver", "bronze", "challenger", "super_challenger"]] = None

    class Config:
        json_encoders = {ObjectId: str}
