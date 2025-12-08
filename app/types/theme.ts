/**
 * Theme Schema: TypeScript 型別定義
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * 此檔案定義設計系統的完整型別介面,用於型別安全與 IDE 自動完成。
 * 所有主題相關的資料結構都應遵循此 schema。
 */

import type { ViewStyle, TextStyle, AccessibilityRole } from 'react-native'

// ============================================================================
// Design Tokens
// ============================================================================

/**
 * 顏色 Tokens
 * 定義所有主題顏色的標準化命名
 */
export interface ColorTokens {
  // Primary Colors
  primary: string
  primaryForeground: string

  // Secondary Colors
  secondary: string
  secondaryForeground: string

  // Semantic Colors
  success: string
  warning: string
  error: string
  info: string

  // Neutral Colors
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string

  // UI Elements
  border: string
  input: string
  ring: string

  // Navigation
  tabBarActive: string
  tabBarInactive: string
  tabBarBackground: string
}

/**
 * 間距 Tokens
 * 基於 4dp grid system
 */
export interface SpacingTokens {
  xs: number    // 4
  sm: number    // 8
  md: number    // 16
  lg: number    // 24
  xl: number    // 32
  xxl: number   // 48
}

/**
 * 字型 Tokens
 */
export interface TypographyTokens {
  fontFamily: {
    regular: string
    medium: string
    bold: string
  }
  fontSize: {
    xs: number    // 12
    sm: number    // 14
    base: number  // 16
    lg: number    // 18
    xl: number    // 20
    xxl: number   // 24
    xxxl: number  // 32
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

/**
 * 圓角 Tokens
 */
export interface BorderRadiusTokens {
  none: number   // 0
  sm: number     // 4
  md: number     // 8
  lg: number     // 12
  full: number   // 9999
}

/**
 * 陰影 Tokens
 */
export interface ShadowStyle {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number  // Android only
}

export interface ShadowTokens {
  sm: ShadowStyle
  md: ShadowStyle
  lg: ShadowStyle
}

/**
 * 動畫 Tokens
 */
export interface AnimationTokens {
  duration: {
    fast: number    // 150
    normal: number  // 300
    slow: number    // 500
  }
  easing: {
    easeIn: [number, number, number, number]
    easeOut: [number, number, number, number]
    easeInOut: [number, number, number, number]
  }
}

/**
 * 完整的 Design Tokens
 */
export interface DesignTokens {
  colors: ColorTokens
  spacing: SpacingTokens
  typography: TypographyTokens
  borderRadius: BorderRadiusTokens
  shadows: ShadowTokens
  animation: AnimationTokens
}

// ============================================================================
// Theme Configuration
// ============================================================================

/**
 * React Native Paper MD3 主題顏色 (簡化版)
 */
export interface MD3Colors {
  primary: string
  onPrimary: string
  primaryContainer: string
  secondary: string
  onSecondary: string
  background: string
  onBackground: string
  surface: string
  onSurface: string
  error: string
  outline: string
  [key: string]: string
}

/**
 * React Native Paper MD3 字型
 */
export interface MD3Fonts {
  regular: { fontFamily: string }
  medium: { fontFamily: string }
  bold: { fontFamily: string }
  [key: string]: { fontFamily: string }
}

/**
 * React Native Paper 主題介面
 */
export interface PaperTheme {
  dark: boolean
  colors: MD3Colors
  fonts: MD3Fonts
  roundness: number
}

/**
 * 主題模式
 */
export type ThemeMode = 'light' | 'dark'

/**
 * 完整的主題配置
 * 整合 shadcn tokens 與 React Native Paper theme
 */
export interface ThemeConfiguration {
  mode: ThemeMode
  tokens: DesignTokens
  paperTheme: PaperTheme
}

// ============================================================================
// Theme Preference (AsyncStorage)
// ============================================================================

/**
 * 主題偏好模式
 * - 'light': 強制淺色模式
 * - 'dark': 強制深色模式
 * - 'system': 跟隨系統設定
 */
export type ThemePreferenceMode = 'light' | 'dark' | 'system'

/**
 * 使用者主題偏好設定
 * 儲存於 AsyncStorage: @motionstory/theme_preference
 */
export interface ThemePreference {
  mode: ThemePreferenceMode
  lastUpdated: string  // ISO 8601 timestamp
}

// ============================================================================
// Theme Context
// ============================================================================

/**
 * Theme Provider Context 值
 */
export interface ThemeContextValue {
  /** 當前啟用的主題配置 */
  theme: ThemeConfiguration

  /** 當前主題模式 (考慮 system 設定後的實際值) */
  themeMode: ThemeMode

  /** 使用者偏好模式 ('system' 表示跟隨系統) */
  preferenceMode: ThemePreferenceMode

  /** 設定主題偏好 */
  setThemeMode: (mode: ThemePreferenceMode) => void

  /** 切換主題 (light <-> dark) */
  toggleTheme: () => void
}

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * 元件變體
 */
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive'

/**
 * 元件尺寸
 */
export type ComponentSize = 'sm' | 'md' | 'lg'

/**
 * 元件狀態類型
 */
export type StatusType = 'success' | 'warning' | 'error' | 'info'

/**
 * 所有 UI 元件的基礎 Props
 */
export interface BaseComponentProps {
  variant?: ComponentVariant
  size?: ComponentSize

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: AccessibilityRole

  // Testing
  testID?: string

  // Custom styling (escape hatch)
  style?: ViewStyle | TextStyle
}

/**
 * Button 元件 Props
 */
export interface ButtonProps extends BaseComponentProps {
  onPress: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

/**
 * Card 元件 Props
 */
export interface CardProps extends BaseComponentProps {
  children: React.ReactNode
  onPress?: () => void
  elevation?: 'sm' | 'md' | 'lg'
}

/**
 * Input 元件 Props
 */
export interface InputProps extends BaseComponentProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  secureTextEntry?: boolean
  multiline?: boolean
  numberOfLines?: number
}

/**
 * Badge 元件 Props
 */
export interface BadgeProps extends BaseComponentProps {
  children: React.ReactNode
  status?: StatusType
}

/**
 * Skeleton 元件 Props
 */
export interface SkeletonProps extends BaseComponentProps {
  width: number | string
  height: number | string
  borderRadius?: number
  animated?: boolean
}

/**
 * Toast 元件 Props
 */
export interface ToastProps {
  visible: boolean
  message: string
  type?: StatusType
  duration?: number
  onDismiss: () => void
}

/**
 * Bottom Navigation Tab Item Props
 */
export interface TabItemProps {
  name: string
  icon: (props: { focused: boolean; color: string; size: number }) => React.ReactNode
  label: string
  badge?: number | string
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 深度部分化 (用於主題覆寫)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 主題覆寫配置
 * 允許部分覆寫主題 tokens
 */
export type ThemeOverride = DeepPartial<DesignTokens>

// ============================================================================
// Constants
// ============================================================================

/**
 * AsyncStorage Key
 */
export const THEME_STORAGE_KEY = '@motionstory/theme_preference' as const

/**
 * 預設主題偏好
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = {
  mode: 'system',
  lastUpdated: new Date().toISOString(),
} as const

// ============================================================================
// Type Guards
// ============================================================================

/**
 * 檢查是否為有效的主題模式
 */
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

/**
 * 檢查是否為有效的主題偏好模式
 */
export function isThemePreferenceMode(value: unknown): value is ThemePreferenceMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * 檢查是否為有效的元件變體
 */
export function isComponentVariant(value: unknown): value is ComponentVariant {
  return (
    value === 'default' ||
    value === 'outline' ||
    value === 'ghost' ||
    value === 'destructive'
  )
}

/**
 * 檢查是否為有效的元件尺寸
 */
export function isComponentSize(value: unknown): value is ComponentSize {
  return value === 'sm' || value === 'md' || value === 'lg'
}

/**
 * 檢查是否為有效的狀態類型
 */
export function isStatusType(value: unknown): value is StatusType {
  return (
    value === 'success' ||
    value === 'warning' ||
    value === 'error' ||
    value === 'info'
  )
}
