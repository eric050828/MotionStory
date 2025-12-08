/**
 * ThemeProvider Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Provides theme context to the entire application with support for:
 * - Light/Dark theme modes
 * - System theme preference
 * - AsyncStorage persistence
 * - React Native Paper integration
 */

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react'
import { Appearance, type ColorSchemeName } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  ThemeContextValue,
  ThemeConfiguration,
  ThemeMode,
  ThemePreferenceMode,
  ThemePreference,
} from '../../types/theme'
import {
  THEME_STORAGE_KEY,
  DEFAULT_THEME_PREFERENCE,
  isThemePreferenceMode,
} from '../../types/theme'
import { lightTheme } from './lightTheme'
import { darkTheme } from './darkTheme'

// ============================================================================
// Theme Context
// ============================================================================

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// ============================================================================
// ThemeProvider Component
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // State
  const [preferenceMode, setPreferenceModeState] = useState<ThemePreferenceMode>('system')
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  )

  // ============================================================================
  // Theme Resolution
  // ============================================================================

  /**
   * Resolve actual theme mode based on preference and system setting
   */
  const themeMode: ThemeMode = useMemo(() => {
    if (preferenceMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light'
    }
    return preferenceMode
  }, [preferenceMode, systemColorScheme])

  /**
   * Get theme configuration based on resolved mode
   */
  const theme: ThemeConfiguration = useMemo(() => {
    return themeMode === 'dark' ? darkTheme : lightTheme
  }, [themeMode])

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Load theme preference from AsyncStorage on mount
   */
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY)

        if (stored) {
          const preference: ThemePreference = JSON.parse(stored)

          // Validate mode
          if (isThemePreferenceMode(preference.mode)) {
            setPreferenceModeState(preference.mode)
          } else {
            // Invalid mode, use default
            setPreferenceModeState(DEFAULT_THEME_PREFERENCE.mode)
          }
        } else {
          // No stored preference, use default
          setPreferenceModeState(DEFAULT_THEME_PREFERENCE.mode)
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error)
        setPreferenceModeState(DEFAULT_THEME_PREFERENCE.mode)
      }
    }

    loadThemePreference()
  }, [])

  /**
   * Listen to system theme changes when in system mode
   */
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme)
    })

    return () => subscription.remove()
  }, [])

  // ============================================================================
  // Theme Actions
  // ============================================================================

  /**
   * Set theme preference and persist to AsyncStorage
   */
  const setThemeMode = useCallback(async (mode: ThemePreferenceMode) => {
    setPreferenceModeState(mode)

    try {
      const preference: ThemePreference = {
        mode,
        lastUpdated: new Date().toISOString(),
      }
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference))
    } catch (error) {
      console.error('Failed to save theme preference:', error)
      // Continue execution even if persistence fails
    }
  }, [])

  /**
   * Toggle between light and dark themes
   * If currently in system mode, switches to explicit light/dark
   */
  const toggleTheme = useCallback(() => {
    const currentMode = preferenceMode === 'system' ? themeMode : preferenceMode
    const newMode: ThemePreferenceMode = currentMode === 'light' ? 'dark' : 'light'
    setThemeMode(newMode)
  }, [preferenceMode, themeMode, setThemeMode])

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: ThemeContextValue = useMemo(
    () => ({
      theme,
      themeMode,
      preferenceMode,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, preferenceMode, setThemeMode, toggleTheme]
  )

  // ============================================================================
  // Render
  // ============================================================================

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
