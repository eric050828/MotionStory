# MotionStory - Performance & Error Handling 快速開始指南

## 🚀 5 分鐘快速整合

### Backend (FastAPI)

#### 1. 安裝依賴 (1 分鐘)

```bash
cd api
pip install redis motor sentry-sdk  # Redis 是選用的
```

#### 2. 更新 main.py (2 分鐘)

```python
from fastapi import FastAPI
from src.core.error_handlers import register_exception_handlers
from src.core.logging_config import setup_logging, logging_middleware
from src.core.performance import compression_middleware, performance_middleware

# 設定日誌
setup_logging(level="INFO", json_format=True)

app = FastAPI()

# 註冊錯誤處理
register_exception_handlers(app)

# 註冊中間件 (順序很重要!)
app.middleware("http")(logging_middleware)
app.middleware("http")(performance_middleware)
app.middleware("http")(compression_middleware)

# 建立 MongoDB 索引 (啟動時)
@app.on_event("startup")
async def startup():
    from src.services.annual_review_optimizer import create_annual_review_indexes
    await create_annual_review_indexes(db)  # db 是你的 MongoDB 連線
```

#### 3. 使用快取 (1 分鐘)

```python
from src.core.performance import cache_response, invalidate_cache

# 快取 API 回應
@router.get("/workouts")
@cache_response(ttl=60, key_prefix="workouts")  # 快取 60 秒
async def get_workouts(user_id: str):
    workouts = await db.workouts.find({"user_id": user_id}).to_list(100)
    return workouts

# 新增資料後清除快取
@router.post("/workouts")
async def create_workout(workout: WorkoutCreate, user_id: str):
    result = await db.workouts.insert_one(workout.dict())
    invalidate_cache(f"workouts:*:user:{user_id}:*")  # 清除該用戶的快取
    return {"id": str(result.inserted_id)}
```

#### 4. 使用錯誤處理 (1 分鐘)

```python
from src.core.error_handlers import (
    ResourceNotFoundError,
    ValidationError,
    handle_errors
)

@router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str, user_id: str):
    workout = await db.workouts.find_one({
        "_id": workout_id,
        "user_id": user_id
    })

    if not workout:
        # 拋出自訂錯誤 - 自動格式化回應
        raise ResourceNotFoundError("Workout", workout_id)

    return workout
```

完成！Backend 整合完成 ✅

---

### Mobile (React Native)

#### 1. 安裝依賴 (1 分鐘)

```bash
cd app
npm install @shopify/flash-list expo-image react-native-reanimated
npm install @react-native-community/netinfo
```

#### 2. 更新 App.tsx (2 分鐘)

```tsx
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { configureImageCache } from '@/utils/imageCache';
import { offlineErrorQueue } from '@/utils/offlineErrorHandler';

// 設定圖片快取
configureImageCache();

// 初始化錯誤佇列
offlineErrorQueue.initialize();

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 可選: 報告到 Sentry 或其他服務
        console.error('App Error:', error);
      }}
    >
      <NavigationContainer>
        {/* 你的應用內容 */}
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default App;
```

#### 3. 替換 FlatList (1 分鐘)

```tsx
// 舊的方式
import { FlatList } from 'react-native';

<FlatList
  data={workouts}
  renderItem={({ item }) => <WorkoutItem workout={item} />}
  keyExtractor={(item) => item.id}
/>

// 新的方式 - 使用 VirtualList
import { WorkoutVirtualList } from '@/components/VirtualList';

<WorkoutVirtualList
  workouts={workouts}
  onWorkoutPress={(workout) => navigation.navigate('WorkoutDetail', { workout })}
  onLoadMore={loadMoreWorkouts}  // 分頁載入
  refreshing={refreshing}
  onRefresh={handleRefresh}
/>
```

#### 4. 使用快取圖片 (1 分鐘)

```tsx
// 舊的方式
import { Image } from 'react-native';

<Image source={{ uri: avatarUrl }} style={styles.avatar} />

// 新的方式 - 使用 CachedImage
import { CachedImage } from '@/utils/imageCache';

<CachedImage
  uri={avatarUrl}
  type="avatar"  // 'avatar' | 'achievement' | 'workout'
  style={styles.avatar}
  contentFit="cover"
/>
```

完成！Mobile 整合完成 ✅

---

## 📊 驗證效果

### Backend 驗證

```bash
# 啟動 API
uvicorn src.main:app --reload

# 檢查日誌
tail -f logs/motionstory.log
tail -f logs/performance.log

# 測試快取
curl http://localhost:8000/api/workouts?user_id=123
# 第二次請求應該更快 (檢查 X-Process-Time header)
```

### Mobile 驗證

```bash
# 執行測試
npm test

# 啟動應用
npm start

# 開發工具中檢查
# - FPS 應該穩定在 60fps
# - 記憶體使用應該穩定
# - 滾動應該流暢
```

---

## 🎯 效能提升預期

### 你應該看到的改善:

1. **API 回應時間**
   - 首次請求: ~200-500ms
   - 快取命中: ~10-50ms (改善 80-95%)

2. **列表滾動**
   - FlatList: 30-45 fps (大列表時)
   - FlashList: 穩定 60 fps (改善 100%)

3. **圖片載入**
   - 無快取: 500-2000ms
   - 有快取: 50-100ms (改善 80-95%)

4. **記憶體使用**
   - FlatList (1000 項): ~200MB
   - FlashList (1000 項): ~80MB (節省 60%)

---

## 🐛 常見問題

### Backend

**Q: Redis 連線失敗?**
A: 沒關係！系統會自動使用記憶體快取作為 fallback。如果想使用 Redis:
```bash
# macOS
brew install redis
redis-server

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

**Q: 日誌檔案太大?**
A: 系統已設定自動輪替 (10MB, 5 個備份)。你可以在 `logging_config.py` 調整:
```python
setup_logging(
    max_bytes=5 * 1024 * 1024,  # 改為 5MB
    backup_count=3              # 保留 3 個備份
)
```

### Mobile

**Q: FlashList 顯示警告?**
A: 確保設定 `estimatedItemSize`:
```tsx
<WorkoutVirtualList
  workouts={workouts}
  estimatedItemSize={80}  // 根據你的項目高度調整
/>
```

**Q: 圖片快取佔用太多空間?**
A: 調整快取設定:
```typescript
// imageCache.ts
const MAX_CACHE_SIZE_MB = 50;  // 改為 30MB
const CACHE_EXPIRY_DAYS = 7;   // 改為 3 天

// 或手動清理
await imageCacheManager.clearCache();
```

---

## 📚 下一步

### 進階功能

1. **設定 Sentry 錯誤追蹤**
   ```bash
   # Backend
   pip install sentry-sdk
   # 在 main.py 加入
   import sentry_sdk
   sentry_sdk.init(dsn="your-sentry-dsn")

   # Mobile
   npm install @sentry/react-native
   ```

2. **啟用年度回顧背景任務**
   ```python
   from src.services.annual_review_optimizer import schedule_annual_review_pregeneration

   # 在背景任務中執行 (如 Celery, APScheduler)
   await schedule_annual_review_pregeneration(db, target_month=12)
   ```

3. **監控儀表板**
   - 檢查 `logs/performance.log` 分析效能
   - 使用 `analyze_logs()` 函數生成報告
   - 整合 APM 工具 (New Relic, DataDog)

### 學習資源

- 📖 完整文件: `PERFORMANCE_ERROR_HANDLING.md`
- 📋 實作總結: `IMPLEMENTATION_SUMMARY.md`
- 📦 檔案清單: `FILES_CREATED.md`

---

## ✅ 檢查清單

- [ ] Backend 依賴已安裝
- [ ] main.py 已更新 (中間件、錯誤處理)
- [ ] MongoDB 索引已建立
- [ ] Mobile 依賴已安裝
- [ ] App.tsx 已更新 (ErrorBoundary)
- [ ] FlatList 已替換為 VirtualList
- [ ] Image 已替換為 CachedImage
- [ ] 測試已執行且通過
- [ ] 效能改善已驗證

---

## 🎉 完成！

恭喜！你已成功整合 MotionStory 的 Performance Optimization 和 Error Handling 功能。

如有問題，請參考完整文件或檢查測試檔案中的範例。

Happy coding! 🚀
