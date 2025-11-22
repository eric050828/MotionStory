"""
Leaderboard Model
排行榜模型,支援好友排行榜計算與展示
"""

from datetime import datetime
from typing import Literal, List
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


class LeaderboardEntry(BaseModel):
    """排行榜條目"""
    rank: int
    user_id: str
    display_name: str
    avatar_url: str | None = None
    metric_value: float
    workout_count: int = 0

    class Config:
        json_encoders = {ObjectId: str}


class LeaderboardBase(BaseModel):
    """Leaderboard 基礎模型"""
    user_id: PyObjectId = Field(..., description="使用者 ID")
    period: Literal["weekly", "monthly", "quarterly", "yearly"] = Field(
        ...,
        description="排行榜週期：每週、每月、每季、每年"
    )
    metric: Literal["distance", "duration", "workouts", "calories"] = Field(
        ...,
        description="排名指標：距離、時長、運動次數、卡路里"
    )
    metric_value: float = Field(..., description="指標數值")


class LeaderboardInDB(LeaderboardBase):
    """資料庫中的 Leaderboard 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    period_start: datetime = Field(..., description="週期開始日期")
    period_end: datetime = Field(..., description="週期結束日期")
    rank: int = Field(..., description="排名")
    workout_count: int = Field(default=0, description="運動次數")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="最後更新時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class LeaderboardResponse(BaseModel):
    """API 回傳的 Leaderboard 模型"""
    period: Literal["weekly", "monthly", "quarterly", "yearly"]
    metric: Literal["distance", "duration", "workouts", "calories"]
    period_start: datetime
    period_end: datetime
    entries: List[LeaderboardEntry]
    my_rank: int | None = None
    total_participants: int

    class Config:
        json_encoders = {ObjectId: str}
