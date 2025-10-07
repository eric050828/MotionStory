
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

MotionStory 是一個跨平台運動追蹤與動機維持平台，透過即時慶祝動畫、客製化儀表板與運動傳記時間軸三大核心功能，幫助使用者建立長期運動習慣。系統採用 React Native + Expo 開發行動應用，Python FastAPI 提供後端 API，MongoDB Atlas 作為雲端資料庫，Firebase Authentication 處理使用者認證，Cloudflare R2 儲存媒體檔案。所有服務均使用免費方案，適合課堂作業展示。

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
- API 回應時間: P95 < 200ms
- 慶祝動畫: 60 FPS 流暢播放
- 年度回顧生成: 互動式網頁 < 3 秒, 圖片匯出 < 5 秒
- App 啟動時間: < 2 秒 (冷啟動)

**Constraints**:
- 離線優先: 支援本地記錄運動，網路恢復後同步
- 免費方案限制: MongoDB 512MB, Render 512MB RAM, Cloudflare R2 10GB
- 儀表板 Widget 數量: 建議上限 12 個, 硬限制 20 個
- 資料保留: 軟刪除機制 (30 天復原期)

**Scale/Scope**:
- MVP 目標: 支援 100 位使用者測試
- 預估資料量: 每使用者平均 1000 筆運動記錄/年
- 預估儲存: 約 50MB/使用者 (含圖片分享卡片)
- 螢幕數量: 約 15-20 個主要畫面

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User-Centric Motivation Design ✅
- **即時回饋機制**: FR-001~003 定義慶祝動畫與成就徽章立即觸發
- **個人化追蹤**: FR-007~013 定義拖拉式儀表板與 Widget 客製化
- **視覺化敘事**: FR-014~019 定義時間軸與年度回顧功能
- **非侵入性**: 使用者完全控制儀表板配置，無強制追蹤項目
- **評估**: ✅ PASS - 所有核心價值主張均有對應功能需求

### II. Cross-Platform Consistency ✅
- **API 優先設計**: FastAPI 提供統一 REST API，React Native 作為跨平台前端
- **共享資料模型**: MongoDB 統一資料結構，Pydantic 驗證確保一致性
- **平台特定優化**: React Native Paper 遵循 Material Design，iOS/Android 原生體驗
- **即時同步機制**: FR-027 定義多裝置資料同步需求
- **評估**: ✅ PASS - Mobile app + API 架構確保跨平台一致性

### III. Cloud-Native Architecture ✅
- **無狀態服務設計**: FastAPI stateless design, JWT-based authentication
- **容器化部署**: Render 提供 Docker 容器化部署環境
- **雲端儲存整合**: MongoDB Atlas (資料庫), Cloudflare R2 (檔案), Firebase (認證)
- **監控與日誌**: Render 內建日誌收集，FastAPI middleware 記錄請求
- **自動擴展**: Render 免費方案支援基本自動重啟
- **評估**: ✅ PASS - 符合雲端原生架構要求，使用免費雲端服務

### IV. Test-Driven Development (NON-NEGOTIABLE) ⚠️
- **紅-綠-重構循環**: 計畫遵循 TDD 流程（先寫測試 → 實作 → 重構）
- **測試覆蓋層級**:
  - 單元測試: Jest (Mobile), pytest (Backend)
  - 整合測試: API contract tests, MongoDB integration tests
  - E2E 測試: Detox (Mobile 關鍵流程)
- **契約測試**: API contracts 定義於 Phase 1，測試先於實作
- **評估**: ✅ PASS - TDD 工具鏈完整，測試目標 80%+ 覆蓋率

### V. Performance & Responsiveness ✅
- **API 回應時間**: 目標 P95 < 200ms (FR-032)
- **動畫流暢度**: React Native Reanimated 3 確保 60 FPS (FR-031)
- **離線支援**: Expo SQLite 本地快取，網路恢復後同步 (FR-022)
- **漸進式載入**: 虛擬滾動 (時間軸、Widget), React Native FlatList 優化
- **資源優化**: Cloudflare R2 CDN, 圖片壓縮, lazy loading
- **評估**: ✅ PASS - 效能目標明確且技術選型支援

### VI. Data Privacy & Security ✅
- **認證與授權**: Firebase Authentication (Email/Password + Google OAuth)
- **資料加密**: HTTPS (Render SSL), MongoDB Atlas encryption at rest
- **存取控制**: JWT tokens, user-scoped data queries
- **資料保留政策**: FR-024 定義軟刪除與 GDPR 合規機制
- **合規性**: Firebase GDPR compliant, 資料保留 30/90 天復原期
- **評估**: ✅ PASS - 安全機制完整，符合基本合規要求

### VII. Incremental Complexity ✅
- **MVP 優先**: 核心三大功能（慶祝、儀表板、時間軸）
- **功能分層**:
  - Phase 1: 基本運動記錄與慶祝動畫
  - Phase 2: 拖拉式儀表板與資料視覺化
  - Phase 3: 社交分享與成就系統（未來版本）
- **避免過度設計**: MVP 不包含第三方整合、影片生成
- **重構友善**: React Native 模組化設計，FastAPI 分層架構
- **評估**: ✅ PASS - MVP 範疇清晰，漸進式擴展路徑明確

### 初步評估結果
- **狀態**: ✅ PASS - 所有憲章原則均符合
- **風險**: 無重大違規項目
- **備註**: Render 免費方案有 512MB RAM 限制，需注意效能優化

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
│   │   └── dashboard.py
│   ├── services/         # Business logic
│   │   ├── auth_service.py
│   │   ├── workout_service.py
│   │   ├── achievement_service.py
│   │   └── dashboard_service.py
│   ├── routers/          # FastAPI endpoints
│   │   ├── auth.py
│   │   ├── workouts.py
│   │   ├── achievements.py
│   │   ├── dashboards.py
│   │   └── timeline.py
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
   - FR-001~006 → 慶祝引擎實作（動畫元件、成就檢查）
   - FR-007~013 → 儀表板系統（Widget 元件、拖拉互動）
   - FR-014~019 → 時間軸與年度回顧（虛擬滾動、圖表生成）
   - FR-020~025 → 資料管理（CSV 匯入匯出、離線同步）
   - FR-026~030 → 認證與安全（Firebase 整合、JWT）

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

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
