"""
Friendship Model
好友關係模型，支援好友邀請、接受與封鎖管理
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


class FriendshipBase(BaseModel):
    """Friendship 基礎模型"""
    user_id: PyObjectId = Field(..., description="發起邀請的使用者 ID")
    friend_id: PyObjectId = Field(..., description="被邀請的使用者 ID")
    status: Literal["pending", "accepted", "rejected"] = Field(
        default="pending",
        description="好友關係狀態"
    )


class FriendshipCreate(BaseModel):
    """建立好友邀請請求模型"""
    friend_id: str = Field(..., description="目標使用者 ID")


class FriendshipInDB(FriendshipBase):
    """資料庫中的 Friendship 模型"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    invited_at: datetime = Field(default_factory=datetime.utcnow, description="邀請時間")
    accepted_at: Optional[datetime] = Field(None, description="接受時間")
    rejected_at: Optional[datetime] = Field(None, description="拒絕時間")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class FriendshipResponse(BaseModel):
    """API 回傳的 Friendship 模型"""
    friendship_id: str
    user_id: str
    friend_id: str
    status: Literal["pending", "accepted", "rejected"]
    invited_at: datetime
    accepted_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class FriendProfile(BaseModel):
    """好友檔案模型（用於好友清單）"""
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    last_workout_at: Optional[datetime] = None
    total_workouts: int = 0
    friendship_since: datetime

    class Config:
        json_encoders = {ObjectId: str}


class FriendRequest(BaseModel):
    """好友邀請模型（用於待處理清單）"""
    friendship_id: str
    from_user: dict  # UserSearchResult
    invited_at: datetime

    class Config:
        json_encoders = {ObjectId: str}


class UserSearchResult(BaseModel):
    """使用者搜尋結果模型"""
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    is_friend: bool = False
    is_blocked: bool = False

    class Config:
        json_encoders = {ObjectId: str}


class LeaderboardEntry(BaseModel):
    """排行榜條目"""
    rank: int
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    total_distance_km: float = 0
    total_workouts: int = 0
    current_streak: int = 0
    is_current_user: bool = False

    class Config:
        json_encoders = {ObjectId: str}


class LeaderboardResponse(BaseModel):
    """排行榜回應"""
    leaderboard: list  # List[LeaderboardEntry]
    current_user_rank: int
    current_user_stats: dict
    total_friends: int
    period: str  # 'weekly', 'monthly', 'all_time'

    class Config:
        json_encoders = {ObjectId: str}
