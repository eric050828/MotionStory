"""
Annual Review Model
年度回顧統計資料快取
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId


class MonthlyUsageStats(BaseModel):
    """月份使用統計"""
    month: int = Field(..., ge=1, le=12, description="月份 (1-12)")
    workout_count: int = Field(default=0, description="運動次數")
    total_duration_minutes: int = Field(default=0, description="總運動時長 (分鐘)")
    total_distance_km: float = Field(default=0.0, description="總距離 (公里)")
    avg_heart_rate: Optional[int] = Field(default=None, description="平均心率")


class WorkoutTypeSummary(BaseModel):
    """運動類型統計"""
    workout_type: str = Field(..., description="運動類型")
    count: int = Field(..., description="次數")
    total_distance_km: float = Field(..., description="總距離")
    total_duration_minutes: int = Field(..., description="總時長")


class TrendAnalysis(BaseModel):
    """趨勢分析"""
    metric: str = Field(..., description="指標名稱 (distance, duration, frequency)")
    trend: str = Field(..., description="趨勢方向 (increasing, decreasing, stable)")
    change_percentage: float = Field(..., description="變化百分比")
    insight: str = Field(..., description="洞察說明")


class MilestoneSummary(BaseModel):
    """里程碑摘要"""
    milestone_id: str = Field(..., description="Milestone ID")
    milestone_type: str = Field(..., description="里程碑類型")
    title: str = Field(..., description="標題")
    achieved_at: datetime = Field(..., description="達成時間")


class AnnualReviewBase(BaseModel):
    """Annual Review 基礎模型"""
    user_id: PyObjectId = Field(..., description="使用者 ID")
    year: int = Field(..., ge=2020, le=2100, description="年份")
    usage_months: List[int] = Field(
        default_factory=list,
        description="有運動記錄的月份列表",
        max_length=12
    )


class AnnualReviewInDB(AnnualReviewBase):
    """資料庫中的 Annual Review 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    # 總體統計
    total_workouts: int = Field(default=0, description="總運動次數")
    total_duration_minutes: int = Field(default=0, description="總運動時長")
    total_distance_km: float = Field(default=0.0, description="總距離")
    total_calories: int = Field(default=0, description="總消耗卡路里")

    # 月度統計
    monthly_stats: List[MonthlyUsageStats] = Field(
        default_factory=list,
        description="月度統計資料"
    )

    # 運動類型統計
    workout_type_summary: List[WorkoutTypeSummary] = Field(
        default_factory=list,
        description="運動類型統計"
    )

    # 趨勢分析
    trends: List[TrendAnalysis] = Field(
        default_factory=list,
        description="趨勢分析"
    )

    # 里程碑
    milestones: List[MilestoneSummary] = Field(
        default_factory=list,
        description="年度達成的里程碑"
    )

    # 個人紀錄
    personal_records: dict = Field(
        default_factory=dict,
        description="個人紀錄 (longest_distance, fastest_pace, etc.)"
    )

    # 快取資訊
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="生成時間")
    cache_expires_at: datetime = Field(..., description="快取過期時間")

    # 圖片匯出
    export_image_url: Optional[str] = Field(default=None, description="匯出圖片 URL (R2)")
    export_generated_at: Optional[datetime] = Field(default=None, description="圖片生成時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AnnualReviewResponse(AnnualReviewBase):
    """API 回傳的 Annual Review 模型"""
    id: str = Field(..., alias="_id")
    total_workouts: int
    total_duration_minutes: int
    total_distance_km: float
    total_calories: int
    monthly_stats: List[MonthlyUsageStats]
    workout_type_summary: List[WorkoutTypeSummary]
    trends: List[TrendAnalysis]
    milestones: List[MilestoneSummary]
    personal_records: dict
    generated_at: datetime
    export_image_url: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class AnnualReviewExportRequest(BaseModel):
    """年度回顧圖片匯出請求"""
    theme: str = Field(default="default", description="視覺主題")
    include_milestones: bool = Field(default=True, description="是否包含里程碑")
    include_trends: bool = Field(default=True, description="是否包含趨勢分析")


class AnnualReviewExportResponse(BaseModel):
    """年度回顧圖片匯出回應"""
    export_url: str = Field(..., description="匯出圖片 URL (Cloudflare R2)")
    generated_at: datetime = Field(..., description="生成時間")
    expires_in_seconds: int = Field(default=604800, description="URL 有效期 (7天)")
