# Data Model: MotionStory 資料模型設計

**Version**: 1.0
**Date**: 2025-10-07
**Status**: Ready for Implementation

---

## 目錄

1. [資料庫選擇與架構](#1-資料庫選擇與架構)
2. [Collections 概覽](#2-collections-概覽)
3. [詳細 Schema 定義](#3-詳細-schema-定義)
4. [索引設計策略](#4-索引設計策略)
5. [關聯關係設計](#5-關聯關係設計)
6. [資料驗證規則](#6-資料驗證規則)
7. [免費方案優化](#7-免費方案優化)
8. [同步機制設計](#8-同步機制設計)

---

## 1. 資料庫選擇與架構

### 1.1 技術選型

**MongoDB Atlas Free Tier (M0)**
- **儲存空間**: 512MB
- **RAM**: 共享 (Shared)
- **連線數**: 最多 500 concurrent connections
- **備份**: 無自動備份 (需手動匯出)
- **地區**: 選擇 Singapore (靠近目標使用者)

**選擇理由**:
1. **Schema 彈性**: 支援動態 Widget 配置、自訂欄位擴充
2. **文件導向**: 天然適合嵌入式資料 (Dashboard widgets, Achievement metadata)
3. **GeoJSON 支援**: 未來擴充地點追蹤功能
4. **Aggregation Pipeline**: 高效年度回顧統計運算
5. **免費方案充足**: 512MB 足夠 MVP 階段 (估算 1000+ 使用者)

### 1.2 資料模型哲學

採用 **Hybrid Approach** (混合嵌入式與參考式):
- **Embedded**: 常一起查詢、資料量小、更新頻率低 → `widgets[]`, `privacy_settings{}`
- **Reference**: 獨立查詢、資料量大、頻繁更新 → `workouts`, `achievements`

---

## 2. Collections 概覽

| Collection | 用途 | 預估文件大小 | 索引數量 | 關聯類型 |
|-----------|------|-------------|---------|---------|
| `users` | 使用者帳號與設定 | ~500 bytes | 2 | - |
| `workouts` | 運動記錄 (主要資料) | ~800 bytes | 4 | Reference to users |
| `achievements` | 成就與徽章記錄 | ~400 bytes | 3 | Reference to users, workouts |
| `dashboards` | 客製化儀表板配置 | ~2KB | 2 | Reference to users, Embedded widgets |
| `milestones` | 時間軸重要里程碑 | ~300 bytes | 2 | Reference to users, workouts |
| `annual_reviews` | 年度回顧資料快取 | ~5KB | 2 | Reference to users |
| `share_cards` | 分享卡片元資料 | ~200 bytes | 2 | Reference to users, achievements |

---

## 3. 詳細 Schema 定義

### 3.1 Users Collection

**用途**: 儲存使用者帳號、個人資料、隱私設定

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "firebase_uid": "abc123xyz456",  // Firebase Auth UID (唯一)
  "email": "user@example.com",
  "display_name": "運動愛好者小美",
  "avatar_url": "https://r2.motionstory.com/avatars/user123.jpg",  // 可選
  "created_at": ISODate("2024-01-01T08:00:00Z"),
  "updated_at": ISODate("2024-12-31T15:30:00Z"),
  "last_login_at": ISODate("2024-12-31T15:30:00Z"),
  "privacy_settings": {
    "share_location": false,  // 是否在分享卡片顯示地點
    "share_detailed_stats": true,  // 是否分享詳細數據
    "public_profile": false  // 未來功能: 公開個人檔案
  },
  "preferences": {
    "language": "zh-TW",  // zh-TW, en, ja
    "measurement_unit": "metric",  // metric (公里), imperial (英里)
    "notification_enabled": true
  },
  "subscription": {
    "tier": "free",  // free, premium (未來擴充)
    "expires_at": null  // 付費版到期日
  },
  "deleted_at": null,  // 帳號刪除時間 (null = 未刪除)
  "deletion_scheduled": false  // 是否已排程刪除 (90 天後永久刪除)
}
```

**欄位說明**:
- `firebase_uid`: **必填**, 與 Firebase Authentication 綁定的唯一識別碼
- `email`: **必填**, 使用者 Email (唯一)
- `display_name`: **必填**, 顯示名稱
- `avatar_url`: **可選**, 使用者頭像 (儲存於 Cloudflare R2)
- `privacy_settings`: **嵌入式**, 隱私控制設定 (分享卡片、公開檔案)
- `preferences`: **嵌入式**, 使用者偏好設定 (語言、單位、通知)
- `subscription`: **嵌入式**, 訂閱方案資訊 (未來擴充付費功能)

**資料驗證**:
```python
from pydantic import BaseModel, EmailStr, Field
from typing import Literal

class PrivacySettings(BaseModel):
    share_location: bool = False  # 分享卡片是否顯示地點
    share_detailed_stats: bool = True  # 是否分享詳細統計數據
    share_achievements: bool = True  # 是否分享成就至社群
    public_profile: bool = False  # 公開個人檔案 (未來功能)

class UserPreferences(BaseModel):
    language: Literal["zh-TW", "en", "ja"] = "zh-TW"
    measurement_unit: Literal["metric", "imperial"] = "metric"
    notification_enabled: bool = True

class UserCreate(BaseModel):
    firebase_uid: str = Field(..., min_length=10, max_length=128)
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=50)
    avatar_url: str | None = None
```

---

### 3.2 Workouts Collection

**用途**: 儲存所有運動記錄 (核心資料)

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "user_id": ObjectId("507f1f77bcf86cd799439011"),  // Reference to users._id
  "workout_type": "running",  // running, cycling, swimming, yoga, gym, ...
  "start_time": ISODate("2024-12-31T07:00:00Z"),
  "duration_minutes": 45,
  "distance_km": 8.5,
  "pace_min_per_km": 5.29,  // 計算欄位: duration_minutes / distance_km
  "avg_heart_rate": 152,  // 可選: 平均心率
  "max_heart_rate": 178,  // 可選: 最大心率
  "calories": 450,  // 可選: 卡路里消耗
  "elevation_gain_m": 120,  // 可選: 爬升高度 (公尺)
  "location": {  // GeoJSON Point (可選, 用於未來地圖功能)
    "type": "Point",
    "coordinates": [121.5654, 25.0330]  // [經度, 緯度]
  },
  "location_name": "大安森林公園",  // 可選: 地點名稱
  "notes": "今天狀態不錯，達成個人最佳配速！",  // 可選: 使用者備註
  "weather": {  // 可選: 天氣資訊 (未來功能)
    "temperature_c": 22,
    "condition": "sunny"
  },
  "is_deleted": false,  // 軟刪除標記
  "deleted_at": null,  // 刪除時間 (軟刪除後 30 天清理)
  "sync_status": "synced",  // synced, pending, conflict
  "device_id": "iphone-12-mini",  // 記錄來源裝置
  "created_at": ISODate("2024-12-31T07:45:00Z"),
  "updated_at": ISODate("2024-12-31T07:45:00Z")
}
```

**欄位說明**:
- `user_id`: **必填**, 關聯至 users collection
- `workout_type`: **必填**, 運動類型 (預設支援 10+ 種類型)
- `start_time`: **必填**, 運動開始時間 (ISO 8601 格式)
- `duration_minutes`: **必填**, 運動時長 (分鐘)
- `distance_km`: **可選**, 距離 (公里) - 部分運動無距離 (如瑜伽)
- `pace_min_per_km`: **計算欄位**, 配速 = duration / distance
- `location`: **可選**, GeoJSON Point 格式 (經緯度)
- `is_deleted`: **必填**, 軟刪除標記 (預設 false)
- `sync_status`: **必填**, 同步狀態 (用於離線同步)

**資料驗證**:
```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Literal

class WorkoutCreate(BaseModel):
    workout_type: Literal[
        "running", "cycling", "swimming", "walking",
        "hiking", "yoga", "gym", "tennis", "basketball", "other"
    ]
    start_time: datetime
    duration_minutes: int = Field(..., gt=0, le=600)  # 1分鐘 ~ 10小時
    distance_km: float | None = Field(None, ge=0, le=300)  # 最大 300 公里
    avg_heart_rate: int | None = Field(None, ge=40, le=220)
    notes: str | None = Field(None, max_length=500)

    @field_validator('distance_km')
    def validate_distance(cls, v, values):
        # 跑步/騎車必須有距離
        if values.get('workout_type') in ['running', 'cycling'] and v is None:
            raise ValueError('Distance is required for running/cycling')
        return v
```

**運動類型定義**:
```python
WORKOUT_TYPES = {
    "running": {"icon": "🏃", "requires_distance": True, "default_unit": "km"},
    "cycling": {"icon": "🚴", "requires_distance": True, "default_unit": "km"},
    "swimming": {"icon": "🏊", "requires_distance": True, "default_unit": "m"},
    "walking": {"icon": "🚶", "requires_distance": True, "default_unit": "km"},
    "hiking": {"icon": "🥾", "requires_distance": True, "default_unit": "km"},
    "yoga": {"icon": "🧘", "requires_distance": False, "default_unit": "min"},
    "gym": {"icon": "🏋️", "requires_distance": False, "default_unit": "min"},
    "tennis": {"icon": "🎾", "requires_distance": False, "default_unit": "min"},
    "basketball": {"icon": "🏀", "requires_distance": False, "default_unit": "min"},
    "other": {"icon": "⚡", "requires_distance": False, "default_unit": "min"}
}
```

---

### 3.3 Achievements Collection

**用途**: 儲存使用者解鎖的成就與徽章

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "user_id": ObjectId("507f1f77bcf86cd799439011"),
  "achievement_type": "streak_7",  // 成就類型
  "achievement_name": "堅持者",  // 成就名稱
  "achievement_description": "連續運動 7 天",
  "celebration_level": "fireworks",  // basic, fireworks, epic
  "workout_id": ObjectId("507f1f77bcf86cd799439012"),  // 觸發成就的運動記錄
  "achieved_at": ISODate("2024-12-31T07:45:00Z"),
  "metadata": {  // 成就相關數據 (動態欄位)
    "streak_days": 7,
    "total_workouts": 7,
    "workout_types": ["running", "cycling"]
  },
  "is_shared": false,  // 是否已分享至社群
  "share_card_url": null  // 分享卡片圖片 URL (生成後填入)
}
```

**成就類型定義**:
```python
ACHIEVEMENT_TYPES = {
    # 首次成就 (Basic)
    "first_workout": {
        "name": "初心者",
        "description": "完成第一次運動",
        "celebration_level": "basic",
        "icon": "🎯"
    },

    # 連續天數 (Fireworks)
    "streak_3": {
        "name": "起步者",
        "description": "連續運動 3 天",
        "celebration_level": "fireworks",
        "icon": "🔥"
    },
    "streak_7": {
        "name": "堅持者",
        "description": "連續運動 7 天",
        "celebration_level": "fireworks",
        "icon": "💪"
    },
    "streak_30": {
        "name": "習慣養成者",
        "description": "連續運動 30 天",
        "celebration_level": "epic",
        "icon": "🏆"
    },

    # 距離里程碑 (Epic)
    "distance_5k": {
        "name": "5K 達成",
        "description": "單次運動達成 5 公里",
        "celebration_level": "basic",
        "icon": "🏃"
    },
    "distance_10k": {
        "name": "10K 達成",
        "description": "單次運動達成 10 公里",
        "celebration_level": "fireworks",
        "icon": "🎖️"
    },
    "distance_half_marathon": {
        "name": "半馬完賽",
        "description": "單次運動達成 21.0975 公里",
        "celebration_level": "epic",
        "icon": "🥇"
    },
    "distance_full_marathon": {
        "name": "全馬完賽",
        "description": "單次運動達成 42.195 公里",
        "celebration_level": "epic",
        "icon": "👑"
    },

    # 總量里程碑 (Fireworks)
    "total_distance_100k": {
        "name": "百公里旅者",
        "description": "累計運動距離達 100 公里",
        "celebration_level": "fireworks",
        "icon": "🌍"
    },

    # 個人紀錄 (Epic)
    "personal_best_pace": {
        "name": "速度之王",
        "description": "打破個人最佳配速紀錄",
        "celebration_level": "epic",
        "icon": "⚡"
    }
}
```

**資料驗證**:
```python
class AchievementCreate(BaseModel):
    user_id: str
    achievement_type: str = Field(..., pattern="^(first_workout|streak_\\d+|distance_.*|total_.*|personal_best_.*)$")
    celebration_level: Literal["basic", "fireworks", "epic"]
    workout_id: str | None = None
    metadata: dict = Field(default_factory=dict)
```

---

### 3.4 Dashboards Collection

**用途**: 儲存使用者客製化儀表板配置

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "user_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "訓練儀表板",
  "is_default": true,  // 是否為預設儀表板
  "order": 0,  // 儀表板排序 (0 = 第一個)
  "widgets": [  // Widget 陣列 (最多 20 個)
    {
      "widget_id": "w1",  // 唯一識別碼 (用於前端拖拉操作)
      "type": "streak_counter",  // Widget 類型
      "title": "連續運動天數",
      "position": {"x": 0, "y": 0},  // Grid 位置
      "size": {"width": 2, "height": 1},  // Grid 大小 (單位: grid units)
      "config": {  // Widget 特定配置
        "show_animation": true,
        "goal_days": 30
      }
    },
    {
      "widget_id": "w2",
      "type": "distance_chart",
      "title": "週距離趨勢",
      "position": {"x": 2, "y": 0},
      "size": {"width": 4, "height": 2},
      "config": {
        "time_range": "7d",  // 7d, 30d, 90d, all
        "chart_type": "line",  // line, bar, area
        "workout_types": ["running", "cycling"]  // 篩選運動類型
      }
    },
    {
      "widget_id": "w3",
      "type": "pace_analysis",
      "title": "配速分析",
      "position": {"x": 0, "y": 1},
      "size": {"width": 3, "height": 2},
      "config": {
        "workout_type": "running",
        "time_range": "30d"
      }
    }
  ],
  "created_at": ISODate("2024-01-01T08:00:00Z"),
  "updated_at": ISODate("2024-12-31T15:30:00Z")
}
```

**Widget 類型定義**:
```python
WIDGET_TYPES = {
    # 基礎數據 Widget (1x1)
    "streak_counter": {
        "category": "basic_stats",
        "default_size": {"width": 2, "height": 1},
        "description": "顯示連續運動天數",
        "config_schema": {
            "show_animation": bool,
            "goal_days": int
        }
    },
    "total_distance": {
        "category": "basic_stats",
        "default_size": {"width": 2, "height": 1},
        "description": "顯示總運動距離",
        "config_schema": {
            "time_range": str  # 7d, 30d, all
        }
    },

    # 圖表 Widget (2x2 或更大)
    "distance_chart": {
        "category": "chart",
        "default_size": {"width": 4, "height": 2},
        "description": "距離趨勢圖表",
        "config_schema": {
            "time_range": str,
            "chart_type": str,
            "workout_types": list
        }
    },
    "pace_analysis": {
        "category": "chart",
        "default_size": {"width": 3, "height": 2},
        "description": "配速分析圖表",
        "config_schema": {
            "workout_type": str,
            "time_range": str
        }
    },
    "heart_rate_zones": {
        "category": "chart",
        "default_size": {"width": 3, "height": 2},
        "description": "心率區間分布",
        "config_schema": {
            "time_range": str
        }
    },

    # 熱力圖 Widget (4x3)
    "workout_heatmap": {
        "category": "heatmap",
        "default_size": {"width": 4, "height": 3},
        "description": "運動天數熱力圖 (類似 GitHub contributions)",
        "config_schema": {
            "year": int
        }
    },

    # 進階數據 Widget (未來擴充)
    "hrv_trend": {
        "category": "advanced",
        "default_size": {"width": 3, "height": 2},
        "description": "心率變異性趨勢 (HRV)",
        "premium_only": True  # 付費功能
    }
}
```

**資料驗證**:
```python
class WidgetConfig(BaseModel):
    widget_id: str = Field(..., pattern="^w\\d+$")
    type: str
    title: str = Field(..., min_length=1, max_length=50)
    position: dict = Field(..., example={"x": 0, "y": 0})
    size: dict = Field(..., example={"width": 2, "height": 1})
    config: dict = Field(default_factory=dict)

class DashboardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    widgets: list[WidgetConfig] = Field(..., max_length=20)  # 硬限制 20 個

    @field_validator('widgets')
    def validate_widget_count(cls, v):
        if len(v) > 12:
            # 警告但不阻擋 (12-20 之間)
            pass
        if len(v) > 20:
            raise ValueError('Maximum 20 widgets per dashboard')
        return v
```

---

### 3.5 Milestones Collection

**用途**: 儲存時間軸上的重要里程碑標記

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "user_id": ObjectId("507f1f77bcf86cd799439011"),
  "milestone_type": "first_10k",  // 里程碑類型
  "milestone_name": "首次 10K",
  "milestone_description": "第一次完成 10 公里跑步",
  "workout_id": ObjectId("507f1f77bcf86cd799439012"),  // 關聯運動記錄
  "achieved_at": ISODate("2024-12-31T07:45:00Z"),
  "metadata": {  // 里程碑相關數據
    "distance_km": 10.5,
    "duration_minutes": 55,
    "pace_min_per_km": 5.24
  },
  "is_featured": true  // 是否在時間軸高亮顯示
}
```

**里程碑類型**:
```python
MILESTONE_TYPES = {
    # 距離里程碑
    "first_5k": "首次 5K",
    "first_10k": "首次 10K",
    "first_half_marathon": "首次半馬",
    "first_full_marathon": "首次全馬",

    # 連續天數里程碑
    "streak_30": "連續 30 天",
    "streak_60": "連續 60 天",
    "streak_100": "連續 100 天",

    # 總量里程碑
    "total_100_workouts": "完成 100 次運動",
    "total_500km": "累計 500 公里",

    # 個人紀錄
    "fastest_5k": "5K 最佳紀錄",
    "fastest_10k": "10K 最佳紀錄",
    "longest_distance": "最長距離紀錄"
}
```

---

### 3.6 Annual Reviews Collection

**用途**: 快取年度回顧統計資料 (避免重複計算)

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "user_id": ObjectId("507f1f77bcf86cd799439011"),
  "year": 2024,
  "generated_at": ISODate("2024-12-31T15:00:00Z"),
  "stats": {  // 年度統計數據
    "total_workouts": 120,
    "total_duration_hours": 90,
    "total_distance_km": 850.5,
    "total_calories": 54000,
    "workout_types_breakdown": {
      "running": 80,
      "cycling": 30,
      "gym": 10
    },
    "monthly_stats": [  // 每月統計
      {"month": 1, "workouts": 10, "distance_km": 70},
      {"month": 2, "workouts": 8, "distance_km": 60},
      // ... 12 個月
    ],
    "longest_streak": 45,
    "current_streak": 7,
    "busiest_month": 8,  // 8 月最活躍
    "favorite_workout_type": "running"
  },
  "milestones": [  // 年度里程碑
    {
      "milestone_type": "first_half_marathon",
      "achieved_at": ISODate("2024-05-12T08:00:00Z"),
      "description": "首次完成半馬 21.0975 公里"
    }
  ],
  "achievements": [  // 年度成就
    {
      "achievement_type": "streak_30",
      "achieved_at": ISODate("2024-03-15T09:00:00Z")
    }
  ],
  "top_workouts": [  // 年度 Top 5 運動
    {
      "workout_id": ObjectId("..."),
      "reason": "最長距離",
      "distance_km": 42.195
    }
  ],
  "web_report_url": "https://motionstory.com/review/2024/user123",  // 網頁版 URL
  "image_urls": [  // 圖片匯出 URLs
    "https://r2.motionstory.com/reviews/2024/user123_page1.png",
    "https://r2.motionstory.com/reviews/2024/user123_page2.png"
  ],
  "cache_expires_at": ISODate("2025-12-31T23:59:59Z")  // 快取到明年底
}
```

**資料驗證**:
```python
class AnnualReviewStats(BaseModel):
    total_workouts: int = Field(..., ge=0)
    total_duration_hours: float = Field(..., ge=0)
    total_distance_km: float = Field(..., ge=0)
    workout_types_breakdown: dict[str, int]
    monthly_stats: list[dict]
    longest_streak: int
    current_streak: int

class AnnualReviewCreate(BaseModel):
    user_id: str
    year: int = Field(..., ge=2024, le=2100)
    stats: AnnualReviewStats
    milestones: list[dict] = []
    achievements: list[dict] = []
```

---

### 3.7 Share Cards Collection

**用途**: 儲存分享卡片元資料與圖片 URL

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439017"),
  "user_id": ObjectId("507f1f77bcf86cd799439011"),
  "card_type": "achievement",  // achievement, workout, annual_review
  "related_id": ObjectId("507f1f77bcf86cd799439013"),  // achievement_id or workout_id
  "image_url": "https://r2.motionstory.com/share-cards/user123/20241231_streak7.png",
  "title": "連續運動 7 天 🔥",
  "description": "堅持就是力量！",
  "metadata": {  // 卡片顯示資料 (不含敏感資訊)
    "achievement_name": "堅持者",
    "stat_value": 7,
    "stat_unit": "天"
  },
  "created_at": ISODate("2024-12-31T07:50:00Z"),
  "view_count": 0,  // 未來功能: 追蹤瀏覽次數
  "expires_at": null  // 可選: 卡片過期時間 (永久有效則為 null)
}
```

**分享卡片類型**:
```python
SHARE_CARD_TYPES = {
    "achievement": {
        "template": "achievement_card.html",
        "size": {"width": 1080, "height": 1920},  // Instagram Story 尺寸
        "format": "png"
    },
    "workout": {
        "template": "workout_summary.html",
        "size": {"width": 1200, "height": 630},  // Social media preview
        "format": "png"
    },
    "annual_review": {
        "template": "annual_review_card.html",
        "size": {"width": 1080, "height": 1920},
        "format": "png"
    }
}
```

---

## 4. 索引設計策略

### 4.1 Users Collection 索引

```javascript
// 唯一索引: Firebase UID (快速查詢使用者)
db.users.createIndex(
  { "firebase_uid": 1 },
  { unique: true, name: "idx_firebase_uid" }
)

// 唯一索引: Email (登入查詢)
db.users.createIndex(
  { "email": 1 },
  { unique: true, name: "idx_email" }
)
```

**索引理由**:
- `firebase_uid`: 每次 API 請求驗證 JWT 時查詢 (高頻)
- `email`: 使用者登入時查詢

---

### 4.2 Workouts Collection 索引

```javascript
// 複合索引: 使用者 + 開始時間 (時間軸查詢)
db.workouts.createIndex(
  { "user_id": 1, "start_time": -1 },
  { name: "idx_user_time" }
)

// 複合索引: 使用者 + 軟刪除狀態 (排除已刪除資料)
db.workouts.createIndex(
  { "user_id": 1, "is_deleted": 1 },
  { name: "idx_user_deleted" }
)

// 索引: 同步狀態 (離線同步查詢)
db.workouts.createIndex(
  { "sync_status": 1 },
  {
    name: "idx_sync_status",
    partialFilterExpression: { "sync_status": "pending" }  // 僅索引 pending 記錄
  }
)

// 索引: 軟刪除過期清理 (Cron job 定期清理)
db.workouts.createIndex(
  { "deleted_at": 1 },
  {
    name: "idx_deleted_at",
    partialFilterExpression: { "is_deleted": true }
  }
)
```

**索引理由**:
- `user_id + start_time`: 時間軸查詢 (最常用)
- `user_id + is_deleted`: 過濾已刪除記錄
- `sync_status`: 離線同步批次查詢
- `deleted_at`: 定期清理 30 天前的軟刪除記錄

**效能估算**:
- 單一 workout 文件: ~800 bytes
- 索引大小: ~200 bytes/document
- 1000 使用者 * 100 workouts = 100,000 documents
- 總空間: 80MB (workouts) + 20MB (indexes) = 100MB < 512MB ✅

---

### 4.3 Achievements Collection 索引

```javascript
// 複合索引: 使用者 + 達成時間
db.achievements.createIndex(
  { "user_id": 1, "achieved_at": -1 },
  { name: "idx_user_achieved" }
)

// 索引: 成就類型 (檢查是否已達成)
db.achievements.createIndex(
  { "user_id": 1, "achievement_type": 1 },
  { unique: true, name: "idx_user_achievement_type" }
)
```

---

### 4.4 Dashboards Collection 索引

```javascript
// 索引: 使用者儀表板查詢
db.dashboards.createIndex(
  { "user_id": 1, "order": 1 },
  { name: "idx_user_order" }
)

// 索引: 預設儀表板快速查詢
db.dashboards.createIndex(
  { "user_id": 1, "is_default": 1 },
  {
    name: "idx_user_default",
    partialFilterExpression: { "is_default": true }
  }
)
```

---

### 4.5 Milestones Collection 索引

```javascript
// 複合索引: 使用者 + 達成時間
db.milestones.createIndex(
  { "user_id": 1, "achieved_at": -1 },
  { name: "idx_user_milestone_time" }
)

// 索引: 高亮里程碑
db.milestones.createIndex(
  { "user_id": 1, "is_featured": 1 },
  {
    name: "idx_user_featured",
    partialFilterExpression: { "is_featured": true }
  }
)
```

---

### 4.6 Annual Reviews Collection 索引

```javascript
// 唯一索引: 使用者 + 年份 (每年僅一份報告)
db.annual_reviews.createIndex(
  { "user_id": 1, "year": 1 },
  { unique: true, name: "idx_user_year" }
)

// 索引: 快取過期清理
db.annual_reviews.createIndex(
  { "cache_expires_at": 1 },
  { name: "idx_cache_expiry" }
)
```

---

### 4.7 Share Cards Collection 索引

```javascript
// 複合索引: 使用者 + 建立時間
db.share_cards.createIndex(
  { "user_id": 1, "created_at": -1 },
  { name: "idx_user_created" }
)

// 索引: 卡片類型 + 關聯 ID (避免重複生成)
db.share_cards.createIndex(
  { "card_type": 1, "related_id": 1 },
  { name: "idx_card_related" }
)
```

---

## 5. 關聯關係設計

### 5.1 設計原則

**Embedded (嵌入式)**:
- ✅ 資料常一起查詢
- ✅ 資料量小 (< 2KB)
- ✅ 更新頻率低
- ✅ 例子: `users.privacy_settings`, `dashboards.widgets`

**Reference (參考式)**:
- ✅ 資料獨立查詢
- ✅ 資料量大 (> 2KB)
- ✅ 頻繁更新
- ✅ 例子: `workouts`, `achievements`

---

### 5.2 關聯圖

```
users (1)
  ├─ has many ─> workouts (N) [Reference]
  ├─ has many ─> achievements (N) [Reference]
  ├─ has many ─> dashboards (N) [Reference]
  ├─ has many ─> milestones (N) [Reference]
  ├─ has one ──> annual_reviews (1 per year) [Reference]
  └─ has many ─> share_cards (N) [Reference]

dashboards (1)
  └─ embeds ──> widgets (N) [Embedded Array]

achievements (1)
  └─ references ─> workouts (1) [Reference via workout_id]

milestones (1)
  └─ references ─> workouts (1) [Reference via workout_id]

share_cards (1)
  └─ references ─> achievements/workouts (1) [Reference via related_id]
```

---

### 5.3 查詢模式範例

**查詢 1: 取得使用者最近 20 筆運動記錄**
```python
# MongoDB Aggregation
workouts = await db.workouts.find(
    {
        "user_id": ObjectId(user_id),
        "is_deleted": False
    },
    {
        "_id": 1,
        "workout_type": 1,
        "start_time": 1,
        "duration_minutes": 1,
        "distance_km": 1,
        "pace_min_per_km": 1
    }
).sort("start_time", -1).limit(20).to_list(20)
```

**查詢 2: 取得使用者完整儀表板 (含 Widget 配置)**
```python
# 單次查詢即可 (Widgets 為嵌入式)
dashboard = await db.dashboards.find_one(
    {"user_id": ObjectId(user_id), "is_default": True}
)
```

**查詢 3: 檢查使用者是否已達成某成就**
```python
# 使用 unique index 快速查詢
achievement = await db.achievements.find_one({
    "user_id": ObjectId(user_id),
    "achievement_type": "streak_7"
})
if not achievement:
    # 尚未達成，可觸發
    pass
```

**查詢 4: 生成年度回顧統計**
```python
# MongoDB Aggregation Pipeline
pipeline = [
    {
        "$match": {
            "user_id": ObjectId(user_id),
            "start_time": {
                "$gte": datetime(2024, 1, 1),
                "$lt": datetime(2025, 1, 1)
            },
            "is_deleted": False
        }
    },
    {
        "$group": {
            "_id": None,
            "total_workouts": {"$sum": 1},
            "total_duration": {"$sum": "$duration_minutes"},
            "total_distance": {"$sum": "$distance_km"},
            "workout_types": {"$push": "$workout_type"}
        }
    }
]
result = await db.workouts.aggregate(pipeline).to_list(1)
```

---

## 6. 資料驗證規則

### 6.1 MongoDB Schema Validation

使用 MongoDB 內建的 JSON Schema Validation:

**Workouts Collection Validation**:
```javascript
db.createCollection("workouts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "workout_type", "start_time", "duration_minutes"],
      properties: {
        user_id: {
          bsonType: "objectId",
          description: "必須為 ObjectId 且必填"
        },
        workout_type: {
          enum: ["running", "cycling", "swimming", "walking", "hiking", "yoga", "gym", "other"],
          description: "必須為預定義的運動類型"
        },
        duration_minutes: {
          bsonType: "int",
          minimum: 1,
          maximum: 600,
          description: "運動時長 1-600 分鐘"
        },
        distance_km: {
          bsonType: "double",
          minimum: 0,
          maximum: 300,
          description: "距離 0-300 公里"
        },
        is_deleted: {
          bsonType: "bool",
          description: "軟刪除標記"
        }
      }
    }
  }
})
```

---

### 6.2 應用層驗證 (Pydantic)

**Workout 驗證邏輯**:
```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class WorkoutCreate(BaseModel):
    workout_type: str
    start_time: datetime
    duration_minutes: int = Field(..., gt=0, le=600)
    distance_km: float | None = Field(None, ge=0, le=300)
    pace_min_per_km: float | None = None
    notes: str | None = Field(None, max_length=500)

    @field_validator('start_time')
    def validate_start_time(cls, v):
        # 不允許未來時間
        if v > datetime.utcnow():
            raise ValueError('Start time cannot be in the future')
        return v

    @field_validator('pace_min_per_km', mode='before')
    def calculate_pace(cls, v, values):
        # 自動計算配速
        if 'distance_km' in values and 'duration_minutes' in values:
            if values['distance_km'] and values['distance_km'] > 0:
                return values['duration_minutes'] / values['distance_km']
        return v
```

---

## 7. 免費方案優化

### 7.1 空間估算

**單一使用者資料量估算**:
```
使用者基本資料: 500 bytes
100 筆運動記錄: 100 * 800 bytes = 80KB
30 個成就: 30 * 400 bytes = 12KB
3 個儀表板: 3 * 2KB = 6KB
20 個里程碑: 20 * 300 bytes = 6KB
1 份年度回顧: 5KB
10 張分享卡片: 10 * 200 bytes = 2KB

單一使用者總計: ~111KB
```

**免費方案容量 (512MB)**:
```
512MB / 111KB = ~4,600 使用者 (理論值)

考慮索引與系統開銷 (30%):
實際可支援: ~3,200 使用者
```

---

### 7.2 定期清理策略

**Cron Job 定期清理**:
```python
# 每日凌晨 3:00 執行清理
@cron("0 3 * * *")
async def cleanup_soft_deleted_workouts():
    """清理 30 天前的軟刪除記錄"""
    cutoff_date = datetime.utcnow() - timedelta(days=30)

    result = await db.workouts.delete_many({
        "is_deleted": True,
        "deleted_at": {"$lt": cutoff_date}
    })

    logger.info(f"Cleaned up {result.deleted_count} soft-deleted workouts")

@cron("0 4 * * 0")  # 每週日凌晨 4:00
async def cleanup_expired_annual_reviews():
    """清理過期的年度回顧快取"""
    result = await db.annual_reviews.delete_many({
        "cache_expires_at": {"$lt": datetime.utcnow()}
    })

    logger.info(f"Cleaned up {result.deleted_count} expired annual reviews")
```

---

### 7.3 索引最佳化

**僅建立必要索引**:
- ❌ 不為低頻查詢欄位建立索引 (如 `weather.temperature`)
- ✅ 使用 Partial Index 減少索引空間 (如僅索引 `is_deleted: true`)
- ✅ 使用 Compound Index 取代多個 Single Field Index

**索引空間估算**:
```
Workouts collection:
  - idx_user_time: ~200 bytes/doc
  - idx_user_deleted: ~100 bytes/doc (partial)
  - idx_sync_status: ~50 bytes/doc (partial, 僅 pending)

總索引空間: ~350 bytes/doc
100,000 documents * 350 bytes = 35MB < 512MB ✅
```

---

### 7.4 分頁與虛擬滾動

**API 分頁查詢**:
```python
@router.get("/api/v1/workouts")
async def list_workouts(
    user_id: str,
    page: int = 1,
    limit: int = 20,  # 預設 20 筆/頁，最大 100 筆
    cursor: str | None = None  # Cursor-based pagination (更高效)
):
    """
    時間軸查詢使用 cursor-based pagination
    避免 skip() 效能問題 (skip 10000 會掃描前 10000 筆)
    """
    query = {"user_id": ObjectId(user_id), "is_deleted": False}

    if cursor:
        # 使用 start_time 作為 cursor
        query["start_time"] = {"$lt": datetime.fromisoformat(cursor)}

    workouts = await db.workouts.find(query) \
        .sort("start_time", -1) \
        .limit(limit) \
        .to_list(limit)

    next_cursor = workouts[-1]["start_time"].isoformat() if workouts else None

    return {
        "data": workouts,
        "next_cursor": next_cursor,
        "has_more": len(workouts) == limit
    }
```

---

## 8. 同步機制設計

### 8.1 離線優先架構

**SQLite 本地資料庫 (Mobile App)**:
```sql
-- 本地 workouts 表
CREATE TABLE workouts (
  id TEXT PRIMARY KEY,  -- UUID (本地生成)
  server_id TEXT,  -- MongoDB ObjectId (同步後填入)
  user_id TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  distance_km REAL,
  notes TEXT,
  sync_status TEXT DEFAULT 'pending',  -- pending, synced, conflict
  sync_attempt_count INTEGER DEFAULT 0,
  last_sync_attempt_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0
);

CREATE INDEX idx_sync_pending ON workouts(sync_status)
  WHERE sync_status = 'pending';

CREATE INDEX idx_user_time ON workouts(user_id, start_time DESC);
```

---

### 8.2 同步流程

**Step 1: 本地寫入 (Optimistic UI)**
```typescript
// Mobile App: 使用者記錄運動
async function createWorkout(workoutData: WorkoutInput) {
  // 1. 立即寫入 SQLite
  const localWorkout = {
    id: uuidv4(),  // 本地生成 UUID
    ...workoutData,
    sync_status: 'pending',
    created_at: new Date().toISOString()
  };

  await db.workouts.insert(localWorkout);

  // 2. 立即更新 UI (無需等待網路)
  dispatch({ type: 'ADD_WORKOUT', payload: localWorkout });

  // 3. 觸發背景同步
  await syncManager.triggerSync();

  return localWorkout;
}
```

**Step 2: 背景同步**
```typescript
class SyncManager {
  async syncPendingWorkouts() {
    // 查詢待同步記錄
    const pendingWorkouts = await db.workouts
      .where('sync_status', 'pending')
      .toArray();

    for (const workout of pendingWorkouts) {
      try {
        // 上傳至 API
        const response = await api.post('/api/v1/workouts', {
          ...workout,
          client_id: workout.id  // 傳遞本地 ID
        });

        // 更新本地記錄
        await db.workouts.update(workout.id, {
          server_id: response.data._id,  // 儲存 MongoDB ObjectId
          sync_status: 'synced',
          sync_attempt_count: 0
        });

      } catch (error) {
        if (error.status === 409) {
          // 衝突解決: Last Write Wins
          await this.resolveConflict(workout, error.data);
        } else {
          // 重試機制
          await this.handleSyncError(workout, error);
        }
      }
    }
  }

  async handleSyncError(workout: Workout, error: Error) {
    const attemptCount = workout.sync_attempt_count + 1;
    const maxAttempts = 5;

    if (attemptCount >= maxAttempts) {
      // 標記為衝突，需使用者介入
      await db.workouts.update(workout.id, {
        sync_status: 'conflict',
        sync_attempt_count: attemptCount,
        last_sync_attempt_at: new Date().toISOString()
      });
    } else {
      // Exponential backoff 重試
      const backoffDelay = Math.pow(2, attemptCount) * 1000;  // 2s, 4s, 8s, 16s

      await db.workouts.update(workout.id, {
        sync_attempt_count: attemptCount,
        last_sync_attempt_at: new Date().toISOString()
      });

      setTimeout(() => this.syncPendingWorkouts(), backoffDelay);
    }
  }
}
```

**Step 3: API 冪等性設計**
```python
@router.post("/api/v1/workouts", status_code=201)
async def create_workout(
    workout: WorkoutCreate,
    client_id: str | None = None,  # 本地 UUID (用於冪等性)
    current_user: User = Depends(get_current_user)
):
    """
    建立運動記錄 (支援冪等性)

    若提供 client_id:
      - 檢查是否已存在相同 client_id 的記錄
      - 若存在則返回該記錄 (避免重複建立)
    """
    if client_id:
        # 檢查是否已同步過
        existing = await db.workouts.find_one({
            "user_id": current_user.id,
            "client_id": client_id
        })
        if existing:
            return existing  # 冪等: 返回已存在的記錄

    # 建立新記錄
    workout_doc = {
        "user_id": current_user.id,
        "client_id": client_id,
        **workout.model_dump(),
        "created_at": datetime.utcnow()
    }

    result = await db.workouts.insert_one(workout_doc)
    workout_doc["_id"] = result.inserted_id

    # 非同步檢查成就觸發
    asyncio.create_task(check_achievements(current_user.id, result.inserted_id))

    return workout_doc
```

---

### 8.3 衝突解決策略

**策略: Last Write Wins (LWW)**
```python
async def resolve_conflict(local_workout: Workout, server_workout: dict):
    """
    衝突解決: 比較 updated_at 時間戳
    - 若 local 較新 → 覆寫 server
    - 若 server 較新 → 更新 local
    """
    local_updated_at = datetime.fromisoformat(local_workout.updated_at)
    server_updated_at = datetime.fromisoformat(server_workout["updated_at"])

    if local_updated_at > server_updated_at:
        # Local 較新，強制更新 server
        await api.put(f'/api/v1/workouts/{server_workout["_id"]}', {
            ...local_workout,
            force_update: True
        })

        await db.workouts.update(local_workout.id, {
            sync_status: 'synced'
        })
    else:
        # Server 較新，更新 local
        await db.workouts.update(local_workout.id, {
            ...server_workout,
            sync_status: 'synced'
        })
    }
}
```

---

## 結論

本資料模型設計完整定義了 MotionStory 的 8 個核心 Collections，包含:

✅ **完整 Schema**: 所有欄位定義、資料型別、嵌入式結構
✅ **高效索引**: 針對查詢模式優化的索引策略
✅ **關聯設計**: Hybrid 混合嵌入式與參考式設計
✅ **資料驗證**: MongoDB + Pydantic 雙層驗證
✅ **免費方案優化**: 空間估算、定期清理、分頁策略
✅ **離線同步**: Optimistic UI + 衝突解決機制

**下一步**:
1. 實作 MongoDB collections 與 indexes
2. 實作 Pydantic models 與驗證
3. 實作 API endpoints (CRUD operations)
4. 實作離線同步機制 (SQLite + SyncManager)

---

**版本歷史**:
- v1.0 (2025-10-07): 初版完成，包含 8 個 Collections 完整設計
