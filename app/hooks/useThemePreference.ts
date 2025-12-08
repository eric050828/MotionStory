/**
 * useThemePreference Hook
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Convenience hook for managing theme preferences.
 * This is a wrapper around useTheme that focuses specifically on
 * theme preference management (system/light/dark mode switching).
 */

import { useTheme } from '../components/theme/useTheme'
import type { ThemePreferenceMode } from '../types/theme'

/**
 * Manage theme preference settings.
 *
 * @returns Object with current preferenceMode and setThemeMode function
 *
 * @example
 * ```tsx
 * function ThemeSettings() {
 *   const { preferenceMode, setThemeMode } = useThemePreference()
 *
 *   return (
 *     <View>
 *       <Text>Current: {preferenceMode}</Text>
 *       <Button onPress={() => setThemeMode('light')}>Light</Button>
 *       <Button onPress={() => setThemeMode('dark')}>Dark</Button>
 *       <Button onPress={() => setThemeMode('system')}>System</Button>
 *     </View>
 *   )
 * }
 * ```
 */
export function useThemePreference() {
  const { preferenceMode, setThemeMode, toggleTheme } = useTheme()

  return {
    /** Current theme preference mode */
    preferenceMode,

    /** Set theme preference (light, dark, or system) */
    setThemeMode,

    /** Toggle between light and dark themes */
    toggleTheme,

    /** Check if using system theme */
    isSystemTheme: preferenceMode === 'system',

    /** Check if using light theme */
    isLightTheme: preferenceMode === 'light',

    /** Check if using dark theme */
    isDarkTheme: preferenceMode === 'dark',
  }
}
