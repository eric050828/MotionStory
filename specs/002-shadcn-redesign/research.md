# Research: shadcn Design System for React Native

**Feature**: Modern Mobile App UI Redesign
**Date**: 2025-11-08
**Purpose**: 研究 shadcn 設計原則在 React Native 的實作策略與最佳實踐

## Research Tasks

### 1. shadcn 設計原則在 React Native 的適配

**研究問題**: shadcn/ui 原生為 Web React 設計，如何將其設計原則轉換至 React Native？

**調查結果**:

**決策**: 採用 shadcn 設計哲學而非直接移植元件庫

shadcn/ui 核心設計原則：
1. **Headless UI + Radix Primitives**: React Native 等效為無樣式元件 + React Native 原生元件
2. **Tailwind CSS 工具類**: React Native 使用 StyleSheet + 設計 tokens
3. **複製貼上而非套件**: React Native 同樣可採用此策略，元件放在專案內
4. **完全客製化**: 保持完整的樣式控制權

**替代方案考慮**:
- ❌ rn-shadcn-ui: 社群套件，維護不穩定，不符合憲章 (dependency bloat)
- ❌ 直接移植 Web shadcn: 技術上不可行 (DOM vs Native)
- ✅ **選擇**: 自行實作 shadcn-inspired 元件庫，基於 React Native Paper theming

**理由**:
- 符合憲章「Incremental Complexity」原則 (避免過度依賴)
- 與現有 React Native Paper 5.12 整合，降低遷移成本
- 完全控制樣式與效能優化

### 2. React Native Paper 主題系統客製化

**研究問題**: 如何基於 React Native Paper 5.12 實作 shadcn 風格的主題系統？

**調查結果**:

React Native Paper 主題結構：
```typescript
interface MD3Theme {
  colors: {
    primary, secondary, tertiary, error, background, surface,
    onPrimary, onSecondary, outline, shadow, etc.
  }
  fonts: {
    regular, medium, bold, labelLarge, bodyMedium, etc.
  }
  roundness: number
}
```

shadcn 設計 tokens 映射：
```
shadcn                 → React Native Paper
--background          → colors.background
--foreground          → colors.onBackground
--card                → colors.surface
--card-foreground     → colors.onSurface
--primary             → colors.primary
--primary-foreground  → colors.onPrimary
--muted               → colors.surfaceVariant
--border              → colors.outline
--radius              → roundness
```

**決策**: 擴展 React Native Paper 主題系統

實作策略：
1. 保留 Paper 的 MD3 主題基礎（相容現有元件）
2. 新增 shadcn tokens 作為 `theme.custom` 擴展
3. 建立雙層主題系統：
   - Paper tokens: 供 Paper 內建元件使用
   - Custom tokens: 供新 UI 元件使用

**理由**:
- 漸進式遷移：不破壞現有使用 Paper 元件的螢幕
- 效能優化：避免全局主題替換造成的重渲染
- 靈活性：未來可完全移除 Paper 依賴

### 3. 底部導航 (Bottom Tabs) 實作方案

**研究問題**: 如何實作符合 shadcn 風格的底部導航，同時整合 Expo Router？

**調查結果**:

Expo Router + Bottom Tabs 整合：
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <CustomTabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: theme.custom.primary,
        tabBarInactiveTintColor: theme.custom.muted,
        tabBarStyle: { /* shadcn styling */ }
      })}
    />
  )
}
```

**決策**: 客製化 Expo Router Tabs 元件

選項比較：
- ❌ 使用 @react-navigation/bottom-tabs: 需額外配置，與 Expo Router 衝突
- ❌ 第三方 tab bar 套件: 不符合憲章 (避免依賴)
- ✅ **選擇**: 客製化 Expo Router `<Tabs>` 的 `screenOptions`

實作細節：
1. 使用 `tabBarStyle` 套用 shadcn 視覺風格
2. 自訂 `tabBarIcon` 元件支援動畫與互動狀態
3. 支援主題切換（light/dark tokens）
4. 使用 Reanimated 實作 tab 切換動畫

**理由**:
- 與 Expo Router 原生整合，無需額外路由配置
- 簡化架構，符合 YAGNI 原則
- 完全控制樣式與動畫效能

### 4. 主題切換效能優化

**研究問題**: 如何實作無閃爍的主題切換，並達到 <300ms 目標？

**調查結果**:

主題切換性能瓶頸：
1. AsyncStorage 讀寫延遲 (~50-100ms)
2. Context re-render 傳播 (~100-200ms)
3. StyleSheet 重建與元件重繪 (~50-150ms)

**決策**: React Context + useMemo + AsyncStorage 預載

優化策略：
```typescript
// 1. 應用程式啟動時預載主題
useEffect(() => {
  AsyncStorage.getItem('theme').then(setInitialTheme)
}, [])

// 2. Context 值 memoization
const themeValue = useMemo(
  () => ({ theme, setTheme }),
  [theme]
)

// 3. 批次更新避免多次 re-render
const toggleTheme = useCallback(() => {
  startTransition(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      AsyncStorage.setItem('theme', next) // 非阻塞
      return next
    })
  })
}, [])
```

效能測試目標：
- 冷啟動載入主題: <100ms (AsyncStorage 讀取)
- 主題切換總延遲: <250ms (目標 <300ms，留 50ms buffer)
- 無視覺閃爍或白屏

**替代方案考慮**:
- ❌ Redux/Zustand: 過度設計 (單一狀態管理)
- ❌ CSS-in-JS 動態樣式: React Native 不支援，效能差
- ✅ **選擇**: 原生 Context + StyleSheet 靜態樣式

**理由**:
- React Context 輕量且足夠 (符合 YAGNI)
- StyleSheet 靜態樣式效能最佳 (預編譯)
- useMemo 避免不必要的重渲染

### 5. 動畫與互動效能 (60 FPS)

**研究問題**: 如何使用 Reanimated 3.10 實作流暢的 UI 動畫？

**調查結果**:

Reanimated 效能最佳實踐：
1. **Worklets**: 動畫邏輯在 UI 執行緒執行（避免 JS 橋接延遲）
2. **Shared Values**: 減少跨執行緒通訊
3. **Spring Animations**: 比 Timing 動畫更自然

**決策**: 使用 Reanimated worklets + spring animations

實作範例（Ripple Effect）：
```typescript
// components/ui/Button.tsx
const scale = useSharedValue(1)

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}))

const handlePressIn = () => {
  scale.value = withSpring(0.95, { damping: 15 })
}

const handlePressOut = () => {
  scale.value = withSpring(1, { damping: 15 })
}
```

效能監控策略：
- 使用 Flipper / React DevTools Profiler 監控 FPS
- 目標: 所有動畫穩定在 60 FPS (16.67ms/frame)
- 低階裝置測試 (Android 6.0 / iOS 13)

**理由**:
- Reanimated 是 React Native 動畫最佳解決方案
- Worklets 確保 60 FPS 效能目標
- Spring animations 提供自然的互動回饋

## Best Practices Summary

### 設計系統架構

**Token-based Design System**:
```
Design Tokens (constants/Design.ts)
    ↓
Theme Configs (lightTheme.ts / darkTheme.ts)
    ↓
Theme Provider (ThemeProvider.tsx)
    ↓
UI Components (components/ui/*)
```

**元件開發原則**:
1. **原子性**: 每個元件專注單一職責
2. **可組合**: 透過 composition 建構複雜 UI
3. **主題感知**: 所有元件讀取 theme context
4. **效能優化**: 使用 React.memo + useCallback

### TDD 測試策略

**測試層級**:
1. **單元測試** (Jest + Testing Library):
   - 元件 props 驗證
   - 主題切換邏輯
   - 互動事件處理
   - Snapshot testing (視覺回歸)

2. **整合測試**:
   - 主題 Provider + 多元件互動
   - 底部導航 + 路由切換
   - AsyncStorage 主題持久化

3. **E2E 測試** (Detox):
   - 完整使用者流程 (登入 → 導航 → 主題切換)
   - 視覺驗證 (截圖比對)
   - 效能基準測試 (動畫 FPS)

**測試檔案結構**:
```
__tests__/
├── ui/
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   └── __snapshots__/
└── theme/
    ├── ThemeProvider.test.tsx
    └── useTheme.test.tsx
```

### 漸進式遷移策略

**Phase 1: 基礎設施** (1-2 天)
- 建立設計 tokens 與主題系統
- 實作 3 個核心元件 (Button, Card, Text)
- 撰寫元件測試

**Phase 2: 導航與主題** (2-3 天)
- 實作底部導航客製化
- 整合主題切換邏輯
- AsyncStorage 持久化
- 撰寫整合測試

**Phase 3: 表單與進階元件** (3-4 天)
- 實作表單元件 (Input, Select)
- Loading states (Skeleton)
- Toast notifications
- 撰寫 E2E 測試

**Phase 4: 螢幕遷移** (按需進行)
- 逐步將現有螢幕遷移至新元件庫
- 保持向後相容（舊元件與新元件共存）

## Dependencies Analysis

**需新增的套件** (待 Phase 1 驗證):
- 無需新增，使用現有套件：
  - React Native Reanimated ✅ (已安裝 3.10.0)
  - React Native Paper ✅ (已安裝 5.12.0)
  - AsyncStorage ✅ (已安裝 1.23.1)

**潛在替代方案**:
- NativeWind (Tailwind for RN): ❌ 過度設計，增加複雜度
- Styled Components: ❌ 效能不如 StyleSheet
- Tamagui: ❌ 套件過於龐大，不符合憲章原則

**決策**: 零新增依賴，基於現有套件實作

## Risks & Mitigation

### 風險 1: React Native Paper 客製化限制
- **影響**: 可能無法完全實作 shadcn 視覺風格
- **緩解**: Phase 1 驗證主題客製化範圍，必要時建立獨立元件庫

### 風險 2: 低階裝置動畫效能
- **影響**: Android 6.0 / iOS 13 裝置可能無法達到 60 FPS
- **緩解**:
  - 提供動畫降級選項 (reduced motion)
  - 效能測試包含低階裝置
  - 使用 InteractionManager 延遲非關鍵動畫

### 風險 3: 主題切換閃爍
- **影響**: 大量元件重渲染造成視覺閃爍
- **緩解**:
  - 使用 React.memo 優化元件
  - 批次更新減少 re-render 次數
  - 測試驗證無閃爍

## Next Steps

Phase 0 研究完成 ✅

**進入 Phase 1: Design & Contracts**
1. 建立 `data-model.md`: 主題配置與設計 tokens 資料結構
2. 建立 `contracts/theme.schema.ts`: TypeScript 型別定義
3. 建立 `quickstart.md`: 開發者指南
4. 更新 agent context (執行 update-agent-context 腳本)
