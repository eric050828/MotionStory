# MotionStory 快速開始測試指南

**文件版本**: 1.0.0
**建立日期**: 2025-10-07
**適用環境**: Development & Production
**測試涵蓋範圍**: 完整功能驗證、效能驗證、離線模式測試

---

## 目錄

1. [環境準備](#環境準備)
2. [快速開始場景](#快速開始場景)
3. [E2E 測試流程](#e2e-測試流程)
4. [API 測試範例](#api-測試範例)
5. [效能驗證](#效能驗證)
6. [離線模式測試](#離線模式測試)
7. [故障排除](#故障排除)

---

## 環境準備

### 前置要求

- **Node.js**: >= 18.0.0
- **curl** 或 **httpx**: 用於 API 測試
- **瀏覽器**: Chrome/Safari 最新版（支援 60 FPS 動畫）
- **網路連線**: 測試同步功能需要網路

### 環境變數設定

```bash
# Development 環境
export API_BASE_URL="http://localhost:8000/api/v1"
export WEB_BASE_URL="http://localhost:3000"

# Production 環境
export API_BASE_URL="https://api.motionstory.com/api/v1"
export WEB_BASE_URL="https://motionstory.com"
```

### 測試資料準備

```bash
# 下載測試 CSV 檔案（模擬歷史資料匯入）
curl -o test_workouts.csv https://raw.githubusercontent.com/motionstory/test-data/main/sample_workouts.csv

# 或手動建立 test_workouts.csv
cat > test_workouts.csv <<EOF
date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-01,running,30,5.0,6.0,140,300,新年第一跑
2025-01-02,cycling,45,15.0,,125,450,晨間騎車
2025-01-03,running,35,6.0,5.83,145,350,配速進步
EOF
```

---

## 快速開始場景

根據規格文件的三個核心使用者故事，設計完整測試場景。

### 場景 1: 小美的 7 天運動旅程（新手使用者）

**目標**: 驗證新手使用者從註冊到建立運動習慣的完整體驗

#### Day 1: 首次運動與慶祝動畫

**Given**: 小美是新註冊的使用者
**When**: 完成第一次慢跑 20 分鐘
**Then**:
- ✅ 立即看到慶祝動畫（< 2 秒）
- ✅ 解鎖「初心者」徽章（achievement_type: `first_workout`）
- ✅ 慶祝等級為 `basic`

**測試步驟**:

```bash
# 1. 註冊新帳號
curl -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "xiaomei@example.com",
    "password": "SecurePass123",
    "display_name": "小美"
  }'

# 回應範例（儲存 access_token）
# {
#   "user": {"id": "507f191e810c19729de860ea", ...},
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer",
#   "expires_in": 604800
# }

# 2. 記錄第一次運動
export TOKEN="<access_token>"
curl -X POST "$API_BASE_URL/workouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "running",
    "start_time": "2025-01-15T08:30:00Z",
    "duration_minutes": 20,
    "distance_km": 3.0,
    "pace_min_per_km": 6.67,
    "avg_heart_rate": 140,
    "calories": 200,
    "notes": "第一次慢跑"
  }'

# 3. 驗證成就觸發
# 回應應包含 achievements_triggered 陣列
# {
#   "workout": {...},
#   "achievements_triggered": [
#     {
#       "id": "507f1f77bcf86cd799439012",
#       "achievement_type": "first_workout",
#       "celebration_level": "basic"
#     }
#   ]
# }

# 4. 前端驗證：開啟 Web App，確認慶祝動畫播放
# - 動畫流暢度：60 FPS
# - 觸發時間：< 2 秒
# - 顯示「初心者」徽章
```

#### Day 3: 連續運動成就

**Given**: 小美已連續運動 3 天
**When**: 完成第 3 天的運動記錄
**Then**:
- ✅ 觸發煙火動畫（celebration_level: `fireworks`）
- ✅ 解鎖「堅持者」徽章（achievement_type: `streak_3`）

**測試步驟**:

```bash
# Day 2 運動
curl -X POST "$API_BASE_URL/workouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "walking",
    "start_time": "2025-01-16T19:00:00Z",
    "duration_minutes": 40,
    "distance_km": 3.5,
    "notes": "晚間散步"
  }'

# Day 3 運動（應觸發連續 3 天成就）
curl -X POST "$API_BASE_URL/workouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "running",
    "start_time": "2025-01-17T08:30:00Z",
    "duration_minutes": 25,
    "distance_km": 4.0,
    "notes": "狀態越來越好"
  }'

# 驗證回應
# "achievements_triggered": [
#   {
#     "achievement_type": "streak_3",
#     "celebration_level": "fireworks"
#   }
# ]
```

#### Day 7: 一週挑戰與分享

**Given**: 小美完成 7 天連續運動
**When**: 完成第 7 天運動並生成分享卡片
**Then**:
- ✅ 解鎖「七日達人」徽章（achievement_type: `streak_7`）
- ✅ 慶祝等級 `fireworks`
- ✅ 生成精美分享卡片（可匯出圖片）

**測試步驟**:

```bash
# Day 4-6 運動記錄（省略詳細步驟，依此類推）
# ...

# Day 7 運動（觸發 7 天連續成就）
curl -X POST "$API_BASE_URL/workouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "running",
    "start_time": "2025-01-21T08:30:00Z",
    "duration_minutes": 30,
    "distance_km": 5.0,
    "notes": "完成一週挑戰！"
  }'

# 取得成就 ID
export ACHIEVEMENT_ID="<從 achievements_triggered 取得>"

# 生成分享卡片
curl -X POST "$API_BASE_URL/share-cards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "achievement_id": "'$ACHIEVEMENT_ID'",
    "template": "celebration",
    "include_stats": true
  }'

# 回應包含圖片 URL
# {
#   "card": {
#     "id": "507f1f77bcf86cd799439013",
#     "image_url": "https://r2.motionstory.com/share-cards/507f191e810c19729de860ea/1736929800.png",
#     "template": "celebration",
#     "created_at": "2025-01-21T08:35:00Z"
#   }
# }

# 驗證圖片可存取
curl -I "<image_url>"
# 應回傳 200 OK
```

---

### 場景 2: 大衛的客製化儀表板（進階使用者）

**目標**: 驗證儀表板工作室的拖拉 Widget 功能與多裝置同步

#### 建立多個儀表板

**Given**: 大衛是馬拉松訓練者
**When**: 建立「訓練儀表板」與「恢復儀表板」
**Then**:
- ✅ 成功建立兩個獨立儀表板
- ✅ 可自由切換不同儀表板

**測試步驟**:

```bash
# 1. 建立訓練儀表板
curl -X POST "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "訓練儀表板"
  }'

export TRAINING_DASHBOARD_ID="<回傳的 id>"

# 2. 建立恢復儀表板
curl -X POST "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "恢復儀表板"
  }'

export RECOVERY_DASHBOARD_ID="<回傳的 id>"

# 3. 取得所有儀表板
curl -X GET "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN"

# 驗證回應
# {
#   "dashboards": [
#     {"id": "<training_id>", "name": "訓練儀表板", ...},
#     {"id": "<recovery_id>", "name": "恢復儀表板", ...}
#   ],
#   "total_count": 2
# }
```

#### 拖拉 Widget 配置

**Given**: 訓練儀表板已建立
**When**: 新增配速圖表、週里程、HRV 趨勢 Widget
**Then**:
- ✅ Widget 即時顯示數據
- ✅ 可調整大小與位置
- ✅ 配置變更立即儲存

**測試步驟**:

```bash
# 1. 新增配速圖表 Widget
curl -X POST "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID/widgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pace_analysis",
    "position": {"x": 0, "y": 0},
    "size": {"width": 12, "height": 6},
    "config": {
      "time_range": "30d",
      "metric": "pace",
      "workout_type": "running",
      "chart_type": "line"
    }
  }'

# 2. 新增週里程 Widget
curl -X POST "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID/widgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "total_distance",
    "position": {"x": 0, "y": 6},
    "size": {"width": 6, "height": 4},
    "config": {
      "time_range": "7d",
      "workout_type": "running"
    }
  }'

# 3. 新增 HRV 趨勢 Widget
curl -X POST "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID/widgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hrv_trend",
    "position": {"x": 6, "y": 6},
    "size": {"width": 6, "height": 4},
    "config": {
      "time_range": "30d"
    }
  }'

# 4. 更新 Widget 位置（模擬拖拉）
export WIDGET_ID="<第一個 Widget 的 id>"
curl -X PUT "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID/widgets/$WIDGET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"x": 0, "y": 2},
    "size": {"width": 8, "height": 5}
  }'

# 5. 驗證配置已儲存
curl -X GET "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID" \
  -H "Authorization: Bearer $TOKEN"

# 確認 widgets 陣列包含 3 個 Widget 且位置正確
```

#### Widget 數量限制測試

**Given**: 儀表板已有 11 個 Widget
**When**: 嘗試新增第 12 個與第 21 個 Widget
**Then**:
- ✅ 第 12 個成功新增，顯示效能提示
- ✅ 第 21 個被阻止，回傳錯誤訊息

**測試步驟**:

```bash
# 新增第 12 個 Widget（應成功但有警告）
for i in {4..12}; do
  curl -X POST "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID/widgets" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "trend_chart",
      "position": {"x": 0, "y": '$i'},
      "size": {"width": 6, "height": 4},
      "config": {"time_range": "30d", "metric": "distance"}
    }'
done

# 嘗試新增第 21 個 Widget（應失敗）
curl -X POST "$API_BASE_URL/dashboards/$TRAINING_DASHBOARD_ID/widgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "heatmap",
    "position": {"x": 6, "y": 20},
    "size": {"width": 6, "height": 4}
  }'

# 驗證錯誤回應
# {
#   "error": "BAD_REQUEST",
#   "message": "Widget limit exceeded (max: 20)",
#   "details": {
#     "current_widgets": 20,
#     "suggestion": "建議建立多個儀表板以優化效能"
#   }
# }
```

---

### 場景 3: 艾莉的年度回顧（長期使用者）

**目標**: 驗證年度回顧生成、視覺化呈現、圖片匯出功能

#### 生成年度回顧

**Given**: 艾莉在 2024 年使用 MotionStory 記錄了 248 天運動
**When**: 12 月 31 日開啟年度回顧功能
**Then**:
- ✅ 互動式網頁版 < 3 秒生成
- ✅ 顯示運動天數、總時長、關鍵里程碑
- ✅ 視覺化呈現成長歷程

**測試步驟**:

```bash
# 1. 生成 2024 年度回顧
time curl -X POST "$API_BASE_URL/annual-review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "include_video": false
  }'

# 驗證生成時間 < 3000ms
# {
#   "review": {
#     "id": "507f1f77bcf86cd799439016",
#     "year": 2024,
#     "usage_months": 12,
#     "stats": {
#       "total_workout_days": 248,
#       "total_duration_minutes": 12400,
#       "total_distance_km": 2145.8,
#       "max_streak_days": 45,
#       "favorite_workout_type": "running"
#     },
#     "milestones": [...],
#     "trends": {...},
#     "web_url": "https://motionstory.com/annual-review/507f1f77bcf86cd799439016"
#   },
#   "generation_time_ms": 2450
# }

export REVIEW_ID="<回傳的 id>"

# 2. 開啟互動式網頁版
open "$WEB_BASE_URL/annual-review/$REVIEW_ID"

# 前端驗證：
# - 頁面載入流暢
# - 動畫效果 60 FPS
# - 顯示完整統計資料與里程碑
# - 逐月趨勢圖表正確渲染
```

#### 匯出年度回顧圖片

**Given**: 年度回顧已生成
**When**: 選擇匯出為圖片格式
**Then**:
- ✅ 圖片匯出 < 5 秒
- ✅ 生成多張高品質圖片（封面、統計、里程碑）
- ✅ 圖片可下載與分享

**測試步驟**:

```bash
# 匯出為圖片格式
time curl -X GET "$API_BASE_URL/annual-review/$REVIEW_ID/export?format=images" \
  -H "Authorization: Bearer $TOKEN"

# 驗證生成時間 < 5000ms
# {
#   "images": [
#     "https://r2.motionstory.com/annual-review/2024/cover.png",
#     "https://r2.motionstory.com/annual-review/2024/stats.png",
#     "https://r2.motionstory.com/annual-review/2024/milestones.png"
#   ],
#   "generation_time_ms": 4200
# }

# 驗證圖片可存取
for url in $(echo '<images 陣列中的 URL>'); do
  curl -I "$url" | grep "200 OK"
done

# 匯出為 PDF 格式
curl -X GET "$API_BASE_URL/annual-review/$REVIEW_ID/export?format=pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -o annual_review_2024.pdf

# 驗證 PDF 檔案可開啟
open annual_review_2024.pdf
```

---

## E2E 測試流程

完整的端對端測試流程，涵蓋使用者旅程的所有關鍵步驟。

### 測試流程圖

```
註冊/登入 → 記錄運動 → 慶祝動畫 → 成就解鎖
                ↓
        建立儀表板 → 拖拉 Widget → 配置儲存
                ↓
     查看時間軸 → 里程碑標記 → 運動詳情
                ↓
        生成年度回顧 → 圖片匯出 → 社群分享
```

### 完整 E2E 測試腳本

```bash
#!/bin/bash
# e2e_test.sh - MotionStory E2E 測試腳本

set -e  # 遇到錯誤立即退出

API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api/v1}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:3000}"
TEST_EMAIL="e2e_test_$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123"

echo "🚀 MotionStory E2E 測試開始"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ========================================
# 步驟 1: 註冊與登入
# ========================================
echo ""
echo "📝 步驟 1: 註冊新帳號"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "display_name": "E2E Test User"
  }')

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" = "null" ]; then
  echo "❌ 註冊失敗"
  exit 1
fi

echo "✅ 註冊成功，使用者 ID: $USER_ID"

# ========================================
# 步驟 2: 記錄第一次運動
# ========================================
echo ""
echo "🏃 步驟 2: 記錄第一次運動"
WORKOUT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/workouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "running",
    "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "duration_minutes": 30,
    "distance_km": 5.0,
    "pace_min_per_km": 6.0,
    "avg_heart_rate": 145,
    "calories": 300,
    "notes": "E2E 測試第一次運動"
  }')

WORKOUT_ID=$(echo "$WORKOUT_RESPONSE" | jq -r '.workout.id')
ACHIEVEMENTS=$(echo "$WORKOUT_RESPONSE" | jq -r '.achievements_triggered')

echo "✅ 運動記錄成功，ID: $WORKOUT_ID"
echo "🎉 觸發成就: $ACHIEVEMENTS"

# 驗證 first_workout 成就
FIRST_ACHIEVEMENT=$(echo "$ACHIEVEMENTS" | jq -r '.[0].achievement_type')
if [ "$FIRST_ACHIEVEMENT" != "first_workout" ]; then
  echo "❌ 未觸發 first_workout 成就"
  exit 1
fi

echo "✅ 成就驗證通過"

# ========================================
# 步驟 3: 建立客製化儀表板
# ========================================
echo ""
echo "📊 步驟 3: 建立客製化儀表板"
DASHBOARD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "E2E 測試儀表板"}')

DASHBOARD_ID=$(echo "$DASHBOARD_RESPONSE" | jq -r '.id')
echo "✅ 儀表板建立成功，ID: $DASHBOARD_ID"

# 新增 Widget
echo ""
echo "🧩 步驟 4: 新增 Widget"
WIDGET_RESPONSE=$(curl -s -X POST "$API_BASE_URL/dashboards/$DASHBOARD_ID/widgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "streak_counter",
    "position": {"x": 0, "y": 0},
    "size": {"width": 6, "height": 4},
    "config": {"time_range": "30d"}
  }')

WIDGET_COUNT=$(echo "$WIDGET_RESPONSE" | jq '.widgets | length')
echo "✅ Widget 新增成功，目前 Widget 數量: $WIDGET_COUNT"

# ========================================
# 步驟 4: 查看時間軸
# ========================================
echo ""
echo "🕐 步驟 5: 查看運動時間軸"
TIMELINE_RESPONSE=$(curl -s -X GET "$API_BASE_URL/timeline?limit=10&include_milestones=true" \
  -H "Authorization: Bearer $TOKEN")

TIMELINE_COUNT=$(echo "$TIMELINE_RESPONSE" | jq '.entries | length')
echo "✅ 時間軸載入成功，項目數: $TIMELINE_COUNT"

# ========================================
# 步驟 5: 生成年度回顧
# ========================================
echo ""
echo "📅 步驟 6: 生成年度回顧"
START_TIME=$(date +%s%3N)
REVIEW_RESPONSE=$(curl -s -X POST "$API_BASE_URL/annual-review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2025, "include_video": false}')
END_TIME=$(date +%s%3N)

GENERATION_TIME=$((END_TIME - START_TIME))
REVIEW_ID=$(echo "$REVIEW_RESPONSE" | jq -r '.review.id')

echo "✅ 年度回顧生成成功，ID: $REVIEW_ID"
echo "⏱️  生成時間: ${GENERATION_TIME}ms"

# 驗證效能要求 < 3000ms
if [ "$GENERATION_TIME" -gt 3000 ]; then
  echo "⚠️  警告：生成時間超過 3 秒（${GENERATION_TIME}ms）"
else
  echo "✅ 效能驗證通過（< 3 秒）"
fi

# ========================================
# 步驟 6: 匯出圖片
# ========================================
echo ""
echo "🖼️  步驟 7: 匯出年度回顧圖片"
START_TIME=$(date +%s%3N)
EXPORT_RESPONSE=$(curl -s -X GET "$API_BASE_URL/annual-review/$REVIEW_ID/export?format=images" \
  -H "Authorization: Bearer $TOKEN")
END_TIME=$(date +%s%3N)

EXPORT_TIME=$((END_TIME - START_TIME))
IMAGE_COUNT=$(echo "$EXPORT_RESPONSE" | jq '.images | length')

echo "✅ 圖片匯出成功，圖片數量: $IMAGE_COUNT"
echo "⏱️  匯出時間: ${EXPORT_TIME}ms"

# 驗證效能要求 < 5000ms
if [ "$EXPORT_TIME" -gt 5000 ]; then
  echo "⚠️  警告：匯出時間超過 5 秒（${EXPORT_TIME}ms）"
else
  echo "✅ 效能驗證通過（< 5 秒）"
fi

# ========================================
# 測試總結
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ E2E 測試完成"
echo ""
echo "📊 測試摘要:"
echo "  - 使用者 ID: $USER_ID"
echo "  - 運動記錄: $WORKOUT_ID"
echo "  - 儀表板: $DASHBOARD_ID"
echo "  - 年度回顧: $REVIEW_ID"
echo "  - 年度回顧生成時間: ${GENERATION_TIME}ms"
echo "  - 圖片匯出時間: ${EXPORT_TIME}ms"
echo ""
echo "🎉 所有測試通過！"
```

**執行測試**:

```bash
chmod +x e2e_test.sh
./e2e_test.sh
```

---

## API 測試範例

### 使用 curl

#### 認證相關

```bash
# 註冊
curl -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "display_name": "測試使用者"
  }'

# 登入
curl -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Google OAuth 登入
curl -X POST "$API_BASE_URL/auth/google" \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_id_token": "<Firebase ID Token>"
  }'

# 取得目前使用者資訊
curl -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# 更新隱私設定
curl -X PUT "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "privacy_settings": {
      "share_location": false,
      "share_detailed_stats": true
    }
  }'
```

#### 運動記錄相關

```bash
# 建立運動記錄
curl -X POST "$API_BASE_URL/workouts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "running",
    "start_time": "2025-01-15T08:30:00Z",
    "duration_minutes": 30,
    "distance_km": 5.2,
    "pace_min_per_km": 5.77,
    "avg_heart_rate": 145,
    "calories": 320,
    "notes": "晨跑"
  }'

# 取得運動記錄列表（分頁）
curl -X GET "$API_BASE_URL/workouts?limit=20&workout_type=running&sort=start_time_desc" \
  -H "Authorization: Bearer $TOKEN"

# 取得單筆運動記錄
curl -X GET "$API_BASE_URL/workouts/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer $TOKEN"

# 更新運動記錄
curl -X PUT "$API_BASE_URL/workouts/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "更新備註：配速進步了"
  }'

# 刪除運動記錄（軟刪除）
curl -X DELETE "$API_BASE_URL/workouts/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer $TOKEN"

# 取得運動統計摘要
curl -X GET "$API_BASE_URL/workouts/stats?time_range=30d&workout_type=running" \
  -H "Authorization: Bearer $TOKEN"

# 批次建立運動記錄（離線同步）
curl -X POST "$API_BASE_URL/workouts/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workouts": [
      {
        "workout_type": "running",
        "start_time": "2025-01-15T08:30:00Z",
        "duration_minutes": 30,
        "distance_km": 5.0
      },
      {
        "workout_type": "cycling",
        "start_time": "2025-01-16T19:00:00Z",
        "duration_minutes": 45,
        "distance_km": 15.0
      }
    ]
  }'
```

#### 匯入/匯出相關

```bash
# 匯出運動資料為 CSV
curl -X GET "$API_BASE_URL/workouts/export?format=csv&start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o workouts_export.csv

# 匯入 CSV 資料
curl -X POST "$API_BASE_URL/workouts/import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_workouts.csv"
```

#### 成就相關

```bash
# 取得成就列表
curl -X GET "$API_BASE_URL/achievements?limit=20&achievement_type=streak" \
  -H "Authorization: Bearer $TOKEN"

# 取得成就統計
curl -X GET "$API_BASE_URL/achievements/stats" \
  -H "Authorization: Bearer $TOKEN"

# 取得所有成就類型定義
curl -X GET "$API_BASE_URL/achievements/types" \
  -H "Authorization: Bearer $TOKEN"

# 手動檢查成就觸發
curl -X POST "$API_BASE_URL/achievements/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_id": "507f1f77bcf86cd799439011"
  }'
```

#### 儀表板相關

```bash
# 取得所有儀表板
curl -X GET "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN"

# 建立儀表板
curl -X POST "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "訓練儀表板"}'

# 取得單一儀表板
curl -X GET "$API_BASE_URL/dashboards/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer $TOKEN"

# 更新儀表板
curl -X PUT "$API_BASE_URL/dashboards/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "進階訓練儀表板"}'

# 新增 Widget
curl -X POST "$API_BASE_URL/dashboards/507f1f77bcf86cd799439014/widgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "trend_chart",
    "position": {"x": 0, "y": 0},
    "size": {"width": 12, "height": 6},
    "config": {
      "time_range": "30d",
      "metric": "distance",
      "chart_type": "line"
    }
  }'

# 更新 Widget
curl -X PUT "$API_BASE_URL/dashboards/507f1f77bcf86cd799439014/widgets/widget-001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"x": 0, "y": 2},
    "size": {"width": 8, "height": 5}
  }'

# 取得 Widget 類型定義
curl -X GET "$API_BASE_URL/widgets/types" \
  -H "Authorization: Bearer $TOKEN"

# 取得 Widget 資料
curl -X GET "$API_BASE_URL/widgets/widget-001/data?time_range=30d" \
  -H "Authorization: Bearer $TOKEN"
```

#### 時間軸與年度回顧

```bash
# 取得運動時間軸
curl -X GET "$API_BASE_URL/timeline?limit=20&include_milestones=true&workout_type=running" \
  -H "Authorization: Bearer $TOKEN"

# 取得里程碑列表
curl -X GET "$API_BASE_URL/timeline/milestones?limit=20" \
  -H "Authorization: Bearer $TOKEN"

# 生成年度回顧
curl -X POST "$API_BASE_URL/annual-review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "include_video": false}'

# 取得年度回顧
curl -X GET "$API_BASE_URL/annual-review/507f1f77bcf86cd799439016" \
  -H "Authorization: Bearer $TOKEN"

# 匯出年度回顧（圖片）
curl -X GET "$API_BASE_URL/annual-review/507f1f77bcf86cd799439016/export?format=images" \
  -H "Authorization: Bearer $TOKEN"

# 匯出年度回顧（PDF）
curl -X GET "$API_BASE_URL/annual-review/507f1f77bcf86cd799439016/export?format=pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -o annual_review.pdf

# 取得歷年回顧列表
curl -X GET "$API_BASE_URL/annual-review/list" \
  -H "Authorization: Bearer $TOKEN"
```

### 使用 httpx (Python)

```python
import httpx
import time

API_BASE_URL = "http://localhost:8000/api/v1"

# 註冊並取得 token
def register_and_login():
    response = httpx.post(
        f"{API_BASE_URL}/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123",
            "display_name": "測試使用者"
        }
    )
    return response.json()["access_token"]

# 記錄運動
def create_workout(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.post(
        f"{API_BASE_URL}/workouts",
        headers=headers,
        json={
            "workout_type": "running",
            "start_time": "2025-01-15T08:30:00Z",
            "duration_minutes": 30,
            "distance_km": 5.0,
            "pace_min_per_km": 6.0,
            "avg_heart_rate": 145,
            "calories": 300
        }
    )
    return response.json()

# 生成年度回顧並測量時間
def generate_annual_review(token, year=2024):
    headers = {"Authorization": f"Bearer {token}"}
    start_time = time.time()

    response = httpx.post(
        f"{API_BASE_URL}/annual-review",
        headers=headers,
        json={"year": year, "include_video": False},
        timeout=10.0
    )

    elapsed_time = (time.time() - start_time) * 1000  # 轉換為毫秒
    data = response.json()

    print(f"年度回顧生成時間: {elapsed_time:.2f}ms")
    print(f"API 回報生成時間: {data['generation_time_ms']}ms")

    # 驗證效能要求
    assert data['generation_time_ms'] < 3000, "年度回顧生成時間超過 3 秒"

    return data["review"]

# 執行測試
if __name__ == "__main__":
    token = register_and_login()
    workout = create_workout(token)
    print(f"運動記錄建立成功: {workout['workout']['id']}")

    review = generate_annual_review(token)
    print(f"年度回顧建立成功: {review['id']}")
```

---

## 效能驗證

### API 回應時間測試

根據規格要求（FR-032），運動記錄提交後系統回應時間必須 < 200ms。

**測試腳本**:

```bash
#!/bin/bash
# performance_test.sh - API 效能測試

API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api/v1}"
TOKEN="<your_access_token>"
ITERATIONS=10

echo "🔬 API 效能測試（$ITERATIONS 次迭代）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_TIME=0
MAX_TIME=0
MIN_TIME=999999

for i in $(seq 1 $ITERATIONS); do
  START=$(date +%s%3N)

  curl -s -X POST "$API_BASE_URL/workouts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "workout_type": "running",
      "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "duration_minutes": 30,
      "distance_km": 5.0
    }' > /dev/null

  END=$(date +%s%3N)
  ELAPSED=$((END - START))

  TOTAL_TIME=$((TOTAL_TIME + ELAPSED))

  if [ $ELAPSED -gt $MAX_TIME ]; then
    MAX_TIME=$ELAPSED
  fi

  if [ $ELAPSED -lt $MIN_TIME ]; then
    MIN_TIME=$ELAPSED
  fi

  echo "第 $i 次: ${ELAPSED}ms"
done

AVG_TIME=$((TOTAL_TIME / ITERATIONS))

echo ""
echo "📊 測試結果:"
echo "  - 平均回應時間: ${AVG_TIME}ms"
echo "  - 最快回應: ${MIN_TIME}ms"
echo "  - 最慢回應: ${MAX_TIME}ms"
echo ""

if [ $AVG_TIME -lt 200 ]; then
  echo "✅ 效能驗證通過（< 200ms）"
else
  echo "❌ 效能驗證失敗（平均 ${AVG_TIME}ms > 200ms）"
  exit 1
fi
```

### 前端動畫效能測試

**測試場景**: 驗證慶祝動畫流暢度（FR-031: 60 FPS）

**手動測試步驟**:

1. 開啟瀏覽器開發者工具 → Performance 分頁
2. 開始錄製
3. 記錄一次運動，觸發慶祝動畫
4. 停止錄製
5. 檢查 FPS 指標

**驗收標準**:
- ✅ FPS 穩定維持在 58-60 FPS
- ✅ 無明顯掉幀或卡頓
- ✅ 動畫播放流暢

**自動化測試（Playwright）**:

```javascript
// tests/celebration_animation_performance.spec.ts
import { test, expect } from '@playwright/test';

test('慶祝動畫應以 60 FPS 播放', async ({ page }) => {
  // 登入並記錄運動
  await page.goto('http://localhost:3000');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');

  // 開始效能追蹤
  await page.evaluate(() => {
    (window as any).frames = [];
    (window as any).lastFrame = performance.now();

    const trackFPS = () => {
      const now = performance.now();
      const delta = now - (window as any).lastFrame;
      const fps = 1000 / delta;
      (window as any).frames.push(fps);
      (window as any).lastFrame = now;

      if ((window as any).tracking) {
        requestAnimationFrame(trackFPS);
      }
    };

    (window as any).tracking = true;
    requestAnimationFrame(trackFPS);
  });

  // 記錄運動觸發慶祝動畫
  await page.click('[data-testid="add-workout-button"]');
  await page.fill('[name="workout_type"]', 'running');
  await page.fill('[name="duration_minutes"]', '30');
  await page.click('[data-testid="submit-workout"]');

  // 等待慶祝動畫播放完成（假設 3 秒）
  await page.waitForTimeout(3000);

  // 停止追蹤
  const avgFPS = await page.evaluate(() => {
    (window as any).tracking = false;
    const frames = (window as any).frames;
    const sum = frames.reduce((a: number, b: number) => a + b, 0);
    return sum / frames.length;
  });

  console.log(`平均 FPS: ${avgFPS}`);
  expect(avgFPS).toBeGreaterThanOrEqual(58);
});
```

### Widget 拖拉即時性測試

**測試場景**: 驗證 Widget 拖拉操作即時反應（FR-033）

**手動測試步驟**:

1. 開啟儀表板工作室
2. 拖拉 Widget 至新位置
3. 觀察是否有明顯延遲

**驗收標準**:
- ✅ 拖拉時 Widget 跟隨滑鼠移動
- ✅ 無明顯延遲（< 100ms）
- ✅ 放置後位置立即更新

### 年度回顧生成效能測試

**測試場景**: 驗證年度回顧生成時間（FR-035）

```bash
#!/bin/bash
# annual_review_performance.sh

TOKEN="<your_access_token>"
API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api/v1}"

echo "📅 年度回顧效能測試"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 測試互動式網頁版生成
echo ""
echo "🌐 測試互動式網頁版生成（目標 < 3 秒）"
START=$(date +%s%3N)
RESPONSE=$(curl -s -X POST "$API_BASE_URL/annual-review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "include_video": false}')
END=$(date +%s%3N)

CLIENT_TIME=$((END - START))
SERVER_TIME=$(echo "$RESPONSE" | jq -r '.generation_time_ms')
REVIEW_ID=$(echo "$RESPONSE" | jq -r '.review.id')

echo "  - 客戶端測量時間: ${CLIENT_TIME}ms"
echo "  - 伺服器回報時間: ${SERVER_TIME}ms"

if [ $SERVER_TIME -lt 3000 ]; then
  echo "  ✅ 網頁版效能驗證通過"
else
  echo "  ❌ 網頁版效能驗證失敗（${SERVER_TIME}ms > 3000ms）"
fi

# 測試圖片匯出
echo ""
echo "🖼️  測試圖片匯出（目標 < 5 秒）"
START=$(date +%s%3N)
EXPORT_RESPONSE=$(curl -s -X GET "$API_BASE_URL/annual-review/$REVIEW_ID/export?format=images" \
  -H "Authorization: Bearer $TOKEN")
END=$(date +%s%3N)

CLIENT_TIME=$((END - START))
SERVER_TIME=$(echo "$EXPORT_RESPONSE" | jq -r '.generation_time_ms')
IMAGE_COUNT=$(echo "$EXPORT_RESPONSE" | jq '.images | length')

echo "  - 客戶端測量時間: ${CLIENT_TIME}ms"
echo "  - 伺服器回報時間: ${SERVER_TIME}ms"
echo "  - 圖片數量: $IMAGE_COUNT"

if [ $SERVER_TIME -lt 5000 ]; then
  echo "  ✅ 圖片匯出效能驗證通過"
else
  echo "  ❌ 圖片匯出效能驗證失敗（${SERVER_TIME}ms > 5000ms）"
fi
```

---

## 離線模式測試

### 離線運動記錄測試

**測試場景**: 驗證使用者在無網路環境運動時可本地記錄（FR-022）

**測試步驟**:

#### 步驟 1: 模擬離線環境

**Web App 測試（使用瀏覽器開發者工具）**:

1. 開啟 Chrome DevTools → Network 分頁
2. 勾選「Offline」模擬離線環境
3. 記錄運動（應儲存至 IndexedDB/LocalStorage）
4. 取消勾選「Offline」恢復網路
5. 驗證資料自動同步

**Mobile App 測試（真實裝置）**:

1. 開啟飛航模式
2. 記錄運動
3. 關閉飛航模式
4. 驗證背景同步

#### 步驟 2: 驗證本地儲存

**瀏覽器測試**:

```javascript
// 檢查 IndexedDB 中的離線記錄
async function checkOfflineWorkouts() {
  const db = await indexedDB.open('motionstory_offline', 1);
  const transaction = db.transaction(['workouts'], 'readonly');
  const store = transaction.objectStore('workouts');
  const workouts = await store.getAll();

  console.log('離線運動記錄:', workouts);

  // 驗證記錄存在
  if (workouts.length > 0) {
    console.log('✅ 離線記錄成功儲存');
  } else {
    console.log('❌ 離線記錄儲存失敗');
  }
}

checkOfflineWorkouts();
```

#### 步驟 3: 驗證同步功能

**測試腳本**:

```bash
#!/bin/bash
# offline_sync_test.sh

API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api/v1}"
TOKEN="<your_access_token>"

echo "📡 離線同步測試"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 模擬離線記錄的運動資料
OFFLINE_WORKOUTS='[
  {
    "workout_type": "running",
    "start_time": "2025-01-15T08:30:00Z",
    "duration_minutes": 30,
    "distance_km": 5.0,
    "notes": "離線記錄 1"
  },
  {
    "workout_type": "cycling",
    "start_time": "2025-01-16T19:00:00Z",
    "duration_minutes": 45,
    "distance_km": 15.0,
    "notes": "離線記錄 2"
  },
  {
    "workout_type": "swimming",
    "start_time": "2025-01-17T07:00:00Z",
    "duration_minutes": 40,
    "distance_km": 1.5,
    "notes": "離線記錄 3"
  }
]'

# 批次上傳離線記錄
echo ""
echo "📤 批次同步離線記錄..."
RESPONSE=$(curl -s -X POST "$API_BASE_URL/workouts/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workouts": '"$OFFLINE_WORKOUTS"'}')

CREATED_COUNT=$(echo "$RESPONSE" | jq -r '.created_count')
FAILED_COUNT=$(echo "$RESPONSE" | jq -r '.failed_count')

echo "  - 成功同步: $CREATED_COUNT 筆"
echo "  - 同步失敗: $FAILED_COUNT 筆"

if [ $CREATED_COUNT -eq 3 ] && [ $FAILED_COUNT -eq 0 ]; then
  echo "  ✅ 離線同步驗證通過"
else
  echo "  ❌ 離線同步驗證失敗"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

# 驗證同步後的資料
echo ""
echo "🔍 驗證同步後資料..."
WORKOUTS=$(curl -s -X GET "$API_BASE_URL/workouts?limit=3&sort=start_time_desc" \
  -H "Authorization: Bearer $TOKEN")

WORKOUT_COUNT=$(echo "$WORKOUTS" | jq '.workouts | length')
echo "  - 最新運動記錄數: $WORKOUT_COUNT"

# 驗證 sync_status
SYNC_STATUSES=$(echo "$WORKOUTS" | jq -r '.workouts[].sync_status')
echo "  - 同步狀態: $SYNC_STATUSES"

ALL_SYNCED=true
for status in $SYNC_STATUSES; do
  if [ "$status" != "synced" ]; then
    ALL_SYNCED=false
  fi
done

if [ "$ALL_SYNCED" = true ]; then
  echo "  ✅ 所有記錄同步狀態正確"
else
  echo "  ❌ 部分記錄同步狀態異常"
fi
```

#### 步驟 4: 測試同步衝突處理

**場景**: 使用者在多裝置離線記錄，恢復網路時同步

```bash
# 模擬裝置 A 離線記錄
DEVICE_A_WORKOUT='{
  "workout_type": "running",
  "start_time": "2025-01-15T08:30:00Z",
  "duration_minutes": 30,
  "distance_km": 5.0,
  "notes": "裝置 A 記錄"
}'

# 模擬裝置 B 離線記錄（同一時間不同記錄）
DEVICE_B_WORKOUT='{
  "workout_type": "cycling",
  "start_time": "2025-01-15T08:30:00Z",
  "duration_minutes": 45,
  "distance_km": 15.0,
  "notes": "裝置 B 記錄"
}'

# 批次同步（伺服器應處理時間衝突）
curl -X POST "$API_BASE_URL/workouts/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workouts": ['"$DEVICE_A_WORKOUT"', '"$DEVICE_B_WORKOUT"']}'

# 驗證同步結果
# 預期行為：兩筆記錄都成功建立（不同運動類型不衝突）
# 或：提示使用者解決衝突（如果實作衝突檢測）
```

### 多裝置同步測試

**測試場景**: 驗證儀表板配置跨裝置即時同步（FR-027）

**測試步驟**:

1. **裝置 A**: 建立儀表板並新增 Widget
2. **裝置 B**: 登入同一帳號，驗證儀表板自動同步
3. **裝置 A**: 更新 Widget 位置
4. **裝置 B**: 刷新頁面，驗證變更已同步

**自動化測試**:

```javascript
// tests/multi_device_sync.spec.ts
import { test, expect } from '@playwright/test';

test('儀表板配置應跨裝置同步', async ({ browser }) => {
  // 建立兩個瀏覽器上下文（模擬兩個裝置）
  const deviceA = await browser.newContext();
  const deviceB = await browser.newContext();

  const pageA = await deviceA.newPage();
  const pageB = await deviceB.newPage();

  // 兩個裝置登入同一帳號
  const credentials = {
    email: 'sync_test@example.com',
    password: 'SecurePass123'
  };

  await pageA.goto('http://localhost:3000/login');
  await pageA.fill('[name="email"]', credentials.email);
  await pageA.fill('[name="password"]', credentials.password);
  await pageA.click('button[type="submit"]');

  await pageB.goto('http://localhost:3000/login');
  await pageB.fill('[name="email"]', credentials.email);
  await pageB.fill('[name="password"]', credentials.password);
  await pageB.click('button[type="submit"]');

  // 裝置 A: 建立儀表板
  await pageA.goto('http://localhost:3000/dashboards');
  await pageA.click('[data-testid="create-dashboard"]');
  await pageA.fill('[name="name"]', '同步測試儀表板');
  await pageA.click('[data-testid="submit-dashboard"]');

  // 裝置 A: 新增 Widget
  await pageA.click('[data-testid="add-widget"]');
  await pageA.click('[data-widget-type="streak_counter"]');

  // 裝置 B: 刷新頁面驗證同步
  await pageB.goto('http://localhost:3000/dashboards');
  await pageB.waitForTimeout(1000);  // 等待同步

  const dashboardName = await pageB.textContent('[data-testid="dashboard-name"]');
  expect(dashboardName).toBe('同步測試儀表板');

  const widgetCount = await pageB.locator('[data-testid="widget"]').count();
  expect(widgetCount).toBe(1);

  console.log('✅ 多裝置同步驗證通過');
});
```

---

## 故障排除

### 常見問題

#### 1. 認證失敗（401 Unauthorized）

**問題**: API 回傳 401 錯誤

**解決方案**:

```bash
# 檢查 token 是否過期
curl -X GET "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# 如果過期，重新登入或刷新 token
curl -X POST "$API_BASE_URL/auth/refresh" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firebase_id_token": "<new_firebase_token>"}'
```

#### 2. 成就未觸發

**問題**: 記錄運動後未看到慶祝動畫

**檢查步驟**:

```bash
# 1. 驗證成就檢查 API
curl -X POST "$API_BASE_URL/achievements/check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workout_id": "<workout_id>"}'

# 2. 查看已解鎖的成就
curl -X GET "$API_BASE_URL/achievements" \
  -H "Authorization: Bearer $TOKEN"

# 3. 查看成就統計
curl -X GET "$API_BASE_URL/achievements/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Widget 數量限制錯誤

**問題**: 新增 Widget 時回傳 400 錯誤

**解決方案**:

```bash
# 檢查目前 Widget 數量
curl -X GET "$API_BASE_URL/dashboards/$DASHBOARD_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.widgets | length'

# 如果超過 20 個，建立新儀表板
curl -X POST "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "新儀表板"}'
```

#### 4. CSV 匯入格式錯誤

**問題**: CSV 匯入失敗

**檢查步驟**:

```bash
# 確認 CSV 格式正確
head -n 3 test_workouts.csv

# 應為以下格式：
# date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
# 2025-01-01,running,30,5.0,6.0,140,300,新年第一跑

# 重新匯入
curl -X POST "$API_BASE_URL/workouts/import" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_workouts.csv"
```

#### 5. 年度回顧生成時間過長

**問題**: 年度回顧生成超過 3 秒

**檢查步驟**:

```bash
# 1. 檢查運動記錄數量
curl -X GET "$API_BASE_URL/workouts/stats?time_range=1y" \
  -H "Authorization: Bearer $TOKEN"

# 2. 如果記錄過多，可能需要優化查詢
# 聯絡後端團隊檢查資料庫索引

# 3. 使用較小的年份範圍測試
curl -X POST "$API_BASE_URL/annual-review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2025}'  # 當年資料較少
```

### 測試環境重置

**完整重置測試環境**:

```bash
#!/bin/bash
# reset_test_env.sh

API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api/v1}"
TOKEN="<your_access_token>"

echo "🔄 重置測試環境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 刪除所有運動記錄
echo "🗑️  刪除運動記錄..."
WORKOUTS=$(curl -s -X GET "$API_BASE_URL/workouts?limit=100" \
  -H "Authorization: Bearer $TOKEN")

echo "$WORKOUTS" | jq -r '.workouts[].id' | while read -r workout_id; do
  curl -s -X DELETE "$API_BASE_URL/workouts/$workout_id" \
    -H "Authorization: Bearer $TOKEN"
done

# 2. 刪除所有儀表板（除了預設）
echo "🗑️  刪除儀表板..."
DASHBOARDS=$(curl -s -X GET "$API_BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN")

echo "$DASHBOARDS" | jq -r '.dashboards[1:][].id' | while read -r dashboard_id; do
  curl -s -X DELETE "$API_BASE_URL/dashboards/$dashboard_id" \
    -H "Authorization: Bearer $TOKEN"
done

# 3. 重置隱私設定
echo "🔒 重置隱私設定..."
curl -s -X PUT "$API_BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "privacy_settings": {
      "share_location": false,
      "share_detailed_stats": true
    }
  }' > /dev/null

echo ""
echo "✅ 測試環境重置完成"
```

---

## 附錄

### 測試資料範本

#### CSV 匯入範本

```csv
date,workout_type,duration_minutes,distance_km,pace_min_per_km,avg_heart_rate,calories,notes
2025-01-01,running,30,5.0,6.0,140,300,新年第一跑
2025-01-02,cycling,45,15.0,,125,450,晨間騎車
2025-01-03,running,35,6.0,5.83,145,350,配速進步
2025-01-04,swimming,40,1.5,,130,320,游泳訓練
2025-01-05,walking,60,4.0,,110,200,晚間散步
2025-01-06,running,40,7.0,5.71,150,400,長距離慢跑
2025-01-07,yoga,50,,,100,150,瑜珈恢復
2025-01-08,running,35,6.5,5.38,148,370,速度訓練
2025-01-09,cycling,50,18.0,,135,500,週末騎車
2025-01-10,running,45,8.0,5.63,152,450,週日長跑
```

### 效能基準值

| 測試項目 | 目標值 | 測量方式 |
|---------|--------|---------|
| API 回應時間（運動記錄） | < 200ms | curl 計時 |
| 慶祝動畫 FPS | 60 FPS | Chrome DevTools Performance |
| Widget 拖拉延遲 | < 100ms | 手動測試 + 使用者回饋 |
| 年度回顧生成（網頁版） | < 3 秒 | API generation_time_ms |
| 年度回顧匯出（圖片） | < 5 秒 | API generation_time_ms |
| 離線同步延遲 | < 1 秒 | 批次 API 回應時間 |

### 測試檢查清單

**功能測試**:
- [ ] 使用者註冊與登入
- [ ] Google OAuth 登入
- [ ] 記錄運動（所有運動類型）
- [ ] 慶祝動畫觸發
- [ ] 成就解鎖
- [ ] 分享卡片生成
- [ ] 建立多個儀表板
- [ ] 新增/移除/拖拉 Widget
- [ ] Widget 數量限制驗證
- [ ] 運動時間軸顯示
- [ ] 里程碑標記
- [ ] 年度回顧生成
- [ ] 圖片/PDF 匯出
- [ ] CSV 匯入/匯出

**效能測試**:
- [ ] API 回應時間 < 200ms
- [ ] 慶祝動畫 60 FPS
- [ ] Widget 拖拉即時反應
- [ ] 年度回顧網頁版 < 3 秒
- [ ] 年度回顧圖片匯出 < 5 秒

**離線測試**:
- [ ] 離線運動記錄
- [ ] 網路恢復後自動同步
- [ ] 批次同步成功率
- [ ] 同步衝突處理

**多裝置測試**:
- [ ] 儀表板配置同步
- [ ] 運動記錄同步
- [ ] 成就進度同步

---

## 聯絡資訊

**問題回報**: support@motionstory.com
**技術文件**: https://docs.motionstory.com
**API 文件**: https://api.motionstory.com/docs

---

**文件版本歷史**:
- v1.0.0 (2025-10-07): 初始版本，涵蓋完整功能測試指南
