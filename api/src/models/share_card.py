"""
Share Card Model
成就分享卡片元數據
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl
from bson import ObjectId

from .user import PyObjectId


class ShareCardBase(BaseModel):
    """Share Card 基礎模型"""
    achievement_id: PyObjectId = Field(..., description="對應的成就 ID")
    user_id: PyObjectId = Field(..., description="使用者 ID")
    achievement_type: str = Field(..., description="成就類型")
    template: Literal["basic", "fireworks", "epic"] = Field(
        default="basic",
        description="分享卡片模板"
    )


class ShareCardInDB(ShareCardBase):
    """資料庫中的 Share Card 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    # Cloudflare R2 儲存資訊
    card_url: str = Field(..., description="卡片圖片 URL (R2)")
    r2_key: str = Field(..., description="R2 物件 key")

    # 卡片內容
    title: str = Field(..., max_length=100, description="卡片標題")
    description: str = Field(..., max_length=500, description="卡片描述")
    metadata: dict = Field(default_factory=dict, description="成就元數據")

    # 隱私設定
    includes_location: bool = Field(default=False, description="是否包含地點資訊")
    includes_detailed_stats: bool = Field(default=True, description="是否包含詳細統計")

    # 快取資訊
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="生成時間")
    expires_at: datetime = Field(..., description="過期時間")

    # 分享統計
    view_count: int = Field(default=0, description="瀏覽次數")
    last_viewed_at: Optional[datetime] = Field(default=None, description="最後瀏覽時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ShareCardResponse(ShareCardBase):
    """API 回傳的 Share Card 模型"""
    id: str = Field(..., alias="_id")
    card_url: str
    title: str
    description: str
    metadata: dict
    generated_at: datetime
    expires_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class ShareCardCreateRequest(BaseModel):
    """建立分享卡片請求"""
    achievement_id: str = Field(..., description="成就 ID")
    template: Literal["basic", "fireworks", "epic"] = Field(
        default="basic",
        description="卡片模板"
    )
    custom_message: Optional[str] = Field(
        default=None,
        max_length=200,
        description="自訂訊息"
    )


class ShareCardStatsUpdate(BaseModel):
    """分享卡片統計更新"""
    card_id: str = Field(..., description="卡片 ID")
    increment_views: bool = Field(default=True, description="是否增加瀏覽次數")
