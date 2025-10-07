# MotionStory 本地開發環境設定

完整的本地開發環境設定指南，使用 Docker Compose 快速啟動所有服務。

## 快速開始

### 1. 前置需求

- Docker Desktop 安裝 ([下載](https://www.docker.com/products/docker-desktop))
- Git
- Node.js 18+ (for mobile app development)
- Python 3.11+ (optional, for running API locally)

### 2. Clone 專案

```bash
git clone https://github.com/your-username/MotionStory.git
cd MotionStory
```

### 3. 設定環境變數

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env (本地開發可使用預設值)
nano .env
```

**本地開發最小設定**:
```bash
MONGODB_URI=mongodb://mongodb:27017
DB_NAME=motionstory
JWT_SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
DEBUG=True
```

### 4. 啟動所有服務

```bash
# 啟動 MongoDB + API + Mongo Express
docker-compose up -d

# 查看 logs
docker-compose logs -f api
```

### 5. 驗證服務

```bash
# API Health Check
curl http://localhost:8000/health

# 預期回應:
# {"status":"healthy","version":"1.0.0"}

# API 文件
open http://localhost:8000/docs

# MongoDB Admin UI
open http://localhost:8081
```

---

## 服務說明

### Backend API (FastAPI)
- **URL**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Container**: `motionstory-api`

### MongoDB
- **URL**: mongodb://localhost:27017
- **Database**: `motionstory`
- **Container**: `motionstory-mongodb`

### Mongo Express (Admin UI)
- **URL**: http://localhost:8081
- **Container**: `motionstory-mongo-express`

---

## 開發工作流

### API 開發

```bash
# 方法 1: 使用 Docker (推薦)
docker-compose up api

# 方法 2: 本地執行 (需先啟動 MongoDB)
cd api
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 熱重載 (Hot Reload)

Docker Compose 已設定 volume mapping，修改 `api/src/` 下的程式碼會自動重載。

```yaml
# docker-compose.yml
volumes:
  - ./api/src:/app/src  # 程式碼同步
```

### 資料庫管理

```bash
# 進入 MongoDB Shell
docker exec -it motionstory-mongodb mongosh

# 使用 motionstory database
use motionstory

# 查看 collections
show collections

# 查詢資料
db.users.find().pretty()
db.workouts.find().limit(5).pretty()

# 查看索引
db.users.getIndexes()
db.workouts.getIndexes()
```

### 重置資料庫

```bash
# 停止並移除所有資料
docker-compose down -v

# 重新啟動 (會重新初始化資料庫)
docker-compose up -d
```

---

## 測試

### 單元測試

```bash
# 在 Docker 中執行
docker-compose exec api pytest tests/ -v

# 本地執行
cd api
pytest tests/ -v --cov=src
```

### 產生覆蓋率報告

```bash
cd api
pytest tests/ --cov=src --cov-report=html

# 查看報告
open htmlcov/index.html
```

### 測試特定模組

```bash
# 測試 auth
pytest tests/unit/test_auth_service.py -v

# 測試 workouts
pytest tests/unit/test_workout_service.py -v
```

---

## Mobile App 開發

### 1. 安裝依賴

```bash
cd app
npm install
```

### 2. 設定 API URL

```typescript
// app/src/config/api.ts
export const API_BASE_URL = 'http://localhost:8000';
```

### 3. 啟動 Expo

```bash
# 啟動 development server
npm start

# 或直接啟動 iOS simulator
npm run ios

# 或直接啟動 Android emulator
npm run android
```

### 4. 連接本機 API

**iOS Simulator**: `http://localhost:8000`
**Android Emulator**: `http://10.0.2.2:8000`
**實體裝置**: `http://<your-computer-ip>:8000`

---

## 常用指令

### Docker Compose

```bash
# 啟動所有服務
docker-compose up -d

# 停止所有服務
docker-compose down

# 查看服務狀態
docker-compose ps

# 查看 logs
docker-compose logs -f

# 重新建立 images
docker-compose up --build

# 清理所有資料 (含 volumes)
docker-compose down -v
```

### API 開發

```bash
# 格式化程式碼
cd api
black src/ tests/
isort src/ tests/

# 檢查程式碼品質
flake8 src/ tests/ --max-line-length=100

# 執行測試
pytest tests/ -v

# 產生 migration (未來功能)
# alembic revision --autogenerate -m "description"

# 執行 migration
# alembic upgrade head
```

### MongoDB 操作

```bash
# 備份資料庫
docker exec motionstory-mongodb mongodump --db motionstory --out /tmp/backup

# 還原資料庫
docker exec motionstory-mongodb mongorestore --db motionstory /tmp/backup/motionstory

# 匯出 collection 為 JSON
docker exec motionstory-mongodb mongoexport --db motionstory --collection workouts --out /tmp/workouts.json
```

---

## 初始化測試資料

### 方法 1: 使用 API 建立

```bash
# 註冊測試使用者
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "display_name": "Test User"
  }'

# 取得 access token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# 使用 token 建立運動記錄
curl -X POST http://localhost:8000/api/v1/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "workout_type": "running",
    "start_time": "2024-10-07T08:00:00Z",
    "duration_minutes": 30,
    "distance_km": 5.0
  }'
```

### 方法 2: 直接插入 MongoDB

```javascript
// 進入 MongoDB Shell
docker exec -it motionstory-mongodb mongosh motionstory

// 插入測試資料
db.users.insertOne({
  firebase_uid: "test-uid-123",
  email: "test@example.com",
  display_name: "Test User",
  created_at: new Date(),
  updated_at: new Date(),
  privacy_settings: {
    share_location: false,
    share_detailed_stats: true
  },
  preferences: {
    language: "zh-TW",
    measurement_unit: "metric"
  }
});

db.workouts.insertOne({
  user_id: db.users.findOne({email: "test@example.com"})._id,
  workout_type: "running",
  start_time: new Date("2024-10-07T08:00:00Z"),
  duration_minutes: 30,
  distance_km: 5.0,
  pace_min_per_km: 6.0,
  is_deleted: false,
  sync_status: "synced",
  created_at: new Date(),
  updated_at: new Date()
});
```

---

## 故障排除

### 問題 1: Docker 啟動失敗

**症狀**: `docker-compose up` 失敗

**解決方法**:
```bash
# 清理舊容器
docker-compose down -v

# 清理 Docker cache
docker system prune -a

# 重新啟動
docker-compose up --build
```

### 問題 2: API 無法連接 MongoDB

**症狀**: `pymongo.errors.ServerSelectionTimeoutError`

**解決方法**:
```bash
# 檢查 MongoDB 狀態
docker-compose ps

# 查看 MongoDB logs
docker-compose logs mongodb

# 檢查網路連線
docker-compose exec api ping mongodb
```

### 問題 3: 熱重載不工作

**症狀**: 修改程式碼後未自動重載

**解決方法**:
```bash
# 檢查 volume mapping
docker-compose config

# 重新啟動 API container
docker-compose restart api

# 查看 API logs
docker-compose logs -f api
```

### 問題 4: Port 已被佔用

**症狀**: `Error starting userland proxy: listen tcp 0.0.0.0:8000: bind: address already in use`

**解決方法**:
```bash
# 找出佔用 port 的 process
lsof -i :8000

# 終止 process
kill -9 <PID>

# 或修改 docker-compose.yml 使用其他 port
ports:
  - "8001:8000"  # 使用 8001 替代
```

---

## 效能優化

### 本地開發建議

1. **使用 volume cache** (已在 docker-compose.yml 設定)
2. **限制 API workers** (開發環境使用 1 個 worker)
3. **使用 MongoDB 索引** (已自動建立)
4. **啟用 code linting** (pre-commit hooks)

### 資源使用

```bash
# 查看容器資源使用
docker stats

# 預期:
# motionstory-api: ~200-300MB RAM
# motionstory-mongodb: ~100-200MB RAM
# motionstory-mongo-express: ~50-100MB RAM
```

---

## 下一步

完成本地開發環境設定後:

1. ✅ 熟悉 API endpoints (http://localhost:8000/docs)
2. ✅ 建立測試資料
3. ✅ 連接 Mobile App
4. ✅ 執行單元測試
5. ✅ 開始開發新功能

---

**相關文件**:
- [部署指南](./DEPLOYMENT.md)
- [快速部署](./DEPLOYMENT_QUICK_START.md)
- [API 文件](http://localhost:8000/docs)
