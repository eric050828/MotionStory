"""
Achievement Model
成就與徽章記錄
"""

from datetime import datetime
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from .user import PyObjectId


class AchievementBase(BaseModel):
    """Achievement 基礎模型"""
    achievement_type: str = Field(..., description="成就類型")
    celebration_level: Literal["basic", "fireworks", "epic"] = Field(..., description="慶祝等級")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="成就元資料")


class AchievementCreate(AchievementBase):
    """建立成就請求模型"""
    workout_id: Optional[str] = Field(None, description="觸發的運動記錄 ID")


class AchievementInDB(AchievementBase):
    """資料庫中的 Achievement 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="使用者 ID")
    workout_id: Optional[PyObjectId] = Field(None, description="觸發的運動記錄 ID")
    achieved_at: datetime = Field(default_factory=datetime.utcnow, description="達成時間")
    shared: bool = Field(default=False, description="是否已分享")
    share_card_url: Optional[str] = Field(None, description="分享卡片 URL")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AchievementResponse(AchievementBase):
    """API 回傳的 Achievement 模型"""
    id: str = Field(..., alias="_id")
    user_id: str
    workout_id: Optional[str] = None
    achieved_at: datetime
    shared: bool = False
    share_card_url: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class AchievementTypeInfo(BaseModel):
    """成就類型資訊"""
    type: str = Field(..., description="成就類型識別碼")
    title: str = Field(..., description="成就標題")
    description: str = Field(..., description="成就描述")
    celebration_level: Literal["basic", "fireworks", "epic"]
    icon: str = Field(..., description="成就圖示 emoji 或 URL")
    criteria: Dict[str, Any] = Field(..., description="達成條件")


class AchievementStatsResponse(BaseModel):
    """成就統計回應模型"""
    total_achievements: int
    achievements_by_type: Dict[str, int] = Field(default_factory=dict)
    recent_achievements: list[AchievementResponse] = Field(default_factory=list)
    next_milestone: Optional[AchievementTypeInfo] = None


class ShareCardRequest(BaseModel):
    """分享卡片生成請求"""
    template: Literal["default", "minimalist", "colorful"] = Field(default="default", description="卡片模板")
    include_stats: bool = Field(default=True, description="是否包含統計數據")


class ShareCardResponse(BaseModel):
    """分享卡片回應"""
    achievement_id: str
    card_url: str = Field(..., description="分享卡片圖片 URL")
    expires_at: Optional[datetime] = Field(None, description="URL 過期時間")
