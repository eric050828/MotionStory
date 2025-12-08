# Data Model: Theme Configuration & Design Tokens

**Feature**: Modern Mobile App UI Redesign
**Date**: 2025-11-08
**Purpose**: 定義主題配置、設計 tokens 與元件 props 的資料結構

## Core Entities

### 1. Design Tokens

設計 tokens 是設計系統的原子級值，定義所有視覺屬性的標準化變數。

```typescript
interface DesignTokens {
  // Color Tokens
  colors: {
    // Primary Colors
    primary: string          // 主要品牌色
    primaryForeground: string // 主要品牌色上的文字色

    // Secondary Colors
    secondary: string
    secondaryForeground: string

    // Semantic Colors
    success: string
    warning: string
    error: string
    info: string

    // Neutral Colors
    background: string       // 主背景色
    foreground: string       // 主文字色
    card: string            // 卡片背景色
    cardForeground: string  // 卡片文字色
    muted: string           // 弱化背景色
    mutedForeground: string // 弱化文字色

    // UI Elements
    border: string          // 邊框色
    input: string           // 輸入框背景色
    ring: string            // focus ring 顏色

    // Navigation
    tabBarActive: string
    tabBarInactive: string
    tabBarBackground: string
  }

  // Spacing Tokens
  spacing: {
    xs: number    // 4dp
    sm: number    // 8dp
    md: number    // 16dp
    lg: number    // 24dp
    xl: number    // 32dp
    xxl: number   // 48dp
  }

  // Typography Tokens
  typography: {
    fontFamily: {
      regular: string
      medium: string
      bold: string
    }
    fontSize: {
      xs: number    // 12px
      sm: number    // 14px
      base: number  // 16px
      lg: number    // 18px
      xl: number    // 20px
      xxl: number   // 24px
      xxxl: number  // 32px
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
    fontWeight: {
      normal: '400'
      medium: '500'
      bold: '700'
    }
  }

  // Border Radius Tokens
  borderRadius: {
    none: number   // 0
    sm: number     // 4dp
    md: number     // 8dp
    lg: number     // 12dp
    full: number   // 9999dp (圓形)
  }

  // Shadow Tokens
  shadows: {
    sm: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
    md: { /* ... */ }
    lg: { /* ... */ }
  }

  // Animation Tokens
  animation: {
    duration: {
      fast: number    // 150ms
      normal: number  // 300ms
      slow: number    // 500ms
    }
    easing: {
      easeIn: [number, number, number, number]
      easeOut: [number, number, number, number]
      easeInOut: [number, number, number, number]
    }
  }
}
```

**關係**: Design Tokens 是所有 Theme Configuration 的基礎

**驗證規則**:
- 所有顏色必須為有效的 hex (#RRGGBB) 或 rgba()
- spacing 值必須為 4 的倍數 (4dp grid system)
- fontSize 必須為正數
- borderRadius 必須 >= 0

---

### 2. Theme Configuration

主題配置將 design tokens 組織為淺色/深色主題。

```typescript
interface ThemeConfiguration {
  mode: 'light' | 'dark'
  tokens: DesignTokens

  // React Native Paper 相容層
  paperTheme: {
    dark: boolean
    colors: MD3Colors
    fonts: MD3Fonts
    roundness: number
  }
}

// Light Theme Example
const lightTheme: ThemeConfiguration = {
  mode: 'light',
  tokens: {
    colors: {
      primary: '#3b82f6',          // blue-500
      primaryForeground: '#ffffff',
      background: '#ffffff',
      foreground: '#0a0a0a',
      card: '#f8f9fa',
      cardForeground: '#0a0a0a',
      muted: '#f1f3f5',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      // ... 其他顏色
    },
    spacing: { /* ... */ },
    typography: { /* ... */ },
    borderRadius: { /* ... */ },
    shadows: { /* ... */ },
    animation: { /* ... */ }
  },
  paperTheme: { /* React Native Paper 主題映射 */ }
}

// Dark Theme Example
const darkTheme: ThemeConfiguration = {
  mode: 'dark',
  tokens: {
    colors: {
      primary: '#60a5fa',          // blue-400
      primaryForeground: '#0a0a0a',
      background: '#0a0a0a',
      foreground: '#f8f9fa',
      card: '#18181b',
      cardForeground: '#f8f9fa',
      muted: '#27272a',
      mutedForeground: '#a1a1aa',
      border: '#3f3f46',
      // ... 其他顏色
    },
    // ... 其他 tokens
  },
  paperTheme: { /* ... */ }
}
```

**關係**: ThemeConfiguration 聚合 DesignTokens

**狀態轉換**:
```
'light' <-> 'dark' (透過 toggleTheme 函式)
```

---

### 3. Theme Preference

使用者主題偏好設定，儲存於 AsyncStorage。

```typescript
interface ThemePreference {
  mode: 'light' | 'dark' | 'system'  // 'system' 表示跟隨裝置設定
  lastUpdated: string                 // ISO 8601 timestamp
}

// AsyncStorage Key
const THEME_STORAGE_KEY = '@motionstory/theme_preference'

// Storage Format (JSON string)
{
  "mode": "dark",
  "lastUpdated": "2025-11-08T22:30:00Z"
}
```

**關係**: ThemePreference → ThemeConfiguration (決定使用哪個主題)

**驗證規則**:
- mode 必須為 'light' | 'dark' | 'system'
- lastUpdated 必須為有效的 ISO 8601 格式

**持久化**:
- 寫入: `AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference))`
- 讀取: `JSON.parse(await AsyncStorage.getItem(THEME_STORAGE_KEY))`
- 預設值: `{ mode: 'system', lastUpdated: new Date().toISOString() }`

---

### 4. UI Component Props

所有 UI 元件共享的基礎 props 介面。

```typescript
// Base Props for All UI Components
interface BaseComponentProps {
  // Theme-aware styling
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: AccessibilityRole

  // Testing
  testID?: string

  // Custom styling (escape hatch)
  style?: ViewStyle | TextStyle
}

// Button Component Props
interface ButtonProps extends BaseComponentProps {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

// Card Component Props
interface CardProps extends BaseComponentProps {
  children: React.ReactNode
  onPress?: () => void
  elevation?: 'sm' | 'md' | 'lg'
}

// Input Component Props
interface InputProps extends BaseComponentProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  secureTextEntry?: boolean
}

// Badge Component Props
interface BadgeProps extends BaseComponentProps {
  children: React.ReactNode
  status?: 'success' | 'warning' | 'error' | 'info'
}

// Skeleton Component Props
interface SkeletonProps extends BaseComponentProps {
  width: number | string
  height: number | string
  borderRadius?: number
  animated?: boolean
}

// Toast Component Props
interface ToastProps {
  visible: boolean
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  duration?: number
  onDismiss: () => void
}

// Bottom Navigation Tab Item Props
interface TabItemProps {
  name: string
  icon: (props: { focused: boolean; color: string; size: number }) => React.ReactNode
  label: string
  badge?: number | string
}
```

**關係**:
- Props → DesignTokens (讀取主題 tokens 進行樣式計算)
- Props → ThemeConfiguration (透過 useTheme hook 取得當前主題)

**驗證規則**:
- variant 必須為預定義值之一
- size 必須為 'sm' | 'md' | 'lg'
- 必填 props (如 ButtonProps.onPress) 不可為 undefined

---

## Data Flow Diagrams

### Theme Initialization Flow

```
App 啟動
    ↓
讀取 AsyncStorage (ThemePreference)
    ↓
若 mode === 'system' → 讀取裝置系統設定 (Appearance.getColorScheme())
若 mode === 'light' → 載入 lightTheme
若 mode === 'dark' → 載入 darkTheme
    ↓
ThemeProvider 初始化
    ↓
所有 UI 元件可透過 useTheme() 取得當前主題
```

### Theme Toggle Flow

```
使用者點擊主題切換按鈕
    ↓
呼叫 toggleTheme() 函式
    ↓
更新 React Context (theme state)
    ↓
非阻塞寫入 AsyncStorage (ThemePreference)
    ↓
所有訂閱 useTheme() 的元件重新渲染
    ↓
StyleSheet 根據新主題 tokens 重新計算樣式
```

### Component Styling Flow

```
UI 元件渲染
    ↓
呼叫 useTheme() 取得 ThemeConfiguration
    ↓
根據 props.variant + props.size 計算樣式
    ↓
從 theme.tokens 讀取對應的 color / spacing / borderRadius
    ↓
合併 props.style (自訂樣式)
    ↓
StyleSheet.create() 建立最終樣式
    ↓
應用於 React Native 元件 (<View> / <Text> / <Pressable>)
```

---

## Storage Schema

### AsyncStorage Keys

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `@motionstory/theme_preference` | `ThemePreference` | 使用者主題偏好 | `{"mode":"dark","lastUpdated":"2025-11-08T..."}` |

**資料保留政策**:
- 主題偏好設定永久保留（直到使用者卸載 app）
- 無需同步至雲端（本地設定）

---

## Validation Rules Summary

### Design Tokens
- ✅ 顏色格式: hex 或 rgba
- ✅ spacing: 4 的倍數
- ✅ fontSize: 正數
- ✅ borderRadius: >= 0

### Theme Configuration
- ✅ mode: 'light' | 'dark'
- ✅ tokens 必須符合 DesignTokens 介面

### Theme Preference
- ✅ mode: 'light' | 'dark' | 'system'
- ✅ lastUpdated: 有效的 ISO 8601

### Component Props
- ✅ variant: 預定義值
- ✅ size: 'sm' | 'md' | 'lg'
- ✅ 必填欄位不可為 undefined

---

## State Management

### Theme State

```typescript
// ThemeProvider.tsx
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeContextValue {
  theme: ThemeConfiguration
  themeMode: 'light' | 'dark' | 'system'
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
}

// State 位置: React Context (ThemeProvider)
// 訂閱方式: useTheme() hook
```

**狀態更新觸發點**:
1. App 啟動初始化
2. 使用者手動切換主題
3. 系統主題變更 (若 mode === 'system')

**效能優化**:
- Context value 使用 `useMemo` 防止不必要的重渲染
- StyleSheet 靜態樣式避免動態計算
- 元件使用 `React.memo` 減少 re-render

---

## Index

- **Design Tokens**: 視覺屬性的原子級定義
- **Theme Configuration**: 淺色/深色主題配置
- **Theme Preference**: 使用者主題偏好 (AsyncStorage)
- **Component Props**: UI 元件介面定義
- **Data Flow**: 主題初始化、切換、元件樣式流程
- **Storage**: AsyncStorage key schema
- **Validation**: 資料驗證規則
- **State Management**: React Context 主題狀態管理
