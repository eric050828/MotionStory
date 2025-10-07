"""
Milestone Model
時間軸重要里程碑
"""

from datetime import datetime
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from .user import PyObjectId


class MilestoneBase(BaseModel):
    """Milestone 基礎模型"""
    milestone_type: Literal[
        "first_workout",
        "first_5k",
        "first_10k",
        "first_half_marathon",
        "first_marathon",
        "streak_milestone",
        "distance_milestone",
        "custom"
    ] = Field(..., description="里程碑類型")
    title: str = Field(..., min_length=1, max_length=100, description="里程碑標題")
    description: Optional[str] = Field(None, max_length=500, description="詳細描述")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="里程碑元資料")


class MilestoneCreate(MilestoneBase):
    """建立里程碑請求模型"""
    workout_id: Optional[str] = Field(None, description="關聯的運動記錄 ID")
    achieved_at: datetime = Field(default_factory=datetime.utcnow, description="達成時間")


class MilestoneInDB(MilestoneBase):
    """資料庫中的 Milestone 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="使用者 ID")
    workout_id: Optional[PyObjectId] = Field(None, description="關聯的運動記錄 ID")
    achieved_at: datetime = Field(default_factory=datetime.utcnow, description="達成時間")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    highlighted: bool = Field(default=False, description="是否在時間軸高亮顯示")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MilestoneResponse(MilestoneBase):
    """API 回傳的 Milestone 模型"""
    id: str = Field(..., alias="_id")
    user_id: str
    workout_id: Optional[str] = None
    achieved_at: datetime
    created_at: datetime
    highlighted: bool

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
