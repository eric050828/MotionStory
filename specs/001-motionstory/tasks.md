# Tasks: MotionStory - 運動追蹤與動機平台

**Input**: Design documents from `/specs/001-motionstory/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## 任務總覽

- **總任務數**: 180 tasks
- **平行任務**: ~60 tasks [P]
- **序列任務**: ~120 tasks
- **預估時程**: 18-25 天 (1-2 位開發者)

## 技術棧摘要

**Backend (Python FastAPI)**:
- FastAPI 0.110+, Motor (MongoDB async), Pydantic V2
- Firebase Admin SDK, boto3 (Cloudflare R2)
- pytest, pytest-asyncio, httpx

**Mobile (React Native + Expo)**:
- React Native 0.74+, Expo SDK 51+
- React Native Paper, Zustand, React Navigation 6+
- Victory Native, React Native Reanimated 3
- Jest, React Native Testing Library, Detox

## Path Conventions

```
api/                          # Backend (Python FastAPI)
├── src/
│   ├── models/              # Pydantic models & MongoDB schemas
│   ├── services/            # Business logic
│   ├── routers/             # FastAPI endpoints
│   ├── core/                # Config, database, middleware
│   ├── utils/               # Helpers
│   └── main.py              # FastAPI app
└── tests/
    ├── unit/
    ├── integration/
    └── contract/            # API contract tests

app/                          # Mobile (React Native + Expo)
├── src/
│   ├── screens/             # Main screens
│   ├── components/          # Reusable components
│   ├── services/            # API calls, local storage
│   ├── store/               # Zustand state management
│   ├── navigation/          # React Navigation
│   ├── utils/               # Helpers
│   └── types/               # TypeScript types
└── __tests__/               # Jest tests
    ├── unit/
    ├── integration/
    └── e2e/                 # Detox tests
```

---

## Phase 3.1: Setup (1-3 天)

**目標**: 專案初始化、依賴安裝、環境配置

- [X] **T001** [P] 建立 Backend 專案結構 `api/` 目錄與子目錄
- [X] **T002** [P] 建立 Mobile 專案結構 `app/` 目錄與子目錄
- [X] **T003** [P] Backend: 初始化 Python 專案 - `api/requirements.txt` 與 `api/pyproject.toml`
- [X] **T004** [P] Mobile: 初始化 Expo 專案 - `npx create-expo-app@latest app`
- [X] **T005** [P] Backend: 安裝核心依賴 (FastAPI, Motor, Pydantic, Firebase Admin, boto3)
- [X] **T006** [P] Mobile: 安裝核心依賴 (React Native Paper, Zustand, React Navigation, Victory Native, Reanimated)
- [X] **T007** [P] Backend: 配置 Linting (Ruff) 與格式化 (Black) - `api/pyproject.toml`
- [X] **T008** [P] Mobile: 配置 ESLint 與 Prettier - `app/.eslintrc.js`, `app/.prettierrc`
- [X] **T009** [P] Backend: 環境變數設定 - `api/.env.example` (MongoDB URI, Firebase credentials, R2 config)
- [X] **T010** [P] Mobile: 環境變數設定 - `app/.env.example` (API_BASE_URL, Firebase config)
- [X] **T011** [P] Backend: 建立 Dockerfile 與 render.yaml 部署配置
- [X] **T012** [P] Mobile: 配置 Expo app.json (名稱、版本、平台設定)

**Dependencies**: 無 - 所有 Setup 任務可平行執行

---

## Phase 3.2: Tests First (TDD) (2-3 天)

**⚠️ CRITICAL**: 這些測試必須在 Phase 3.3/3.4 實作前完成，且**必須失敗** (紅燈階段)

### Contract Tests (基於 5 個 API 契約檔案)

- [X] **T013** [P] Auth Contract: 註冊端點 - `api/tests/contract/test_auth_register.py``
- [X] **T014** [P] Auth Contract: 登入端點 - `api/tests/contract/test_auth_login.py`
- [X] **T015** [P] Auth Contract: Token 刷新 - `api/tests/contract/test_auth_token.py`
- [X] **T016** [P] Workouts Contract: 建立運動記錄 - `api/tests/contract/test_workouts_create.py`
- [X] **T017** [P] Workouts Contract: 查詢運動記錄 - `api/tests/contract/test_workouts_get.py`
- [X] **T018** [P] Workouts Contract: 批次同步 - `api/tests/contract/test_workouts_sync.py`
- [X] **T019** [P] Workouts Contract: CSV 匯入匯出 - `api/tests/contract/test_workouts_io.py`
- [X] **T020** [P] Achievements Contract: 成就檢查 - `api/tests/contract/test_achievements_check.py`
- [X] **T021** [P] Achievements Contract: 分享卡片生成 - `api/tests/contract/test_achievements_share.py`
- [X] **T022** [P] Dashboards Contract: Widget CRUD - `api/tests/contract/test_dashboards_widgets.py`
- [X] **T023** [P] Dashboards Contract: 拖拉排序 - `api/tests/contract/test_dashboards_reorder.py`
- [X] **T024** [P] Timeline Contract: 時間軸查詢 - `api/tests/contract/test_timeline_query.py`
- [X] **T025** [P] Timeline Contract: 年度回顧生成 - `api/tests/contract/test_timeline_review.py`

### Backend Unit Tests (Models & Services)

- [X] **T026** [P] User Model 驗證測試 - `api/tests/unit/test_user_model.py`
- [X] **T027** [P] Workout Model 驗證測試 - `api/tests/unit/test_workout_model.py`
- [X] **T028** [P] Achievement Model 驗證測試 - `api/tests/unit/test_achievement_model.py`
- [X] **T029** [P] Dashboard Model 驗證測試 - `api/tests/unit/test_dashboard_model.py`
- [X] **T030** [P] Auth Service 邏輯測試 - `api/tests/unit/test_auth_service.py`
- [X] **T031** [P] Workout Service 邏輯測試 - `api/tests/unit/test_workout_service.py`
- [X] **T032** [P] Achievement Service 邏輯測試 - `api/tests/unit/test_achievement_service.py`

### Mobile Component Tests

- [X] **T033** [P] 基礎 Button 元件測試 - `app/__tests__/unit/components/ui/Button.test.tsx`
- [X] **T034** [P] 基礎 Card 元件測試 - `app/__tests__/unit/components/ui/Card.test.tsx`
- [X] **T035** [P] 基礎 Input 元件測試 - `app/__tests__/unit/components/ui/Input.test.tsx`
- [X] **T036** [P] 慶祝動畫元件測試 - `app/__tests__/unit/components/animations/CelebrationAnimation.test.tsx`
- [X] **T037** [P] Widget 元件測試 (ProgressWidget) - `app/__tests__/unit/components/widgets/ProgressWidget.test.tsx`
- [X] **T038** [P] Widget 元件測試 (ChartWidget) - `app/__tests__/unit/components/widgets/ChartWidget.test.tsx`

### Integration Tests (基於 quickstart.md 場景)

- [X] **T039** [P] 場景 1: 小美首次運動與慶祝 - `api/tests/integration/test_scenario_beginner.py`
- [X] **T040** [P] 場景 2: 大衛客製化儀表板 - `api/tests/integration/test_scenario_advanced.py`
- [X] **T041** [P] 場景 3: 艾莉年度回顧 - `api/tests/integration/test_scenario_longterm.py`

**Dependencies**: Setup (T001-T012) → Tests (T013-T041)

---

## Phase 3.3: Backend Implementation (5-7 天)

**⚠️ 只有在 Phase 3.2 測試全部失敗後才能開始**

### Core Configuration & Database

- [X] **T042** Backend Core: 環境配置 - `api/src/core/config.py`
- [X] **T043** Backend Core: MongoDB 連接 - `api/src/core/database.py`
- [X] **T044** Backend Core: Firebase Auth 初始化 - `api/src/core/security.py`
- [X] **T045** Backend Core: 依賴注入 - `api/src/core/deps.py`
- [X] **T046** Backend Core: CORS & Middleware - `api/src/main.py`

### MongoDB Models (7 個 Collections)

- [X] **T047** [P] User Model - `api/src/models/user.py`
- [X] **T048** [P] Workout Model - `api/src/models/workout.py`
- [X] **T049** [P] Achievement Model - `api/src/models/achievement.py`
- [X] **T050** [P] Dashboard Model - `api/src/models/dashboard.py`
- [X] **T051** [P] Milestone Model - `api/src/models/milestone.py`
- [X] **T052** [P] Annual Review Model - `api/src/models/annual_review.py`
- [X] **T053** [P] Share Card Model - `api/src/models/share_card.py`

### Database Indexes (18 個索引)

- [X] **T054** Users Collection 索引設定 - `api/src/models/user.py` (firebase_uid, email)
- [X] **T055** Workouts Collection 索引設定 - `api/src/models/workout.py` (user_id+date, type+date, user_id+sync_status)
- [X] **T056** Achievements Collection 索引設定 - `api/src/models/achievement.py` (user_id+achieved_at, type)
- [X] **T057** Dashboards Collection 索引設定 - `api/src/models/dashboard.py` (user_id)
- [X] **T058** Milestones Collection 索引設定 - `api/src/models/milestone.py` (user_id+date)
- [X] **T059** Annual Reviews Collection 索引設定 - `api/src/models/annual_review.py` (user_id+year)
- [X] **T060** Share Cards Collection 索引設定 - `api/src/models/share_card.py` (user_id+created_at)

### Service Layer (Business Logic)

- [X] **T061** Auth Service: Firebase Token 驗證 - `api/src/services/auth_service.py`
- [X] **T062** Auth Service: 使用者註冊與登入 - `api/src/services/auth_service.py`
- [X] **T063** Workout Service: CRUD 操作 - `api/src/services/workout_service.py`
- [X] **T064** Workout Service: 批次同步邏輯 - `api/src/services/workout_service.py`
- [X] **T065** Workout Service: CSV 匯入匯出 - `api/src/services/workout_service.py`
- [X] **T066** Achievement Service: 成就檢查引擎 - `api/src/services/achievement_service.py`
- [X] **T067** Achievement Service: 慶祝等級判定 - `api/src/services/achievement_service.py`
- [X] **T068** Achievement Service: 分享卡片生成 (R2 上傳) - `api/src/services/achievement_service.py`
- [X] **T069** Dashboard Service: Widget CRUD - `api/src/services/dashboard_service.py`
- [X] **T070** Dashboard Service: 拖拉排序邏輯 - `api/src/services/dashboard_service.py`
- [X] **T071** Timeline Service: 時間軸查詢 (虛擬滾動) - `api/src/services/timeline_service.py`
- [X] **T072** Timeline Service: 年度回顧統計 (Aggregation Pipeline) - `api/src/services/timeline_service.py`
- [X] **T073** Timeline Service: 年度回顧網頁生成 - `api/src/services/timeline_service.py`

### API Routers (FastAPI Endpoints)

- [X] **T074** Auth Router: POST /auth/register - `api/src/routers/auth.py`
- [X] **T075** Auth Router: POST /auth/login - `api/src/routers/auth.py`
- [X] **T076** Auth Router: POST /auth/refresh - `api/src/routers/auth.py`
- [X] **T077** Auth Router: GET /auth/me - `api/src/routers/auth.py`
- [X] **T078** Workouts Router: POST /workouts - `api/src/routers/workouts.py`
- [X] **T079** Workouts Router: GET /workouts - `api/src/routers/workouts.py`
- [X] **T080** Workouts Router: GET /workouts/{id} - `api/src/routers/workouts.py`
- [X] **T081** Workouts Router: PUT /workouts/{id} - `api/src/routers/workouts.py`
- [X] **T082** Workouts Router: DELETE /workouts/{id} - `api/src/routers/workouts.py`
- [X] **T083** Workouts Router: POST /workouts/sync - `api/src/routers/workouts.py`
- [X] **T084** Workouts Router: POST /workouts/import - `api/src/routers/workouts.py`
- [X] **T085** Workouts Router: GET /workouts/export - `api/src/routers/workouts.py`
- [X] **T086** Achievements Router: GET /achievements - `api/src/routers/achievements.py`
- [X] **T087** Achievements Router: POST /achievements/check - `api/src/routers/achievements.py`
- [X] **T088** Achievements Router: POST /achievements/{id}/share - `api/src/routers/achievements.py`
- [X] **T089** Dashboards Router: GET /dashboards - `api/src/routers/dashboards.py`
- [X] **T090** Dashboards Router: POST /dashboards/widgets - `api/src/routers/dashboards.py`
- [X] **T091** Dashboards Router: PUT /dashboards/widgets/{id} - `api/src/routers/dashboards.py`
- [X] **T092** Dashboards Router: DELETE /dashboards/widgets/{id} - `api/src/routers/dashboards.py`
- [X] **T093** Dashboards Router: POST /dashboards/reorder - `api/src/routers/dashboards.py`
- [X] **T094** Timeline Router: GET /timeline - `api/src/routers/timeline.py`
- [X] **T095** Timeline Router: GET /timeline/milestones - `api/src/routers/timeline.py`
- [X] **T096** Timeline Router: POST /timeline/annual-review - `api/src/routers/timeline.py`
- [X] **T097** Timeline Router: GET /timeline/annual-review/{year} - `api/src/routers/timeline.py`

### External Integrations

- [X] **T098** Cloudflare R2 檔案上傳 Helper - `api/src/utils/r2_storage.py`
- [X] **T099** Firebase Admin SDK Token 驗證 - `api/src/utils/firebase_auth.py`
- [X] **T100** 錯誤處理 & Logging Middleware - `api/src/core/middleware.py`

**Dependencies**:
- Tests (T013-T041) → Core (T042-T046) → Models (T047-T060) → Services (T061-T073) → Routers (T074-T097) → Integrations (T098-T100)

---

## Phase 3.4: Mobile Implementation (7-10 天)

**⚠️ 只有在 Backend API (T042-T100) 完成後才能開始整合**

### TypeScript Types (基於 data-model.md)

- [X] **T101** [P] User Types - `app/src/types/user.ts`
- [X] **T102** [P] Workout Types - `app/src/types/workout.ts`
- [X] **T103** [P] Achievement Types - `app/src/types/achievement.ts`
- [X] **T104** [P] Dashboard & Widget Types - `app/src/types/dashboard.ts`
- [X] **T105** [P] Timeline Types - `app/src/types/timeline.ts`

### API Client (FastAPI 串接)

- [X] **T106** API Client 基礎設定 - `app/src/services/api/client.ts` (axios, interceptors)
- [X] **T107** Auth API Service - `app/src/services/api/auth.ts`
- [X] **T108** Workouts API Service - `app/src/services/api/workouts.ts`
- [X] **T109** Achievements API Service - `app/src/services/api/achievements.ts`
- [X] **T110** Dashboards API Service - `app/src/services/api/dashboards.ts`
- [X] **T111** Timeline API Service - `app/src/services/api/timeline.ts`

### Local Storage (Expo SQLite)

- [X] **T112** SQLite 初始化 - `app/src/services/storage/database.ts`
- [X] **T113** Workouts 本地 Schema - `app/src/services/storage/workouts.ts`
- [X] **T114** 同步狀態管理 - `app/src/services/storage/sync.ts`

### Offline Sync Logic

- [X] **T115** 離線佇列邏輯 - `app/src/services/sync/queue.ts`
- [X] **T116** 衝突解決策略 - `app/src/services/sync/conflict.ts`
- [X] **T117** 網路狀態監聽 - `app/src/services/sync/network.ts`

### Zustand State Management

- [X] **T118** Auth Store - `app/src/store/auth.ts` (登入狀態、Token 管理)
- [X] **T119** Workout Store - `app/src/store/workout.ts` (運動記錄、同步狀態)
- [X] **T120** Dashboard Store - `app/src/store/dashboard.ts` (Widget 配置、拖拉狀態)
- [X] **T121** Achievement Store - `app/src/store/achievement.ts` (成就清單、慶祝觸發)

### UI Components - 基礎元件

- [X] **T122** [P] Button 元件 - `app/src/components/ui/Button.tsx`
- [X] **T123** [P] Card 元件 - `app/src/components/ui/Card.tsx`
- [X] **T124** [P] Input 元件 - `app/src/components/ui/Input.tsx`
- [X] **T125** [P] Loading 元件 - `app/src/components/ui/Loading.tsx`

### UI Components - 慶祝動畫 (Reanimated 3)

- [X] **T126** [P] 基礎慶祝動畫 - `app/src/components/animations/BasicCelebration.tsx`
- [X] **T127** [P] 煙火慶祝動畫 - `app/src/components/animations/FireworksCelebration.tsx`
- [X] **T128** [P] 史詩級慶祝動畫 - `app/src/components/animations/EpicCelebration.tsx`
- [X] **T129** 慶祝動畫觸發邏輯 - `app/src/components/animations/CelebrationTrigger.tsx`

### UI Components - Dashboard Widgets (12 種 Widget)

- [X] **T130** [P] 進度條 Widget - `app/src/components/widgets/ProgressWidget.tsx`
- [X] **T131** [P] 折線圖 Widget - `app/src/components/widgets/LineChartWidget.tsx`
- [X] **T132** [P] 長條圖 Widget - `app/src/components/widgets/BarChartWidget.tsx`
- [X] **T133** [P] 圓餅圖 Widget - `app/src/components/widgets/PieChartWidget.tsx`
- [X] **T134** [P] 數字卡片 Widget - `app/src/components/widgets/StatCardWidget.tsx`
- [X] **T135** [P] 熱力圖 Widget - `app/src/components/widgets/HeatmapWidget.tsx`
- [X] **T136** [P] 目標追蹤 Widget - `app/src/components/widgets/GoalWidget.tsx`
- [X] **T137** [P] 連續天數 Widget - `app/src/components/widgets/StreakWidget.tsx`
- [X] **T138** [P] 排行榜 Widget - `app/src/components/widgets/LeaderboardWidget.tsx`
- [X] **T139** [P] 月曆 Widget - `app/src/components/widgets/CalendarWidget.tsx`
- [X] **T140** [P] 快速統計 Widget - `app/src/components/widgets/QuickStatsWidget.tsx`
- [X] **T141** [P] 配速圖表 Widget - `app/src/components/widgets/PaceChartWidget.tsx`

### UI Components - Charts (Victory Native)

- [X] **T142** [P] 折線圖元件 - `app/src/components/charts/LineChart.tsx`
- [X] **T143** [P] 長條圖元件 - `app/src/components/charts/BarChart.tsx`
- [X] **T144** [P] 圓餅圖元件 - `app/src/components/charts/PieChart.tsx`

### Main Screens - Authentication

- [X] **T145** 登入畫面 - `app/src/screens/auth/LoginScreen.tsx`
- [X] **T146** 註冊畫面 - `app/src/screens/auth/RegisterScreen.tsx`
- [X] **T147** Google OAuth 整合 - `app/src/screens/auth/GoogleSignIn.tsx`

### Main Screens - Workout

- [X] **T148** 運動記錄畫面 - `app/src/screens/workout/CreateWorkoutScreen.tsx`
- [X] **T149** 運動歷史清單 - `app/src/screens/workout/WorkoutListScreen.tsx`
- [X] **T150** 運動詳細資訊 - `app/src/screens/workout/WorkoutDetailScreen.tsx`
- [X] **T151** CSV 匯入畫面 - `app/src/screens/workout/ImportScreen.tsx`

### Main Screens - Dashboard

- [X] **T152** 儀表板工作室 - `app/src/screens/dashboard/DashboardStudioScreen.tsx`
- [X] **T153** Widget 選擇器 - `app/src/screens/dashboard/WidgetPickerScreen.tsx`
- [X] **T154** 拖拉排序互動 (React Native Gesture Handler) - `app/src/screens/dashboard/DragDropHandler.tsx`

### Main Screens - Timeline

- [X] **T155** 時間軸畫面 (虛擬滾動) - `app/src/screens/timeline/TimelineScreen.tsx`
- [X] **T156** 里程碑標記 - `app/src/screens/timeline/MilestoneMarker.tsx`
- [X] **T157** 年度回顧畫面 - `app/src/screens/timeline/AnnualReviewScreen.tsx`

### Main Screens - Profile

- [X] **T158** 個人設定畫面 - `app/src/screens/profile/ProfileScreen.tsx`
- [X] **T159** 隱私設定 - `app/src/screens/profile/PrivacySettingsScreen.tsx`
- [X] **T160** 資料匯出畫面 - `app/src/screens/profile/ExportScreen.tsx`

### Navigation

- [X] **T161** React Navigation 設定 - `app/src/navigation/index.tsx`
- [X] **T162** Auth Navigator - `app/src/navigation/AuthNavigator.tsx`
- [X] **T163** Main Tab Navigator - `app/src/navigation/MainNavigator.tsx`

**Dependencies**:
- Types (T101-T105) → API Client (T106-T111), Storage (T112-T114), Stores (T118-T121)
- Stores (T118-T121) → Screens (T145-T160)
- UI Components (T122-T144) → Screens (T145-T160)
- Screens (T145-T160) → Navigation (T161-T163)

---

## Phase 3.5: Integration & Polish (3-5 天)

### E2E Tests (Detox - 基於 quickstart.md)

- [X] **T164** [P] Detox 環境設定 - `app/__tests__/e2e/setup.ts`
- [X] **T165** [P] E2E: 小美場景 (首次運動與慶祝) - `app/__tests__/e2e/beginner.e2e.ts`
- [X] **T166** [P] E2E: 大衛場景 (客製化儀表板) - `app/__tests__/e2e/advanced.e2e.ts`
- [X] **T167** [P] E2E: 艾莉場景 (年度回顧) - `app/__tests__/e2e/longterm.e2e.ts`

### Performance Optimization

- [X] **T168** Backend: API 回應時間優化 (目標 P95 < 200ms) - `api/src/core/performance.py`
- [X] **T169** Mobile: 虛擬滾動優化 (FlatList) - `app/src/screens/timeline/TimelineScreen.tsx`
- [X] **T170** Mobile: 圖片壓縮與快取 - `app/src/utils/imageOptimization.ts`
- [X] **T171** Mobile: 慶祝動畫 60 FPS 驗證 - `app/src/components/animations/__performance__/fps.test.ts`
- [X] **T172** Backend: 年度回顧生成效能 (< 3 秒) - `api/src/services/timeline_service.py`

### Error Handling & Logging

- [X] **T173** Backend: 統一錯誤處理 - `api/src/core/errors.py`
- [X] **T174** Backend: 請求日誌 Middleware - `api/src/core/logging.py`
- [X] **T175** Mobile: 錯誤邊界元件 - `app/src/components/ErrorBoundary.tsx`
- [X] **T176** Mobile: 離線錯誤處理 - `app/src/services/sync/errorHandler.ts`

### Deployment Configuration

- [X] **T177** Backend: Render 部署配置 - `api/render.yaml`
- [X] **T178** Backend: Docker 優化 (Multi-stage build) - `api/Dockerfile`
- [X] **T179** MongoDB Atlas: 索引建立腳本 - `api/scripts/create_indexes.py`
- [X] **T180** Mobile: Expo EAS Build 配置 - `app/eas.json`

**Dependencies**:
- All Previous Phases (T001-T163) → Integration (T164-T180)

---

## Dependencies Summary

```
Setup (T001-T012)
  ↓
Tests (T013-T041) [Must FAIL before implementation]
  ↓
Backend Core (T042-T046)
  ↓
Backend Models (T047-T060)
  ↓
Backend Services (T061-T073)
  ↓
Backend Routers (T074-T097)
  ↓
Backend Integrations (T098-T100)
  ↓
Mobile Types (T101-T105)
  ↓
Mobile Services (T106-T121) [Parallel: API + Storage + Stores]
  ↓
Mobile UI Components (T122-T144)
  ↓
Mobile Screens (T145-T160)
  ↓
Mobile Navigation (T161-T163)
  ↓
E2E Tests & Polish (T164-T180)
```

---

## Parallel Execution Examples

### 範例 1: Setup Phase (所有任務可平行)

```bash
# 同時建立 Backend 與 Mobile 專案結構
Task: "建立 Backend 專案結構 api/ 目錄與子目錄"
Task: "建立 Mobile 專案結構 app/ 目錄與子目錄"
Task: "Backend: 初始化 Python 專案"
Task: "Mobile: 初始化 Expo 專案"
```

### 範例 2: Contract Tests (13 個測試可平行)

```bash
# 同時寫所有 Contract Tests (必須在實作前完成)
Task: "Auth Contract: 註冊端點 - api/tests/contract/test_auth_register.py"
Task: "Auth Contract: 登入端點 - api/tests/contract/test_auth_login.py"
Task: "Workouts Contract: 建立運動記錄 - api/tests/contract/test_workouts_create.py"
Task: "Achievements Contract: 成就檢查 - api/tests/contract/test_achievements_check.py"
Task: "Dashboards Contract: Widget CRUD - api/tests/contract/test_dashboards_widgets.py"
Task: "Timeline Contract: 年度回顧生成 - api/tests/contract/test_timeline_review.py"
# ... 共 13 個 Contract Tests
```

### 範例 3: MongoDB Models (7 個 Models 可平行)

```bash
# 所有 Models 獨立檔案，可平行實作
Task: "User Model - api/src/models/user.py"
Task: "Workout Model - api/src/models/workout.py"
Task: "Achievement Model - api/src/models/achievement.py"
Task: "Dashboard Model - api/src/models/dashboard.py"
Task: "Milestone Model - api/src/models/milestone.py"
Task: "Annual Review Model - api/src/models/annual_review.py"
Task: "Share Card Model - api/src/models/share_card.py"
```

### 範例 4: Widget Components (12 個 Widgets 可平行)

```bash
# 所有 Widget 元件獨立，可同時開發
Task: "進度條 Widget - app/src/components/widgets/ProgressWidget.tsx"
Task: "折線圖 Widget - app/src/components/widgets/LineChartWidget.tsx"
Task: "長條圖 Widget - app/src/components/widgets/BarChartWidget.tsx"
Task: "圓餅圖 Widget - app/src/components/widgets/PieChartWidget.tsx"
Task: "數字卡片 Widget - app/src/components/widgets/StatCardWidget.tsx"
# ... 共 12 個 Widget Components
```

### 範例 5: E2E Tests (3 個場景可平行)

```bash
# 所有 E2E 測試場景獨立，可同時執行
Task: "E2E: 小美場景 (首次運動與慶祝) - app/__tests__/e2e/beginner.e2e.ts"
Task: "E2E: 大衛場景 (客製化儀表板) - app/__tests__/e2e/advanced.e2e.ts"
Task: "E2E: 艾莉場景 (年度回顧) - app/__tests__/e2e/longterm.e2e.ts"
```

---

## Validation Checklist

**GATE: 檢查清單 (生成任務時已驗證)**

- [x] 所有 contracts/ 契約檔案都有對應測試任務 (T013-T025, 共 13 個)
- [x] 所有 data-model.md entities 都有 model 任務 (T047-T053, 共 7 個)
- [x] 所有測試任務在實作任務之前 (T013-T041 → T042-T180)
- [x] 平行任務 [P] 確實獨立 (不同檔案、無依賴)
- [x] 每個任務都指定確切檔案路徑
- [x] 沒有任務修改與其他 [P] 任務相同的檔案

---

## Notes

- **[P] 標記**: 表示可平行執行（不同檔案、無依賴關係）
- **TDD 流程**: Phase 3.2 測試必須全部失敗後，才能進入 Phase 3.3/3.4 實作
- **Commit 策略**: 每完成一個任務就 commit，保持版本歷史清晰
- **效能驗證**: T168-T172 確保符合憲章要求 (API < 200ms, 動畫 60 FPS, 回顧 < 3 秒)
- **免費方案優化**: 注意 MongoDB 512MB、Render 512MB RAM、R2 10GB 限制
- **離線優先**: T112-T117 實作本地儲存與同步機制，確保離線可用

---

**Based on**:
- Constitution v1.0.0 (TDD NON-NEGOTIABLE)
- plan.md (Technical Context & Project Structure)
- data-model.md (7 Collections, 18 Indexes)
- contracts/ (5 API Contract Files)
- quickstart.md (3 User Scenarios)
