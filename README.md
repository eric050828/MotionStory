# MotionStory - 運動追蹤與動機平台

MotionStory 是一個跨平台運動追蹤與動機維持平台，透過即時慶祝動畫、客製化儀表板與運動傳記時間軸三大核心功能，幫助使用者建立長期運動習慣。

## 專案結構

```
MotionStory/
├── api/                    # Python FastAPI 後端 API
│   ├── src/
│   │   ├── core/          # 核心配置 (資料庫、Firebase、R2)
│   │   ├── models/        # Pydantic 資料模型
│   │   ├── services/      # 業務邏輯層
│   │   ├── routers/       # FastAPI 路由
│   │   └── main.py        # 應用程式進入點
│   ├── tests/             # 測試檔案
│   │   ├── unit/          # 單元測試
│   │   ├── integration/   # 整合測試
│   │   └── contract/      # API 契約測試
│   ├── requirements.txt   # Python 依賴
│   ├── Dockerfile         # Docker 容器配置
│   └── render.yaml        # Render 部署配置
│
├── app/                   # React Native + Expo 行動應用
│   ├── src/
│   │   ├── screens/       # 主要畫面
│   │   ├── components/    # UI 元件
│   │   ├── services/      # API 呼叫與本地儲存
│   │   ├── store/         # Zustand 狀態管理
│   │   └── navigation/    # React Navigation 設定
│   ├── __tests__/         # 測試檔案
│   ├── package.json       # Node 依賴
│   ├── app.json          # Expo 配置
│   └── tsconfig.json     # TypeScript 配置
│
└── specs/                 # 功能規格文件
    └── 001-motionstory/
        ├── spec.md        # 功能規格
        ├── plan.md        # 實作計畫
        ├── data-model.md  # 資料模型
        ├── tasks.md       # 任務清單
        ├── quickstart.md  # 快速開始指南
        └── contracts/     # API 契約定義
```

## 技術棧

### 後端 (API)
- **語言**: Python 3.11+
- **框架**: FastAPI 0.110+
- **資料庫**: MongoDB Atlas (M0 Free Tier)
- **認證**: Firebase Authentication
- **檔案儲存**: Cloudflare R2
- **部署**: Render (Free Tier)

### 前端 (Mobile App)
- **語言**: TypeScript
- **框架**: React Native 0.74+ with Expo SDK 51+
- **UI 函式庫**: React Native Paper (Material Design)
- **狀態管理**: Zustand
- **導航**: React Navigation 6+
- **圖表**: Victory Native
- **動畫**: React Native Reanimated 3
- **本地儲存**: Expo SQLite

## 快速開始

### 前置要求

- Python 3.11+
- Node.js 18+
- MongoDB Atlas 帳號
- Firebase 專案
- Cloudflare R2 帳號

### 後端設定

1. 建立虛擬環境並安裝依賴：

```bash
cd api
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. 配置環境變數：

```bash
cp .env.example .env
# 編輯 .env 填入您的設定
```

3. 啟動開發伺服器：

```bash
uvicorn src.main:app --reload --port 8000
```

API 文件將在 http://localhost:8000/docs 提供。

### 前端設定

1. 安裝依賴：

```bash
cd app
npm install
```

2. 啟動 Expo 開發伺服器：

```bash
npm start
```

3. 使用 Expo Go 掃描 QR code 或在模擬器中執行。

## 測試

### 後端測試

```bash
cd api
pytest                    # 執行所有測試
pytest --cov=src         # 測試覆蓋率報告
pytest tests/unit        # 僅執行單元測試
pytest tests/contract    # 僅執行 API 契約測試
```

### 前端測試

```bash
cd app
npm test                 # 執行 Jest 測試
npm test -- --coverage   # 測試覆蓋率報告
```

## 程式碼品質

### Python (後端)

```bash
cd api
black .                  # 格式化程式碼
isort .                  # 排序 imports
flake8 .                 # Linting 檢查
```

### TypeScript (前端)

```bash
cd app
npm run lint            # ESLint 檢查
npm run type-check      # TypeScript 類型檢查
```

## 部署

### Render (後端)

1. 將專案推送至 GitHub
2. 連接 Render 至您的儲存庫
3. 使用 `api/render.yaml` 配置自動部署
4. 設定環境變數

### Expo (前端)

```bash
cd app
npx eas build --platform android  # Android APK
npx eas build --platform ios       # iOS IPA
```

## 環境變數

### 後端 (.env)

```env
MONGODB_URI=mongodb+srv://...
DB_NAME=motionstory
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=base64-encoded-private-key
FIREBASE_CLIENT_EMAIL=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET_NAME=motionstory-bucket
JWT_SECRET_KEY=your-secret-key
```

### 前端 (app.json)

Firebase 配置已整合於 Expo config plugins。

## 功能特色

### 🎉 即時慶祝動畫
- 運動記錄後立即觸發
- 三種慶祝等級：基礎、煙火、史詩級
- 60 FPS 流暢動畫

### 📊 客製化儀表板
- 拖拉式 Widget 配置
- 12 種 Widget 類型
- 多儀表板支援

### 📅 運動傳記時間軸
- 完整運動歷程記錄
- 里程碑高亮標記
- 年度回顧自動生成

### 💾 離線優先
- SQLite 本地儲存
- 網路恢復後自動同步
- 衝突解決機制

## API 端點

完整 API 文件請參閱：
- 開發環境: http://localhost:8000/docs
- 生產環境: https://api.motionstory.com/docs

主要端點：
- `POST /api/v1/auth/register` - 使用者註冊
- `POST /api/v1/workouts` - 記錄運動
- `GET /api/v1/achievements` - 取得成就
- `POST /api/v1/dashboards` - 建立儀表板
- `POST /api/v1/annual-review` - 生成年度回顧

## 效能目標

- ✅ API 回應時間: < 200ms
- ✅ 慶祝動畫: 60 FPS
- ✅ 年度回顧生成: < 3 秒
- ✅ 圖片匯出: < 5 秒

## 授權

MIT License

## 聯絡資訊

- **Email**: support@motionstory.com
- **文件**: https://docs.motionstory.com
- **問題回報**: https://github.com/motionstory/issues
