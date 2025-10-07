# Research: MotionStory 技術決策與最佳實踐

**Date**: 2025-10-07
**Purpose**: 研究技術選型、架構模式與實作最佳實踐，確保符合免費方案限制與效能要求

---

## 1. React Native + Expo 行動開發

### 決策: Expo Managed Workflow
- **選擇原因**:
  - 快速開發: 內建常用功能（相機、位置、通知、SQLite）
  - 跨平台一致性: 單一 codebase 支援 iOS/Android
  - 免費部署: Expo Go 測試, EAS Build 免費額度
  - 無需原生開發經驗: 純 JavaScript/TypeScript 開發

- **限制與對策**:
  - 無法使用某些原生模組 → 使用 Expo SDK 替代方案
  - App 體積較大 → 使用 Production build 優化
  - 啟動時間較慢 → 使用 Hermes JavaScript engine

### 狀態管理: Zustand vs Redux Toolkit
- **選擇**: Zustand
- **理由**:
  - 輕量級 (< 1KB), Redux Toolkit 較重 (11KB+)
  - 更少 boilerplate，學習曲線平緩
  - 與 React Native 整合無縫，效能優異
  - 支援 async actions 與 TypeScript

### 動畫方案: React Native Reanimated 3
- **選擇原因**:
  - 60 FPS 保證: 在 UI thread 外執行動畫
  - 複雜手勢支援: 拖拉 Widget 互動
  - 聲明式 API: 易於維護慶祝動畫效果
  - Expo 官方支援

### 本地儲存: Expo SQLite
- **選擇**: Expo SQLite
- **理由**:
  - 離線優先: 完整關聯式資料庫
  - 效能優異: 大量運動記錄查詢快速
  - 同步策略: 儲存 sync_status 欄位，網路恢復後批次上傳
  - 替代方案: AsyncStorage (僅適合簡單 key-value, 不適合複雜查詢)

---

## 2. Python FastAPI 後端設計

### 非同步架構: FastAPI + Uvicorn + Motor
- **選擇原因**:
  - 高效能: async/await 支援，適合 I/O bound 操作
  - 自動文件: OpenAPI 自動生成，減少文件維護成本
  - 型別安全: Pydantic V2 驗證，減少執行時錯誤
  - MongoDB async driver (Motor): 原生 asyncio 支援

### API 設計模式: RESTful + Resource-Based
```
POST   /api/v1/workouts           # 建立運動記錄
GET    /api/v1/workouts           # 列出運動記錄 (分頁、篩選)
GET    /api/v1/workouts/{id}      # 取得單筆記錄
PUT    /api/v1/workouts/{id}      # 更新記錄
DELETE /api/v1/workouts/{id}      # 軟刪除記錄

POST   /api/v1/achievements/check # 檢查成就觸發
GET    /api/v1/achievements        # 取得成就清單

GET    /api/v1/dashboards          # 取得所有儀表板
POST   /api/v1/dashboards          # 建立儀表板
PUT    /api/v1/dashboards/{id}     # 更新 Widget 配置

GET    /api/v1/timeline            # 取得時間軸 (分頁)
GET    /api/v1/timeline/milestones # 取得里程碑

POST   /api/v1/annual-review       # 生成年度回顧
```

### 認證策略: Firebase Authentication + JWT
- **流程**:
  1. Mobile App 使用 Firebase SDK 登入 (Email/Google)
  2. 取得 Firebase ID Token
  3. Backend 驗證 Token (`firebase-admin` Python SDK)
  4. 發行自訂 JWT (含 user_id, exp)
  5. 後續請求帶 JWT 於 Authorization header

- **優勢**:
  - Firebase 處理密碼儲存、OAuth flow
  - Backend 無需管理密碼雜湊
  - JWT stateless，無需 session storage

---

## 3. MongoDB Atlas 資料模型設計

### Schema 設計模式: Hybrid (Embedded + Reference)

**Users Collection**:
```json
{
  "_id": ObjectId,
  "firebase_uid": "string",
  "email": "string",
  "display_name": "string",
  "created_at": ISODate,
  "privacy_settings": {
    "share_location": bool,
    "share_detailed_stats": bool
  }
}
```

**Workouts Collection** (主要資料):
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "workout_type": "running|cycling|swimming|...",
  "start_time": ISODate,
  "duration_minutes": int,
  "distance_km": float,
  "pace_min_per_km": float,
  "avg_heart_rate": int,
  "location": {
    "type": "Point",
    "coordinates": [lon, lat]  // GeoJSON for future features
  },
  "notes": "string",
  "is_deleted": bool,
  "deleted_at": ISODate,
  "sync_status": "synced|pending|conflict",
  "created_at": ISODate,
  "updated_at": ISODate
}
```
- **索引**: `user_id + start_time`, `user_id + is_deleted`

**Achievements Collection**:
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "achievement_type": "first_workout|streak_3|streak_7|distance_milestone|...",
  "celebration_level": "basic|fireworks|epic",
  "workout_id": ObjectId,  // 關聯運動記錄
  "achieved_at": ISODate,
  "metadata": {
    "streak_days": int,
    "distance_km": float,
    ...
  }
}
```

**Dashboards Collection**:
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "name": "訓練儀表板",
  "widgets": [
    {
      "type": "streak_counter|distance_chart|pace_analysis|...",
      "position": {"x": int, "y": int},
      "size": {"width": int, "height": int},
      "config": {
        "time_range": "7d|30d|all",
        "metric": "distance|duration|pace"
      }
    }
  ],
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### 免費方案策略 (512MB 限制)
- **資料保留**: 軟刪除記錄保留 30 天後 cron job 清理
- **索引優化**: 僅建立必要索引，避免過多索引佔用空間
- **分頁查詢**: 時間軸使用 cursor-based pagination
- **聚合管道**: 年度回顧使用 MongoDB aggregation 減少記憶體消耗

---

## 4. Cloudflare R2 檔案儲存

### 使用場景
- **分享卡片圖片**: 使用者生成的成就分享圖
- **年度回顧圖片**: 多張圖片匯出
- **未來擴充**: 使用者頭像、運動照片

### S3-Compatible API 整合
```python
import boto3

r2_client = boto3.client(
    's3',
    endpoint_url='https://<account_id>.r2.cloudflarestorage.com',
    aws_access_key_id=os.getenv('R2_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('R2_SECRET_KEY')
)

# 上傳圖片
r2_client.upload_fileobj(
    file_object,
    'motionstory-bucket',
    f'share-cards/{user_id}/{timestamp}.png',
    ExtraArgs={'ContentType': 'image/png'}
)

# 生成 Public URL
url = f"https://r2.motionstory.com/share-cards/{user_id}/{timestamp}.png"
```

### CDN 策略
- Public bucket: 分享卡片可公開存取
- Cache-Control headers: 圖片不常變動，設定長期快取
- 圖片優化: 使用 Pillow 壓縮至 < 200KB

---

## 5. 效能優化策略

### Mobile App 效能
1. **FlatList 虛擬化**: 時間軸使用 `FlatList` 自動虛擬滾動
2. **圖片 Lazy Loading**: `react-native-fast-image` 快取圖片
3. **Memoization**: `React.memo` + `useMemo` 避免不必要渲染
4. **Code Splitting**: 按需載入螢幕 (`React.lazy` + Suspense)
5. **Hermes Engine**: Expo 預設啟用，減少啟動時間

### API 效能
1. **連線池**: Motor MongoDB client 連線池設定 (max 10 connections)
2. **Cache Layer**: 簡單快取 (in-memory dict) 快取成就規則
3. **Background Tasks**: 成就檢查使用 `asyncio.create_task` 非阻塞
4. **Response Compression**: Gzip middleware 壓縮 JSON 回應
5. **限流**: 簡單 IP-based rate limiting (10 req/sec/IP)

### MongoDB 查詢優化
1. **Projection**: 僅回傳需要的欄位 (`{_id: 1, title: 1}`)
2. **Cursor Limit**: 分頁查詢限制每次 20-50 筆
3. **Compound Index**: `{user_id: 1, start_time: -1}` 複合索引
4. **Aggregation Pipeline**: 年度回顧使用 `$match → $group → $project` 減少資料傳輸

---

## 6. 離線同步策略

### 同步架構: Optimistic UI + Conflict Resolution

**Workflow**:
1. **本地寫入**: 運動記錄立即寫入 Expo SQLite, `sync_status = 'pending'`
2. **UI 更新**: 立即顯示運動記錄，無需等待網路
3. **背景同步**: 每 30 秒或網路恢復時觸發 sync job
4. **衝突解決**: 若 server 回應 409 Conflict, 使用 "Last Write Wins" 策略
5. **錯誤重試**: 使用 exponential backoff 重試 (1s, 2s, 4s, 8s)

**SQLite Schema**:
```sql
CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  workout_type TEXT,
  start_time TEXT,
  duration_minutes INTEGER,
  distance_km REAL,
  notes TEXT,
  sync_status TEXT DEFAULT 'pending', -- 'pending'|'synced'|'conflict'
  server_id TEXT,  -- MongoDB ObjectId after sync
  created_at TEXT,
  updated_at TEXT,
  is_deleted INTEGER DEFAULT 0
);

CREATE INDEX idx_sync_pending ON workouts(sync_status) WHERE sync_status = 'pending';
```

---

## 7. 測試策略

### Mobile App 測試
- **Unit Tests (Jest)**:
  - Zustand store actions
  - Utility functions (日期格式化、單位轉換)
  - API client mock 測試

- **Component Tests (Testing Library)**:
  - Widget 元件渲染測試
  - 慶祝動畫觸發測試
  - Form validation 測試

- **E2E Tests (Detox)**:
  - 關鍵流程: 登入 → 記錄運動 → 看到慶祝動畫 → 儀表板更新
  - 離線模式: 關閉網路 → 記錄運動 → 開啟網路 → 驗證同步

### Backend API 測試
- **Unit Tests (pytest)**:
  - Pydantic models validation
  - Service layer 業務邏輯 (mock database)
  - Achievement detection logic

- **Integration Tests (pytest + MongoDB testcontainer)**:
  - API endpoints with real MongoDB
  - 認證 flow (mock Firebase Admin SDK)
  - CRUD operations

- **Contract Tests**:
  - 使用 Pact 或 OpenAPI schema validation
  - 確保 Mobile App 與 API 契約一致

---

## 8. 部署策略 (Render Free Tier)

### Render Web Service 配置
```yaml
# render.yaml
services:
  - type: web
    name: motionstory-api
    env: python
    region: singapore
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn src.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: FIREBASE_CREDENTIALS
        sync: false
      - key: R2_ACCESS_KEY
        sync: false
```

### 免費方案限制與對策
- **512MB RAM**:
  - 使用 Gunicorn + Uvicorn workers (2 workers)
  - 避免大型 in-memory cache

- **自動休眠**: 15 分鐘無請求後休眠
  - 前端加 loading 提示 "Server waking up..."
  - 使用 cron job (UptimeRobot) 每 14 分鐘 ping 保持活躍

- **無持久化儲存**:
  - 所有資料存 MongoDB Atlas
  - 臨時檔案存 /tmp, 用完即刪

### CI/CD (GitHub Actions - 可選)
```yaml
# .github/workflows/deploy.yml
name: Deploy API
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pip install -r requirements.txt
      - run: pytest
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: curl -X POST $RENDER_DEPLOY_HOOK
```

---

## 9. 開發環境設定

### Mobile App Setup
```bash
# 安裝 Expo CLI
npm install -g expo-cli

# 初始化專案
npx create-expo-app@latest app --template blank-typescript

# 安裝依賴
cd app
npm install zustand react-navigation @react-navigation/native-stack
npm install react-native-paper react-native-reanimated victory-native
npm install expo-sqlite expo-file-system expo-image-picker
npm install @react-native-firebase/app @react-native-firebase/auth
npm install --save-dev jest @testing-library/react-native detox
```

### Backend API Setup
```bash
# 建立虛擬環境
cd api
python3.11 -m venv venv
source venv/bin/activate

# 安裝依賴
pip install fastapi uvicorn motor pydantic pydantic-settings
pip install firebase-admin python-jose passlib bcrypt
pip install boto3  # Cloudflare R2
pip install pytest pytest-asyncio pytest-cov httpx
pip install python-multipart  # File uploads

# requirements.txt
fastapi==0.110.0
uvicorn[standard]==0.27.0
motor==3.3.2
pydantic==2.6.0
pydantic-settings==2.1.0
firebase-admin==6.4.0
python-jose[cryptography]==3.3.0
boto3==1.34.0
pytest==8.0.0
pytest-asyncio==0.23.0
httpx==0.26.0
```

---

## 10. 安全性最佳實踐

### API 安全
1. **CORS 設定**: 僅允許 Mobile App domain
2. **Rate Limiting**: 每 IP 10 req/sec (使用 slowapi)
3. **Input Validation**: Pydantic 嚴格驗證所有輸入
4. **SQL Injection 防護**: Motor ODM 參數化查詢
5. **XSS 防護**: 前端使用 React Native (無 DOM XSS 風險)
6. **Secrets 管理**: 環境變數 (Render env vars, .env.local for dev)

### 認證安全
1. **JWT Expiry**: 7 天有效期，需定期重新驗證 Firebase token
2. **Refresh Token**: Firebase SDK 自動處理 token refresh
3. **HTTPS Only**: Render 提供免費 SSL
4. **Password Policy**: Firebase 預設強密碼要求

---

## 研究結論

**技術決策摘要**:
- ✅ React Native + Expo: 快速跨平台開發，符合免費方案
- ✅ FastAPI + Motor: 高效能 async API，MongoDB 原生支援
- ✅ MongoDB Atlas: 免費 512MB 足夠 MVP，索引優化降低空間
- ✅ Firebase Auth: 無需自建認證系統，省開發時間
- ✅ Cloudflare R2: S3-compatible, 10GB 免費額度充足
- ✅ Render 部署: 免費 512MB RAM, 自動 SSL, 容器化部署

**風險與緩解**:
- Render 休眠問題 → UptimeRobot ping 保持活躍
- MongoDB 空間限制 → 定期清理軟刪除資料, 索引優化
- 離線同步複雜度 → SQLite + optimistic UI + conflict resolution

**下一步**: 進入 Phase 1 Design - 定義資料模型、API 契約與快速開始指南
