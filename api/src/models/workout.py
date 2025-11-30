"""
Workout Model
運動記錄 (核心資料)
"""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId
from .user import PyObjectId


class GeoLocation(BaseModel):
    """GeoJSON Point 地理位置"""
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(..., min_length=2, max_length=2, description="[經度, 緯度]")

    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        if not (-180 <= v[0] <= 180):
            raise ValueError("經度必須在 -180 到 180 之間")
        if not (-90 <= v[1] <= 90):
            raise ValueError("緯度必須在 -90 到 90 之間")
        return v


class WorkoutBase(BaseModel):
    """Workout 基礎模型"""
    workout_type: Literal["running", "cycling", "swimming", "yoga", "gym", "hiking", "other"] = Field(
        ..., description="運動類型"
    )
    start_time: datetime = Field(..., description="開始時間")
    duration_minutes: int = Field(..., gt=0, le=1440, description="運動時長 (分鐘)")
    distance_km: Optional[float] = Field(None, ge=0, description="距離 (公里)")
    pace_min_per_km: Optional[float] = Field(None, ge=0, description="配速 (分鐘/公里)")
    avg_heart_rate: Optional[int] = Field(None, ge=30, le=250, description="平均心率")
    max_heart_rate: Optional[int] = Field(None, ge=30, le=250, description="最大心率")
    calories: Optional[int] = Field(None, ge=0, description="卡路里消耗")
    elevation_gain_m: Optional[int] = Field(None, ge=0, description="爬升高度 (公尺)")
    location: Optional[GeoLocation] = Field(None, description="運動地點 (GeoJSON Point)")
    route_polyline: Optional[str] = Field(None, description="路線 Polyline (Google Maps 編碼)")
    notes: Optional[str] = Field(None, max_length=500, description="備註")


class WorkoutCreate(WorkoutBase):
    """建立運動記錄請求模型"""
    pass


class WorkoutUpdate(BaseModel):
    """更新運動記錄請求模型"""
    workout_type: Optional[Literal["running", "cycling", "swimming", "yoga", "gym", "hiking", "other"]] = None
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, gt=0, le=1440)
    distance_km: Optional[float] = Field(None, ge=0)
    pace_min_per_km: Optional[float] = Field(None, ge=0)
    avg_heart_rate: Optional[int] = Field(None, ge=30, le=250)
    max_heart_rate: Optional[int] = Field(None, ge=30, le=250)
    calories: Optional[int] = Field(None, ge=0)
    elevation_gain_m: Optional[int] = Field(None, ge=0)
    location: Optional[GeoLocation] = None
    route_polyline: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)


class WorkoutInDB(WorkoutBase):
    """資料庫中的 Workout 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="使用者 ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = Field(default=False, description="軟刪除標記")
    deleted_at: Optional[datetime] = Field(None, description="刪除時間")
    synced_from_device: bool = Field(default=False, description="是否從裝置同步")
    device_id: Optional[str] = Field(None, description="裝置識別碼")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class WorkoutResponse(WorkoutBase):
    """API 回傳的 Workout 模型"""
    id: str = Field(..., validation_alias="_id")  # Accept _id input, output as id
    user_id: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class WorkoutBatchCreate(BaseModel):
    """批次建立運動記錄請求模型"""
    workouts: List[WorkoutCreate] = Field(..., min_length=1, max_length=100, description="運動記錄列表")


class WorkoutStatsResponse(BaseModel):
    """運動統計回應模型"""
    total_workouts: int
    total_duration_minutes: int
    total_distance_km: float
    total_calories: int
    avg_heart_rate: Optional[float] = None
    workout_by_type: dict[str, int] = Field(default_factory=dict, description="各類型運動次數")
    favorite_workout_type: Optional[str] = None


class WorkoutExportFormat(BaseModel):
    """運動記錄匯出格式"""
    format: Literal["csv", "json", "gpx"] = Field(default="csv", description="匯出格式")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    workout_types: Optional[List[str]] = None

