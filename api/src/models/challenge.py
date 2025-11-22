"""
Challenge Model
挑戰賽模型,支援創建運動挑戰、追蹤進度與排名管理
"""

from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, Field, field_validator
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


class ChallengeBase(BaseModel):
    """Challenge 基礎模型"""
    creator_id: PyObjectId = Field(..., description="創建者 ID")
    challenge_type: Literal["total_distance", "total_duration", "consecutive_days", "specific_workout_type"] = Field(
        ...,
        description="挑戰類型：總距離、總時長、連續天數、特定運動類型"
    )
    target_value: float = Field(..., gt=0, description="目標數值")
    start_date: datetime = Field(..., description="開始日期")
    end_date: datetime = Field(..., description="結束日期")
    workout_type: Optional[str] = Field(None, description="特定運動類型（當challenge_type為specific_workout_type時必填）")
    privacy: Literal["public", "private"] = Field(default="private", description="隱私設定")


class ChallengeCreate(BaseModel):
    """建立挑戰賽請求模型"""
    challenge_type: Literal["total_distance", "total_duration", "consecutive_days", "specific_workout_type"]
    target_value: float = Field(..., gt=0)
    start_date: datetime
    end_date: datetime
    workout_type: Optional[str] = None
    privacy: Literal["public", "private"] = "private"
    invited_users: List[str] = Field(default_factory=list, max_length=20)

    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, v, info):
        start_date = info.data.get('start_date')
        if start_date and v:
            duration = (v - start_date).days
            if duration < 3:
                raise ValueError('Challenge must be at least 3 days')
            if duration > 90:
                raise ValueError('Challenge cannot exceed 90 days')
        return v


class ChallengeInDB(ChallengeBase):
    """資料庫中的 Challenge 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    description: Optional[str] = Field(None, max_length=500, description="挑戰描述")
    status: Literal["upcoming", "active", "completed"] = Field(default="upcoming", description="挑戰狀態")
    participant_count: int = Field(default=1, description="參與人數（創建者自動參與）")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ChallengeResponse(BaseModel):
    """API 回傳的 Challenge 模型"""
    challenge_id: str
    creator_id: str
    challenge_type: Literal["total_distance", "total_duration", "consecutive_days", "specific_workout_type"]
    target_value: float
    start_date: datetime
    end_date: datetime
    workout_type: Optional[str] = None
    privacy: Literal["public", "private"]
    status: Literal["upcoming", "active", "completed"]
    participant_count: int
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}


class ChallengeListItem(BaseModel):
    """挑戰賽清單項目模型"""
    challenge_id: str
    challenge_type: str
    target_value: float
    start_date: datetime
    end_date: datetime
    status: Literal["upcoming", "active", "completed"]
    participant_count: int
    my_progress: float = 0
    my_rank: Optional[int] = None

    class Config:
        json_encoders = {ObjectId: str}


class ChallengeDetail(ChallengeResponse):
    """挑戰賽詳情模型"""
    description: Optional[str] = None
    creator: dict  # Creator info
    participants: List[dict] = []  # Participant list

    class Config:
        json_encoders = {ObjectId: str}
