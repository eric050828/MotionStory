/**
 * useTheme Hook
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Custom hook for accessing theme context.
 * Must be used within a ThemeProvider component.
 */

import { useContext } from 'react'
import { ThemeContext } from './ThemeProvider'
import type { ThemeContextValue } from '../../types/theme'

/**
 * Access the current theme configuration and theme controls.
 *
 * @throws Error if used outside of ThemeProvider
 * @returns ThemeContextValue containing theme, themeMode, preferenceMode, and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, themeMode, toggleTheme } = useTheme()
 *
 *   return (
 *     <View style={{ backgroundColor: theme.tokens.colors.background }}>
 *       <Text style={{ color: theme.tokens.colors.foreground }}>
 *         Current mode: {themeMode}
 *       </Text>
 *       <Button onPress={toggleTheme}>Toggle Theme</Button>
 *     </View>
 *   )
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
