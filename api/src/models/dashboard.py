"""
Dashboard Model
客製化儀表板配置
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId
from .user import PyObjectId
import uuid


class WidgetPosition(BaseModel):
    """Widget 位置"""
    x: int = Field(..., ge=0, le=11, description="X 座標 (0-11)")
    y: int = Field(..., ge=0, description="Y 座標")


class WidgetSize(BaseModel):
    """Widget 大小"""
    width: int = Field(..., ge=1, le=12, description="寬度 (1-12 grid units)")
    height: int = Field(..., ge=1, le=8, description="高度 (1-8 grid units)")


class WidgetConfig(BaseModel):
    """Widget 配置"""
    time_range: Optional[Literal["7d", "30d", "90d", "1y", "all"]] = Field(default="30d", description="時間範圍")
    workout_types: Optional[List[str]] = Field(default=None, description="篩選運動類型")
    show_trend: bool = Field(default=True, description="顯示趨勢")
    color_scheme: Optional[str] = Field(default="auto", description="色彩配置")


class Widget(BaseModel):
    """Widget 模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Widget 唯一識別碼")
    type: Literal[
        "streak_counter",
        "weekly_stats",
        "monthly_distance",
        "heart_rate_zone",
        "workout_calendar",
        "achievement_showcase",
        "pace_chart",
        "custom_metric"
    ] = Field(..., description="Widget 類型")
    position: WidgetPosition
    size: WidgetSize
    config: WidgetConfig = Field(default_factory=WidgetConfig)


class DashboardBase(BaseModel):
    """Dashboard 基礎模型"""
    name: str = Field(..., min_length=1, max_length=50, description="儀表板名稱")
    widgets: List[Widget] = Field(default_factory=list, max_length=20, description="Widget 列表 (上限 20)")

    @field_validator('widgets')
    @classmethod
    def validate_widget_count(cls, v):
        if len(v) > 20:
            raise ValueError("Widget 數量不得超過 20 個")
        return v


class DashboardCreate(DashboardBase):
    """建立儀表板請求模型"""
    is_default: bool = Field(default=False, description="是否設為預設儀表板")


class DashboardUpdate(BaseModel):
    """更新儀表板請求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    widgets: Optional[List[Widget]] = Field(None, max_length=20)
    is_default: Optional[bool] = None

    @field_validator('widgets')
    @classmethod
    def validate_widget_count(cls, v):
        if v and len(v) > 20:
            raise ValueError("Widget 數量不得超過 20 個")
        return v


class DashboardInDB(DashboardBase):
    """資料庫中的 Dashboard 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="使用者 ID")
    is_default: bool = Field(default=False, description="是否為預設儀表板")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DashboardResponse(DashboardBase):
    """API 回傳的 Dashboard 模型"""
    id: str
    user_id: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
    last_accessed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class WidgetDataResponse(BaseModel):
    """Widget 資料回應"""
    widget_id: str
    widget_type: str
    data: Dict[str, Any] = Field(..., description="Widget 資料內容")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
