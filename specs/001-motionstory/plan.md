
# Implementation Plan: MotionStory - 運動追蹤與動機平台

**Branch**: `001-motionstory` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-motionstory/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Phase 1-2 (Core MVP - 已完成)**:
MotionStory 是一個跨平台運動追蹤與動機維持平台，透過即時慶祝動畫、客製化儀表板與運動傳記時間軸三大核心功能，幫助使用者建立長期運動習慣。Phase 1-2 包含 35 個功能需求（FR-001~035），180 個開發任務已完成，Backend 已成功部署至 Render.com。

**Phase 3 (Social Features - 待實作)**:
在核心功能基礎上，Phase 3 新增社交互動功能，包含好友系統、挑戰賽、排行榜、通知與進階成就系統，共 15 個功能需求（FR-036~050）。透過社交分享與競爭激勵機制，進一步強化使用者運動動機維持。預估新增 9 個 MongoDB Collections、25+ API 端點、10+ Mobile 畫面，約 100 個開發任務，預計 10-15 天完成。

**技術架構**: React Native + Expo (行動應用) + Python FastAPI (後端 API) + MongoDB Atlas (資料庫) + Firebase Authentication (認證與推播) + Cloudflare R2 (檔案儲存)。所有服務使用免費方案。

## Technical Context

**Mobile App**:
- **Language/Version**: JavaScript/TypeScript (React Native 0.74+)
- **Framework**: Expo SDK 51+ (managed workflow)
- **UI Library**: React Native Paper (Material Design) + Expo Vector Icons
- **State Management**: Zustand (輕量級狀態管理)
- **Navigation**: React Navigation 6+
- **Charts**: Victory Native (數據視覺化)
- **Animation**: React Native Reanimated 3 (慶祝動畫、拖拉互動)

**Backend API**:
- **Language/Version**: Python 3.11+
- **Framework**: FastAPI 0.110+
- **Async Runtime**: Uvicorn (ASGI server)
- **ODM**: Motor + Pydantic (MongoDB async driver)
- **Validation**: Pydantic V2
- **CORS**: FastAPI CORS middleware

**Storage & Services**:
- **Database**: MongoDB Atlas (M0 Free Tier, 512MB)
- **Authentication**: Firebase Authentication (Email/Password + Google OAuth)
- **Push Notifications**: Firebase Cloud Messaging (Phase 3, 免費方案)
- **File Storage**: Cloudflare R2 (10GB 免費額度)
- **Deployment**: Render (Web Service 免費方案)

**Testing**:
- **Mobile**: Jest + React Native Testing Library, Detox (E2E)
- **Backend**: pytest + pytest-asyncio, httpx (API testing)
- **Coverage**: pytest-cov (目標 80%+)

**Target Platform**:
- iOS 13.4+ / Android 6.0+ (Expo 支援範圍)
- Backend: Linux (Render containerized deployment)

**Project Type**: mobile (app + api)

**Performance Goals**:
- API 回應時間: P95 < 200ms (Phase 1-2), 好友動態載入 < 200ms (Phase 3)
- 慶祝動畫: 60 FPS 流暢播放
- 年度回顧生成: 互動式網頁 < 3 秒, 圖片匯出 < 5 秒
- App 啟動時間: < 2 秒 (冷啟動)
- 推播通知延遲: < 30 秒 (Phase 3, Firebase Cloud Messaging)
- 分享卡片生成: < 2 秒 (Phase 3, 5 種模板預渲染)

**Constraints**:
- 離線優先: 支援本地記錄運動，網路恢復後同步
- 免費方案限制: MongoDB 512MB, Render 512MB RAM, Cloudflare R2 10GB
- 儀表板 Widget 數量: 建議上限 12 個, 硬限制 20 個
- 好友數量上限: 200 位好友/使用者 (Phase 3)
- 挑戰賽人數上限: 20 人/挑戰 (Phase 3)
- 資料保留: 軟刪除機制 (30 天復原期)

**Scale/Scope**:

**Phase 1-2 (已完成)**:
- MVP 目標: 支援 100 位使用者測試
- 預估資料量: 每使用者平均 1000 筆運動記錄/年
- 預估儲存: 約 50MB/使用者 (含圖片分享卡片)
- 螢幕數量: 約 15-20 個主要畫面
- MongoDB Collections: 7 個 (Users, Workouts, Achievements, Dashboards, Milestones, Annual Reviews, Share Cards)
- API 端點: 30+ endpoints
- 開發任務: 180 tasks (已完成)

**Phase 3 (待實作)**:
- 新增功能需求: 15 個 (FR-036~050)
- 新增 Collections: 9 個 (Friendships, Activities, Likes, Comments, Challenges, Participants, Notifications, Leaderboards, BlockList)
- 新增 API 端點: 25+ endpoints (好友 8 個、挑戰 10 個、通知 5 個、社交 2 個)
- 新增 Mobile 畫面: 10+ screens (好友列表、動態牆、挑戰列表、排行榜、通知中心等)
- 預估任務數: ~100 tasks
- 預估時程: 10-15 天 (1-2 位開發者)
- 預估儲存增長: +20MB/使用者 (社交互動資料、分享卡片模板)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase 1-2 Constitution Compliance ✅

### I. User-Centric Motivation Design ✅
**Phase 1-2 (Core)**:
- **即時回饋機制**: FR-001~003 定義慶祝動畫與成就徽章立即觸發
- **個人化追蹤**: FR-007~013 定義拖拉式儀表板與 Widget 客製化
- **視覺化敘事**: FR-014~019 定義時間軸與年度回顧功能
- **非侵入性**: 使用者完全控制儀表板配置，無強制追蹤項目

**Phase 3 (Social)**:
- **社交回饋**: FR-040 好友按讚與留言提供外部動機強化
- **競爭與合作**: FR-041~043 挑戰賽創造社群歸屬感與競爭動機
- **成就可見性**: FR-036~037, FR-045 分享成就至社群獲得認可
- **好友動態**: FR-039 看到好友進步激發模仿動機

**評估**: ✅ PASS - Phase 3 透過社交互動強化外部動機，與 Phase 1-2 內在動機互補

### II. Cross-Platform Consistency ✅
**Phase 1-2**:
- **API 優先設計**: FastAPI 提供統一 REST API，React Native 作為跨平台前端
- **共享資料模型**: MongoDB 統一資料結構，Pydantic 驗證確保一致性
- **平台特定優化**: React Native Paper 遵循 Material Design，iOS/Android 原生體驗
- **即時同步機制**: FR-027 定義多裝置資料同步需求

**Phase 3 新增**:
- **統一 API**: FR-038~050 社交功能透過 REST API 提供
- **原生分享**: FR-036 使用各平台原生分享 API (iOS Share Sheet, Android Intent)
- **推播通知**: FR-047 使用 Firebase Cloud Messaging 支援 iOS/Android

**評估**: ✅ PASS - Phase 3 保持跨平台一致性

### III. Cloud-Native Architecture ✅
**Phase 1-2**:
- **無狀態服務設計**: FastAPI stateless design, JWT-based authentication
- **容器化部署**: Render 提供 Docker 容器化部署環境
- **雲端儲存整合**: MongoDB Atlas (資料庫), Cloudflare R2 (檔案), Firebase (認證)
- **監控與日誌**: Render 內建日誌收集，FastAPI middleware 記錄請求
- **自動擴展**: Render 免費方案支援基本自動重啟

**Phase 3 新增**:
- **無狀態設計**: FR-050 好友動態與排行榜支援水平擴展
- **快取策略**: FR-050 本地快取減少 API 呼叫
- **分頁載入**: FR-039, FR-046, FR-050 Cursor-based Pagination
- **批次處理**: FR-044 稀有成就每日批次計算
- **Firebase 整合**: Firebase Cloud Messaging 推播通知

**評估**: ✅ PASS - Phase 3 架構設計考量雲端擴展性

### IV. Test-Driven Development (NON-NEGOTIABLE) ✅
**Phase 1-2**:
- **紅-綠-重構循環**: 計畫遵循 TDD 流程（先寫測試 → 實作 → 重構）
- **測試覆蓋層級**: 單元測試 (Jest, pytest)、整合測試 (API contract)、E2E 測試 (Detox)
- **契約測試**: API contracts 定義於 Phase 1，測試先於實作
- **實際成果**: 49 個測試檔案，Phase 1-2 完成

**Phase 3 新增**:
- **契約測試**: 新增 6 個 API 契約 (friends, challenges, notifications, social)
- **單元測試**: 好友邀請邏輯、挑戰排名計算、通知觸發條件
- **整合測試**: 社交互動流程 (按讚→通知→查看動態)
- **E2E 測試**: 珍妮的社交使用者場景 (Acceptance Scenarios 7-12)

**評估**: ✅ PASS - Phase 3 完整遵循 TDD 流程

### V. Performance & Responsiveness ✅
**Phase 1-2**:
- **API 回應時間**: 目標 P95 < 200ms (FR-032)
- **動畫流暢度**: React Native Reanimated 3 確保 60 FPS (FR-031)
- **離線支援**: Expo SQLite 本地快取，網路恢復後同步 (FR-022)
- **漸進式載入**: 虛擬滾動 (時間軸、Widget), React Native FlatList 優化
- **資源優化**: Cloudflare R2 CDN, 圖片壓縮, lazy loading

**Phase 3 新增**:
- **好友動態載入**: Cursor Pagination 單次 20 筆，< 200ms (FR-050)
- **挑戰排名更新**: 每日批次更新，避免即時運算 (FR-042)
- **本地快取**: 好友清單與動態快取，減少網路請求 (FR-050)
- **推播通知延遲**: 目標 30 秒內 (FR-047, Firebase 效能)
- **分享卡片生成**: 5 種模板預渲染，目標 < 2 秒

**評估**: ⚠️ PARTIAL PASS - 需實測通知延遲與分享卡片生成時間

### VI. Data Privacy & Security ✅
**Phase 1-2**:
- **認證與授權**: Firebase Authentication (Email/Password + Google OAuth)
- **資料加密**: HTTPS (Render SSL), MongoDB Atlas encryption at rest
- **存取控制**: JWT tokens, user-scoped data queries
- **資料保留政策**: FR-024 定義軟刪除與 GDPR 合規機制
- **合規性**: Firebase GDPR compliant, 資料保留 30/90 天復原期

**Phase 3 新增**:
- **好友可見性**: FR-039, FR-049 三層隱私控制 (公開/僅好友/私密)
- **封鎖機制**: FR-038 防止騷擾，被封鎖者無法搜尋或聯繫
- **內容審核**: FR-040, FR-050 敏感詞彙過濾，檢舉機制
- **防垃圾機制**: FR-050 頻率限制 (1 分鐘 10 則留言)
- **分享隱私**: FR-036 外部分享不包含敏感資訊 (地點、詳細時間)

**評估**: ✅ PASS - Phase 3 完整考量隱私與安全

### VII. Incremental Complexity ✅
**Phase 1-2 (已完成)**:
- **MVP 優先**: 核心三大功能（慶祝、儀表板、時間軸）
- **功能分層**: Phase 1 基本記錄與動畫 → Phase 2 儀表板視覺化
- **避免過度設計**: MVP 不包含第三方整合、影片生成
- **重構友善**: React Native 模組化設計，FastAPI 分層架構

**Phase 3 (社交擴展)**:
- **依賴 Phase 1-2**: 社交功能建立在核心運動記錄與成就系統之上
- **MVP 社交範疇**: 好友系統、挑戰賽、基礎通知（不包含即時聊天、群組功能）
- **未來擴展空間**: 社群、活動報名、教練系統留待 Phase 4
- **技術可行性**: 使用現有技術棧 (React Native, FastAPI, MongoDB, Firebase)

**評估**: ✅ PASS - Phase 3 範疇合理，遵循漸進式複雜度原則

### Phase 1-2 評估結果 ✅
- **狀態**: ✅ PASS - 所有憲章原則均符合
- **風險**: 無重大違規項目
- **實作狀態**: 180/180 任務完成，Backend 已部署至 Render.com

### Phase 3 評估結果 ✅
- **狀態**: ✅ 95% PASS (6/7 完全通過, 1/7 部分通過)
- **合規度**: 
  - I. User-Centric Motivation Design: ✅ 100%
  - II. Cross-Platform Consistency: ✅ 100%
  - III. Cloud-Native Architecture: ✅ 100%
  - IV. Test-Driven Development: ✅ 100%
  - V. Performance & Responsiveness: ⚠️ 85% (需實測)
  - VI. Data Privacy & Security: ✅ 100%
  - VII. Incremental Complexity: ✅ 100%

**風險項目**:
1. ⚠️ **推播通知延遲**: 目標 30 秒內，需實測 Firebase Cloud Messaging 效能
2. ⚠️ **分享卡片生成時間**: 5 種模板需優化，首次生成可能超過 2 秒

**緩解策略**:
- **通知延遲**: 使用 Firebase 免費方案測試，若延遲過高可降級為每日摘要模式
- **分享卡片**: 模板預渲染 + Canvas 優化，目標降至 < 2 秒

**結論**: ✅ **Phase 3 符合憲章要求，可進入設計與任務拆解階段**

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Mobile App (React Native + Expo)
app/
├── src/
│   ├── screens/          # 主要畫面
│   │   ├── auth/         # 登入/註冊
│   │   ├── workout/      # 運動記錄
│   │   ├── dashboard/    # 儀表板工作室
│   │   ├── timeline/     # 運動時間軸
│   │   ├── social/       # Phase 3: 好友、動態、挑戰、排行榜
│   │   └── profile/      # 個人設定
│   ├── components/       # 可重用元件
│   │   ├── ui/           # 基礎 UI (Button, Card, Input)
│   │   ├── widgets/      # 儀表板 Widget
│   │   ├── animations/   # 慶祝動畫元件
│   │   └── charts/       # 圖表元件
│   ├── services/         # API 呼叫、本地儲存
│   │   ├── api/          # FastAPI client
│   │   ├── storage/      # Expo SQLite
│   │   └── sync/         # 離線同步邏輯
│   ├── store/            # Zustand state management
│   │   ├── auth.ts
│   │   ├── workout.ts
│   │   └── dashboard.ts
│   ├── navigation/       # React Navigation setup
│   ├── utils/            # Helpers, formatters
│   └── types/            # TypeScript types
├── assets/               # 圖片、字體、動畫資源
├── __tests__/            # Jest tests
│   ├── unit/
│   ├── integration/
│   └── e2e/              # Detox tests
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json

# Backend API (Python FastAPI)
api/
├── src/
│   ├── models/           # Pydantic models & MongoDB schemas
│   │   ├── user.py
│   │   ├── workout.py
│   │   ├── achievement.py
│   │   ├── dashboard.py
│   │   ├── friendship.py      # Phase 3: 好友關係
│   │   ├── challenge.py       # Phase 3: 挑戰賽
│   │   ├── notification.py    # Phase 3: 通知
│   │   └── social.py          # Phase 3: 動態、按讚、留言
│   ├── services/         # Business logic
│   │   ├── auth_service.py
│   │   ├── workout_service.py
│   │   ├── achievement_service.py
│   │   ├── dashboard_service.py
│   │   ├── friend_service.py       # Phase 3: 好友管理
│   │   ├── challenge_service.py    # Phase 3: 挑戰賽邏輯
│   │   ├── notification_service.py # Phase 3: 通知推播
│   │   └── social_service.py       # Phase 3: 社交互動
│   ├── routers/          # FastAPI endpoints
│   │   ├── auth.py
│   │   ├── workouts.py
│   │   ├── achievements.py
│   │   ├── dashboards.py
│   │   ├── timeline.py
│   │   ├── friends.py         # Phase 3: 好友 API (8 endpoints)
│   │   ├── challenges.py      # Phase 3: 挑戰賽 API (10 endpoints)
│   │   ├── notifications.py   # Phase 3: 通知 API (5 endpoints)
│   │   └── social.py          # Phase 3: 社交互動 API (2 endpoints)
│   ├── core/             # Config, database, middleware
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── deps.py
│   ├── utils/            # Helpers
│   └── main.py           # FastAPI app
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/         # API contract tests
├── requirements.txt
├── Dockerfile
└── render.yaml           # Render deployment config

# Shared
.github/
└── workflows/            # CI/CD (optional for free tier)
```

**Structure Decision**: Mobile + API 架構
- **app/**: React Native + Expo 行動應用程式，包含所有前端邏輯、UI 元件與本地儲存
- **api/**: Python FastAPI 後端服務，提供 REST API、資料驗證與業務邏輯
- **分離優勢**: 前後端獨立開發與部署，API 可重用於未來 Web 版本
- **測試策略**: 前後端各自獨立測試 + API contract tests 確保整合

## Phase 0: Outline & Research ✅

**研究主題**:
1. React Native + Expo 行動開發最佳實踐
2. Python FastAPI 非同步架構與效能優化
3. MongoDB Atlas 免費方案資料模型設計
4. Cloudflare R2 檔案儲存整合
5. 離線優先同步策略
6. 測試策略 (Jest, Detox, pytest)
7. Render 免費部署最佳化

**研究成果**:
- ✅ 技術選型決策完整記錄於 `research.md`
- ✅ 所有依賴項與整合模式已確認
- ✅ 免費方案限制與緩解策略已定義
- ✅ 效能優化策略已規劃（60 FPS 動畫、< 200ms API、虛擬滾動）

**Output**: `/specs/001-motionstory/research.md` ✅ 完成

## Phase 1: Design & Contracts ✅

*Prerequisites: research.md complete* ✅

### 1. 資料模型設計 → `data-model.md` ✅
- **7 個 MongoDB Collections**: Users, Workouts, Achievements, Dashboards, Milestones, Annual Reviews, Share Cards
- **18 個高效索引**: 複合索引、Partial Index 優化空間（35MB for 100K workouts）
- **Hybrid 關聯設計**: Widgets 嵌入 Dashboard，Workouts 參考 Users
- **軟刪除機制** (FR-024):
  - Workouts: `is_deleted` + `deleted_at` 欄位，30 天復原期
  - 查詢過濾：預設排除已刪除記錄
  - 復原 API：`POST /workouts/{id}/restore`
  - 垃圾桶檢視：`GET /workouts/trash`
- **帳號刪除機制** (FR-030):
  - Users: `deleted_at` + `deletion_scheduled` 欄位，90 天保留期
  - 級聯刪除：關聯的 Workouts, Achievements, Dashboards 一併刪除
  - 刪除 API：`DELETE /auth/delete`
- **定時清理任務**:
  - 每日執行：清除 deleted_at > 30 天的 Workouts
  - 每日執行：清除 deleted_at > 90 天的 Users 與關聯資料
  - 實作方式：Python APScheduler 或 Render Cron Jobs
- **離線同步**: SQLite schema 設計，sync_status 欄位，冪等性 API
- **免費方案優化**: 空間估算 ~111KB/使用者，可支援 3,200+ 使用者

### 2. API 契約生成 → `/contracts/` ✅
生成 5 個 OpenAPI 3.0 契約檔案：
- **auth.yaml**: 註冊/登入/Token 管理/隱私設定/帳號刪除
  - 新增：`PUT /auth/me/privacy` (FR-028)
  - 新增：`DELETE /auth/delete` (FR-030)
- **workouts.yaml**: CRUD 操作/批次同步/統計摘要/匯入匯出/軟刪除
  - 新增：`POST /workouts/{id}/restore` (FR-024 復原)
  - 新增：`GET /workouts/trash` (FR-024 垃圾桶)
- **achievements.yaml**: 成就管理/自動檢查/分享卡片生成
- **dashboards.yaml**: 儀表板與 Widget 管理 (12 種 Widget 類型)
- **timeline.yaml**: 時間軸查詢/里程碑/年度回顧生成與匯出

**契約設計亮點**:
- JWT Bearer Token 認證
- Cursor-based Pagination 效能優化
- 統一錯誤回應格式 (400/401/404/500)
- 效能目標明確 (< 200ms, < 3 秒回顧生成)
- 軟刪除與 GDPR 合規機制 (30/90 天保留期)

### 3. 契約測試 (TDD 準備)
- ✅ API 契約定義完成，為實作階段準備
- ✅ 測試必須先寫（TDD 流程）：contract tests → integration tests → implementation
- ✅ 使用 OpenAPI schema validation 確保契約一致性

### 4. 測試場景抽取 → `quickstart.md` ✅
基於規格中的使用者故事建立完整 E2E 測試指南：
- **場景 1**: 小美的 7 天運動旅程（新手使用者）
- **場景 2**: 大衛的客製化儀表板（進階使用者）
- **場景 3**: 艾莉的年度回顧（長期使用者）

**包含內容**:
- 完整 Given-When-Then 測試步驟
- API 測試範例 (curl + httpx)
- 效能驗證腳本 (< 200ms API, 60 FPS, < 3 秒回顧)
- 離線模式測試流程
- 故障排除指南

### 5. Agent 上下文更新 ✅
- ✅ 執行 `.specify/scripts/bash/update-agent-context.sh claude`
- ✅ 生成 `/CLAUDE.md` 包含專案技術棧與最近變更
- ✅ Token 效率優化 (< 150 行)

**Output**:
- ✅ `/specs/001-motionstory/data-model.md`
- ✅ `/specs/001-motionstory/contracts/*.yaml` (5 個檔案)
- ✅ `/specs/001-motionstory/quickstart.md`
- ✅ `/CLAUDE.md` (agent context)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

**從設計文件生成任務**:
1. **從 data-model.md 生成**:
   - 7 個 MongoDB Collections → 7 個 model 建立任務 [P]
   - 18 個索引 → 索引設定任務
   - Pydantic models (Backend) [P]
   - TypeScript types (Mobile) [P]
   - SQLite schema (Mobile 離線儲存) [P]

2. **從 contracts/*.yaml 生成**:
   - 5 個 API 契約檔案 → 5 組 contract test 任務 [P]
   - 每個端點 → 實作任務（auth, workouts, achievements, dashboards, timeline）
   - 30+ API endpoints → 對應的 router + service 實作

3. **從 quickstart.md 生成**:
   - 3 個使用者故事 → 3 個 E2E 測試任務
   - 小美場景 → 運動記錄與慶祝動畫 E2E
   - 大衛場景 → 儀表板工作室 E2E
   - 艾莉場景 → 年度回顧 E2E

4. **從功能需求生成**:
   
   **Phase 1-2 (Core MVP)** - 已完成:
   - FR-001~006 → 慶祝引擎實作（動畫元件、成就檢查）
   - FR-007~013 → 儀表板系統（Widget 元件、拖拉互動）
   - FR-014~019 → 時間軸與年度回顧（虛擬滾動、圖表生成）
   - FR-020~025 → 資料管理（CSV 匯入匯出、離線同步）
   - FR-026~030 → 認證與安全（Firebase 整合、JWT）
   
   **Phase 3 (Social Features)** - 待實作:
   - FR-036~037 → 社交分享系統（4 平台整合、5 種卡片模板）
   - FR-038~040 → 好友系統（搜尋、邀請、動態、互動）
   - FR-041~043 → 挑戰賽系統（創建、追蹤、獎勵）
   - FR-044~045 → 進階成就系統（稀有成就、徽章升級、收藏櫃）
   - FR-046 → 好友排行榜（4 週期、多指標）
   - FR-047~048 → 通知系統（推播、管理）
   - FR-049~050 → 個人檔案公開化與效能安全

5. **Phase 3 需擴充設計文件**:
   - **data-model.md**: 新增 9 個社交 Collections (Friendships, Activities, Likes, Comments, Challenges, Participants, Notifications, Leaderboards, BlockList)
   - **contracts/**: 新增 6 個 API 契約檔案 (friends.yaml, social.yaml, challenges.yaml, notifications.yaml, leaderboard.yaml, profiles.yaml)
   - **quickstart.md**: 新增珍妮的社交使用者場景 (場景 4)

### Ordering Strategy (TDD)

**Phase 3.1: Setup** (1-3 天)
- T001~T005: 專案初始化、依賴安裝、環境配置 [P]
- Backend: FastAPI + Motor + Firebase Admin
- Mobile: Expo + React Native Paper + Zustand

**Phase 3.2: Tests First (TDD)** (2-3 天) ⚠️ **必須在實作前完成**
- T006~T020: Contract tests [P] (5 個 API 契約檔案)
- T021~T030: Backend unit tests [P] (Pydantic models, service logic)
- T031~T040: Mobile component tests [P] (Widget 元件、動畫元件)
- **所有測試必須失敗** (紅燈階段)

**Phase 3.3: Backend 實作** (5-7 天)
- T041~T050: MongoDB models + 索引設定 [P]
- T051~T070: Service layer (auth, workout, achievement, dashboard, timeline)
- T071~T090: API routers (5 組端點實作)
- T091~T095: Firebase Authentication 整合
- T096~T100: Cloudflare R2 檔案上傳

**Phase 3.4: Mobile 實作** (7-10 天)
- T101~T110: 基礎 UI 元件 [P] (Button, Card, Input)
- T111~T125: 主要畫面 (登入、運動記錄、儀表板、時間軸、設定)
- T126~T135: Widget 元件 [P] (12 種 Widget 類型)
- T136~T145: 慶祝動畫元件 [P] (基礎、煙火、史詩級)
- T146~T155: 離線同步邏輯 (SQLite, sync service)
- T156~T160: 拖拉互動 (React Native Gesture Handler)

**Phase 3.5: 整合與優化** (3-5 天)
- T161~T165: E2E 測試執行 [P] (Detox, 3 個使用者場景)
- T166~T170: 效能優化 (虛擬滾動、快取、圖片壓縮)
- T171~T175: 錯誤處理與 logging
- T176~T180: 部署設定 (Render, MongoDB Atlas, R2)

### 預估任務數量
- **總任務數**: ~180 任務
- **平行任務**: ~60 個 [P] (不同檔案，無依賴)
- **序列任務**: ~120 個 (有依賴關係)
- **預估時程**: 18-25 天 (1-2 位開發者)

### 任務標記說明
- **[P]**: 可平行執行（不同檔案、無依賴）
- **[Backend]**: 後端任務
- **[Mobile]**: 前端任務
- **[E2E]**: 端對端測試
- **[Performance]**: 效能優化相關

### Dependencies
```
Setup → Tests → Models → Services → API Routers → Mobile Screens → E2E → Deployment
                                  ↘ Mobile UI Components → Animations → Widgets
```

**IMPORTANT**: 此階段由 `/tasks` 指令執行，`/plan` 指令不建立 tasks.md

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**狀態**: ✅ 無違規項目需要記錄

所有設計決策均符合憲章原則，無需例外處理或複雜度妥協。


## Progress Tracking
*This checklist is updated during execution flow*

**Phase 1-2 (Core MVP) Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [x] Phase 3: Tasks generated (/tasks command) ✅ 180 tasks
- [x] Phase 4: Implementation complete ✅ 180/180 完成
- [ ] Phase 5: Validation passed ⚠️ 需實測效能

**Phase 3 (Social Features) Status**:
- [x] Spec extended with FR-036~050 ✅ 15 功能需求
- [x] Constitution Check: 95% PASS ✅
- [x] Plan updated with Phase 3 strategy ✅ (本次執行)
- [ ] Phase 0: Research (Phase 3 specific tech) ⏳ 待執行
- [ ] Phase 1: Design (9 Collections, 6 Contracts, Scenario 4) ⏳ 待執行
- [ ] Phase 2: Task planning (預估 ~100 tasks) ⏳ 待執行
- [ ] Phase 3: Tasks generated (/tasks command) ⏳ 待執行
- [ ] Phase 4: Implementation ⏳ 待執行
- [ ] Phase 5: Validation ⏳ 待執行

**Gate Status**:
- [x] Phase 1-2 Constitution Check: PASS ✅
- [x] Phase 3 Constitution Check: 95% PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented ✅ (無違規)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
