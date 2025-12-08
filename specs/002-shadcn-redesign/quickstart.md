# Quick Start: shadcn-inspired Design System for MotionStory

**Feature**: Modern Mobile App UI Redesign
**Date**: 2025-11-08
**Audience**: 開發者 (實作此功能的工程師)

## Overview

本指南說明如何開始實作 MotionStory 的 shadcn 風格設計系統，包含主題系統、UI 元件庫與測試策略。

## Prerequisites

確保您已具備：
- ✅ Node.js 18+ 與 npm/yarn
- ✅ Expo CLI 安裝 (`npx expo`)
- ✅ React Native 開發環境 (iOS Simulator / Android Emulator)
- ✅ 已閱讀 `spec.md` 與 `plan.md`

## Project Structure

```
app/
├── components/
│   ├── ui/              # 新建：shadcn-like UI 元件庫
│   ├── theme/           # 新建：主題系統
│   └── [existing]       # 既有元件
├── constants/
│   └── Design.ts        # 新建：設計 tokens
├── hooks/
│   └── useThemePreference.ts  # 新建：主題偏好 hook
└── __tests__/
    ├── ui/              # 新建：UI 元件測試
    └── theme/           # 新建：主題系統測試
```

## Implementation Roadmap

### Phase 1: 基礎設施 (P1) - 預估 1-2 天

#### Step 1.1: 建立設計 Tokens

**檔案**: `app/constants/Design.ts`

```typescript
import { DesignTokens } from '@/specs/002-shadcn-redesign/contracts/theme.schema'

export const baseTokens: Omit<DesignTokens, 'colors'> = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: [0.4, 0, 1, 1],
      easeOut: [0, 0, 0.2, 1],
      easeInOut: [0.4, 0, 0.2, 1],
    },
  },
}
```

#### Step 1.2: 建立主題配置

**檔案**: `app/components/theme/lightTheme.ts`

```typescript
import { ThemeConfiguration } from '@/specs/002-shadcn-redesign/contracts/theme.schema'
import { baseTokens } from '@/constants/Design'

export const lightTheme: ThemeConfiguration = {
  mode: 'light',
  tokens: {
    ...baseTokens,
    colors: {
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#64748b',
      secondaryForeground: '#ffffff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#ffffff',
      foreground: '#0a0a0a',
      card: '#f8f9fa',
      cardForeground: '#0a0a0a',
      muted: '#f1f3f5',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      input: '#ffffff',
      ring: '#3b82f6',
      tabBarActive: '#3b82f6',
      tabBarInactive: '#9ca3af',
      tabBarBackground: '#ffffff',
    },
  },
  paperTheme: {
    dark: false,
    colors: {
      primary: '#3b82f6',
      onPrimary: '#ffffff',
      primaryContainer: '#dbeafe',
      secondary: '#64748b',
      onSecondary: '#ffffff',
      background: '#ffffff',
      onBackground: '#0a0a0a',
      surface: '#f8f9fa',
      onSurface: '#0a0a0a',
      error: '#ef4444',
      outline: '#e5e7eb',
    },
    fonts: {
      regular: { fontFamily: 'System' },
      medium: { fontFamily: 'System' },
      bold: { fontFamily: 'System' },
    },
    roundness: 8,
  },
}
```

**檔案**: `app/components/theme/darkTheme.ts`

```typescript
export const darkTheme: ThemeConfiguration = {
  mode: 'dark',
  tokens: {
    ...baseTokens,
    colors: {
      primary: '#60a5fa',
      primaryForeground: '#0a0a0a',
      secondary: '#94a3b8',
      secondaryForeground: '#0a0a0a',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      background: '#0a0a0a',
      foreground: '#f8f9fa',
      card: '#18181b',
      cardForeground: '#f8f9fa',
      muted: '#27272a',
      mutedForeground: '#a1a1aa',
      border: '#3f3f46',
      input: '#18181b',
      ring: '#60a5fa',
      tabBarActive: '#60a5fa',
      tabBarInactive: '#71717a',
      tabBarBackground: '#0a0a0a',
    },
  },
  paperTheme: {
    dark: true,
    colors: {
      primary: '#60a5fa',
      onPrimary: '#0a0a0a',
      primaryContainer: '#1e3a8a',
      secondary: '#94a3b8',
      onSecondary: '#0a0a0a',
      background: '#0a0a0a',
      onBackground: '#f8f9fa',
      surface: '#18181b',
      onSurface: '#f8f9fa',
      error: '#f87171',
      outline: '#3f3f46',
    },
    fonts: {
      regular: { fontFamily: 'System' },
      medium: { fontFamily: 'System' },
      bold: { fontFamily: 'System' },
    },
    roundness: 8,
  },
}
```

#### Step 1.3: 建立 Theme Provider

**檔案**: `app/components/theme/ThemeProvider.tsx`

```typescript
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ThemeContextValue,
  ThemePreference,
  ThemePreferenceMode,
  THEME_STORAGE_KEY,
  DEFAULT_THEME_PREFERENCE,
} from '@/specs/002-shadcn-redesign/contracts/theme.schema'
import { lightTheme } from './lightTheme'
import { darkTheme } from './darkTheme'

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferenceMode, setPreferenceMode] = useState<ThemePreferenceMode>('system')
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  )

  // 載入主題偏好設定
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored) {
        const preference: ThemePreference = JSON.parse(stored)
        setPreferenceMode(preference.mode)
      }
    })
  }, [])

  // 監聽系統主題變更
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme)
    })
    return () => subscription.remove()
  }, [])

  // 計算實際啟用的主題模式
  const themeMode = useMemo(() => {
    if (preferenceMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light'
    }
    return preferenceMode
  }, [preferenceMode, systemColorScheme])

  // 選擇主題配置
  const theme = useMemo(() => {
    return themeMode === 'dark' ? darkTheme : lightTheme
  }, [themeMode])

  // 設定主題偏好
  const setThemeModeHandler = useCallback((mode: ThemePreferenceMode) => {
    setPreferenceMode(mode)
    const preference: ThemePreference = {
      mode,
      lastUpdated: new Date().toISOString(),
    }
    AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference))
  }, [])

  // 切換主題
  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeModeHandler(newMode)
  }, [themeMode, setThemeModeHandler])

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeMode,
      preferenceMode,
      setThemeMode: setThemeModeHandler,
      toggleTheme,
    }),
    [theme, themeMode, preferenceMode, setThemeModeHandler, toggleTheme]
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
```

**檔案**: `app/components/theme/useTheme.ts`

```typescript
import { useContext } from 'react'
import { ThemeContext } from './ThemeProvider'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

#### Step 1.4: 整合至 App Root

**檔案**: `app/app/_layout.tsx`

```typescript
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        {/* ... existing screens */}
      </Stack>
    </ThemeProvider>
  )
}
```

### Phase 2: 核心 UI 元件 (P1-P2) - 預估 2-3 天

#### Step 2.1: 建立 Button 元件 (含測試)

**TDD 流程**:
1. 先寫測試 (`__tests__/ui/Button.test.tsx`)
2. 實作元件 (`components/ui/Button.tsx`)
3. 驗證測試通過
4. Snapshot testing

**範例測試** (紅階段):
```typescript
// __tests__/ui/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '@/components/ui/Button'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

describe('Button', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button onPress={() => {}}>Click Me</Button>
      </ThemeProvider>
    )
    expect(getByText('Click Me')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <ThemeProvider>
        <Button onPress={onPress}>Click Me</Button>
      </ThemeProvider>
    )
    fireEvent.press(getByText('Click Me'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <ThemeProvider>
        <Button onPress={onPress} disabled>
          Click Me
        </Button>
      </ThemeProvider>
    )
    fireEvent.press(getByText('Click Me'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const { toJSON } = render(
      <ThemeProvider>
        <Button onPress={() => {}}>Click Me</Button>
      </ThemeProvider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
```

#### Step 2.2: 實作其他核心元件

重複 TDD 流程實作：
- `Card.tsx` + `Card.test.tsx`
- `Input.tsx` + `Input.test.tsx`
- `Badge.tsx` + `Badge.test.tsx`
- `Skeleton.tsx` + `Skeleton.test.tsx`

### Phase 3: 底部導航 (P2) - 預估 1 天

#### Step 3.1: 客製化 Expo Router Tabs

**檔案**: `app/app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router'
import { useTheme } from '@/components/theme/useTheme'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tokens.colors.tabBarActive,
        tabBarInactiveTintColor: theme.tokens.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tokens.colors.tabBarBackground,
          borderTopColor: theme.tokens.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: theme.tokens.typography.fontSize.xs,
          fontWeight: theme.tokens.typography.fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
```

## Testing Strategy

### 單元測試 (Jest + Testing Library)

**執行測試**:
```bash
cd app
npm test                    # 執行所有測試
npm test -- Button.test.tsx # 執行特定測試
npm run test:coverage       # 測試覆蓋率報告
```

**測試覆蓋目標**:
- 元件 Props: 100%
- 主題邏輯: 100%
- 互動事件: 100%

### E2E 測試 (Detox)

**執行 E2E 測試**:
```bash
detox build --configuration ios
detox test --configuration ios
```

**測試案例** (範例):
```typescript
// e2e/theme-switching.test.ts
describe('Theme Switching', () => {
  it('should switch theme when toggle button is pressed', async () => {
    await element(by.id('theme-toggle-button')).tap()
    await expect(element(by.id('app-background'))).toHaveBackgroundColor('#0a0a0a')
  })
})
```

## Performance Testing

### 動畫效能測試

```typescript
// __tests__/performance/animation.test.ts
import { measurePerformance } from 'react-native-performance'

describe('Animation Performance', () => {
  it('should maintain 60 FPS during theme toggle', async () => {
    const { fps } = await measurePerformance(() => {
      toggleTheme()
    })
    expect(fps).toBeGreaterThanOrEqual(60)
  })
})
```

## Troubleshooting

### 常見問題

**Q: 主題切換有閃爍**
A: 確保使用 `useMemo` 優化 Context value，並檢查元件是否使用 `React.memo`

**Q: AsyncStorage 讀取延遲**
A: 在 App 啟動時預載主題，避免阻塞渲染

**Q: TypeScript 型別錯誤**
A: 確保已正確 import `theme.schema.ts` 中的型別定義

## Next Steps

完成 Phase 1-3 後：
1. 執行 `/speckit.tasks` 產生詳細 TDD 任務清單
2. 按照 tasks.md 的任務順序逐步實作
3. 每完成一個任務，執行測試驗證
4. 所有測試通過後，進入下一個任務

## Resources

- [React Native Paper Theming](https://callstack.github.io/react-native-paper/docs/guides/theming/)
- [Reanimated 3 Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Expo Router Tabs](https://docs.expo.dev/router/advanced/tabs/)
- [shadcn/ui Principles](https://ui.shadcn.com/docs)
