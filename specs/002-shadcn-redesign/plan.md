# Implementation Plan: Modern Mobile App UI Redesign with shadcn

**Branch**: `002-shadcn-redesign` | **Date**: 2025-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-shadcn-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

將 MotionStory 手機 app 的 UI 全面重新設計，採用 shadcn 設計系統風格與現代化視覺語言。主要包含：底部導航列實作、淺色/深色主題切換、現代化元件庫（按鈕、卡片、表單）、響應式布局系統、以及流暢的互動動畫。此為純前端 UI 重構，不影響現有業務邏輯與資料結構。

## Technical Context

**Language/Version**: TypeScript 5.x + React Native 0.74.5 + Expo SDK 51
**Primary Dependencies**:
- UI Framework: React Native + Expo Router (檔案路由)
- 設計系統: React Native Paper 5.12 → 需整合 shadcn-like 元件
- 導航: @react-navigation/bottom-tabs 6.5
- 動畫: React Native Reanimated 3.10
- 狀態管理: Zustand 4.5
- 樣式: StyleSheet + React Native Paper theming

**Storage**:
- 本地儲存: @react-native-async-storage (主題偏好設定)
- 無需後端資料模型變更

**Testing**:
- 單元測試: Jest + @testing-library/react-native
- E2E 測試: Detox (已配置於 .detoxrc.js)

**Target Platform**:
- iOS 13+ / Android 6.0+ (React Native 0.74 支援範圍)
- Expo 開發環境支援 Web preview (非生產目標)

**Project Type**: Mobile (React Native) - 單一 app/ 目錄結構

**Performance Goals**:
- 動畫流暢度: 60 FPS (Reanimated worklet 執行)
- 主題切換延遲: < 300ms (AsyncStorage 讀寫 + 重渲染)
- 元件互動回饋: < 100ms (觸控反饋延遲)
- 啟動時間: 不增加 (元件庫需 tree-shaking 優化)

**Constraints**:
- 必須與現有 Expo Router 檔案路由相容
- 不可破壞現有 Firebase Auth、MongoDB API 整合
- React Native Paper 5.12 主題系統需與 shadcn 風格對齊
- 必須支援 Android Material Design 與 iOS Human Interface Guidelines
- 無法使用原生 shadcn/ui (僅支援 Web React)，需自行實作等效元件

**Scale/Scope**:
- 影響範圍: app/app/ 下所有螢幕 (約 10-15 個檔案)
- 元件庫: 約 15-20 個可重用元件 (Button, Card, Input, BottomNav 等)
- 主題配置: 2 套主題 (light/dark) × 設計 token 系統
- 不需重構 API 層 (api/ 目錄不受影響)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User-Centric Motivation Design ✅ **PASS**
- **即時回饋機制**: 新 UI 將強化互動回饋動畫 (loading states, ripple effects)
- **個人化追蹤**: 拖拉式儀表板的 UI 升級不影響既有功能
- **視覺化敘事**: 時間軸元件將獲得更清晰的視覺層級
- **非侵入性**: 純 UI 重構，不改變使用者工作流程
- **評估**: 符合原則，現代化 UI 將提升使用者體驗與動機強化效果

### II. Cross-Platform Consistency ✅ **PASS**
- **API 優先設計**: UI 重構不影響 API 契約，前後端分離架構保持
- **共享資料模型**: 無資料模型變更
- **平台特定優化**: React Native 原生支援 iOS/Android 平台差異，新元件庫將遵循各平台設計語言
- **即時同步機制**: 主題偏好設定將透過 AsyncStorage 同步（未來可擴展至雲端）
- **評估**: 符合原則，React Native 確保跨平台一致性

### III. Cloud-Native Architecture ✅ **PASS**
- **無狀態服務設計**: UI 重構不影響後端架構
- **容器化部署**: API 層 (Docker + Render.com) 不受影響
- **雲端儲存整合**: MongoDB + Cloudflare R2 不受影響
- **監控與日誌**: 前端效能監控可透過 Sentry/LogRocket 整合（Phase 2 考慮）
- **評估**: 符合原則，UI 層變更不影響雲端架構

### IV. Test-Driven Development (NON-NEGOTIABLE) ⚠️ **NEEDS ATTENTION**
- **紅-綠-重構循環**: UI 元件開發應先寫 snapshot/視覺回歸測試
- **測試覆蓋層級**:
  - 單元測試: 元件 props/state 變化測試 (Jest + Testing Library)
  - 整合測試: 主題切換、導航流程測試
  - E2E 測試: 關鍵使用者流程的視覺驗證 (Detox)
- **契約測試**: UI 與 API 契約不變，無需新契約測試
- **測試優先原則**: 每個新元件必須先寫測試規格
- **評估**: 需確保 TDD 流程，特別是 snapshot testing 與視覺回歸測試

### V. Performance & Responsiveness ✅ **PASS**
- **API 回應時間**: 不受影響（後端無變更）
- **動畫流暢度**: 目標 60 FPS 透過 Reanimated worklet 達成
- **離線支援**: AsyncStorage 主題設定離線可用
- **漸進式載入**: 元件 lazy loading 透過 React.lazy (若需要)
- **資源優化**: 靜態資源透過 Expo 打包優化
- **評估**: 符合原則，需特別注意動畫效能與主題切換流暢度

### VI. Data Privacy & Security ✅ **PASS**
- **認證與授權**: 不受影響 (Firebase Auth 保持)
- **資料加密**: 不受影響 (HTTPS + 敏感資料加密)
- **存取控制**: 不受影響
- **資料保留政策**: 主題偏好設定屬於本地使用者設定，非敏感資料
- **評估**: 符合原則，UI 重構無安全性影響

### VII. Incremental Complexity ✅ **PASS**
- **MVP 優先**:
  - Phase 1: 設計系統 tokens + 基礎元件 (Button, Card)
  - Phase 2: 底部導航 + 主題切換
  - Phase 3: 表單元件 + 複雜互動
- **功能分層**: 遵循使用者故事優先級 (P1 → P2 → P3)
- **避免過度設計**: 不實作未在規格中的動畫或元件
- **重構友善**: 元件庫設計為可擴展架構
- **評估**: 符合原則，採用漸進式實作策略

## Project Structure

### Documentation (this feature)

```text
specs/002-shadcn-redesign/
├── plan.md              # 本檔案 (/speckit.plan 輸出)
├── research.md          # Phase 0: shadcn-like 設計系統研究
├── data-model.md        # Phase 1: 主題配置與設計 tokens 資料結構
├── quickstart.md        # Phase 1: 開發者快速開始指南
├── contracts/           # Phase 1: 設計系統 TypeScript 介面定義
│   └── theme.schema.ts  # 主題配置與 design tokens 型別定義
└── tasks.md             # Phase 2: TDD 任務清單 (由 /speckit.tasks 產生)
```

### Source Code (repository root)

```text
app/                          # React Native Expo 應用程式
├── app/                      # Expo Router 檔案路由
│   ├── (tabs)/              # 底部導航分頁組
│   │   ├── _layout.tsx      # 底部導航配置 (需升級)
│   │   ├── index.tsx        # 儀表板螢幕 (需重新設計)
│   │   ├── timeline.tsx     # 時間軸螢幕 (需重新設計)
│   │   └── profile.tsx      # 個人資料螢幕 (需重新設計)
│   ├── _layout.tsx          # 全域布局 (主題 provider)
│   └── index.tsx            # 應用程式入口
│
├── components/              # UI 元件庫 (新增 shadcn-like 元件)
│   ├── ui/                  # 原子級 UI 元件 (新建)
│   │   ├── Button.tsx       # 按鈕元件
│   │   ├── Card.tsx         # 卡片元件
│   │   ├── Input.tsx        # 輸入框元件
│   │   ├── Badge.tsx        # 徽章元件
│   │   ├── Skeleton.tsx     # 骨架屏元件
│   │   ├── Toast.tsx        # 通知元件
│   │   └── BottomNav.tsx    # 底部導航元件
│   │
│   ├── theme/               # 主題系統 (新建)
│   │   ├── ThemeProvider.tsx     # 主題 context provider
│   │   ├── tokens.ts             # 設計 tokens 定義
│   │   ├── lightTheme.ts         # 淺色主題配置
│   │   ├── darkTheme.ts          # 深色主題配置
│   │   └── useTheme.ts           # 主題 hook
│   │
│   └── [existing components]     # 既有元件逐步遷移
│
├── constants/               # 常數配置
│   └── Design.ts            # 設計系統常數 (新增)
│
├── hooks/                   # Custom hooks
│   └── useThemePreference.ts  # 主題偏好設定 hook (新增)
│
├── __tests__/               # 測試檔案
│   ├── ui/                  # UI 元件測試 (新建)
│   └── theme/               # 主題系統測試 (新建)
│
└── package.json             # 依賴管理 (可能需新增套件)

api/                         # Python FastAPI 後端 (不受影響)
└── [unchanged]

tests/                       # E2E 測試
└── e2e/                     # Detox 測試 (新增 UI 測試案例)
```

**Structure Decision**:
採用 **Option 3: Mobile + API** 結構，但 UI 重構僅影響 `app/` 目錄。設計系統元件庫建立於 `app/components/ui/` 與 `app/components/theme/`，遵循 React Native 社群最佳實踐（原子設計原則）。API 層 (`api/`) 完全不受影響。

## Complexity Tracking

> **無憲章違規需記錄**

本功能符合所有憲章原則：
- 使用者體驗優先 (UI 現代化提升動機強化)
- 跨平台一致性 (React Native 原生支援)
- 雲端架構不受影響
- TDD 流程需嚴格執行
- 效能目標明確 (60 FPS 動畫)
- 無安全性影響
- 漸進式實作策略

**潛在風險**：
1. React Native Paper 5.12 主題系統與 shadcn 風格整合可能需要客製化調整
2. 需確保 Reanimated 動畫效能在低階裝置達標
3. 主題切換時需避免閃爍與渲染問題

**緩解策略**：
- Phase 0 研究階段驗證 React Native Paper 客製化主題可行性
- Phase 1 建立效能測試基準與動畫效能監控
- 採用 React Context + useMemo 優化主題切換效能
