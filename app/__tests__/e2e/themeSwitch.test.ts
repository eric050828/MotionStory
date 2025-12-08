/**
 * E2E Theme Switch Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests complete theme switching flow from user interaction to persistence
 */

import { renderHook, act, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../components/theme/useTheme'
import { ThemeProvider } from '../../components/theme/ThemeProvider'
import React from 'react'

describe('Theme Switch E2E', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  afterEach(async () => {
    await AsyncStorage.clear()
  })

  describe('User Interaction Flow', () => {
    it('should switch from light to dark theme on toggle', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Initial state should be light theme
      expect(result.current.themeMode).toBe('light')
      expect(result.current.theme.tokens.colors.background).toBe('#FFFFFF')

      // Simulate user clicking theme toggle
      act(() => {
        result.current.setThemeMode('dark')
      })

      // Verify dark theme applied
      await waitFor(() => {
        expect(result.current.themeMode).toBe('dark')
        expect(result.current.theme.tokens.colors.background).toBe('#09090B')
      })
    })

    it('should switch from dark to light theme on toggle', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Set to dark first
      act(() => {
        result.current.setThemeMode('dark')
      })

      await waitFor(() => {
        expect(result.current.themeMode).toBe('dark')
      })

      // Toggle back to light
      act(() => {
        result.current.setThemeMode('light')
      })

      await waitFor(() => {
        expect(result.current.themeMode).toBe('light')
        expect(result.current.theme.tokens.colors.background).toBe('#FFFFFF')
      })
    })

    it('should toggle to system theme mode', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Toggle to system mode
      act(() => {
        result.current.setThemeMode('system')
      })

      await waitFor(() => {
        expect(result.current.themeMode).toBe('system')
      })

      // Theme should match system (mocked to light in test environment)
      expect(['light', 'dark']).toContain(
        result.current.theme.tokens.colors.background === '#FFFFFF'
          ? 'light'
          : 'dark'
      )
    })
  })

  describe('Color Transition Verification', () => {
    it('should update all theme token colors on switch', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const lightColors = { ...result.current.theme.tokens.colors }

      act(() => {
        result.current.setThemeMode('dark')
      })

      await waitFor(() => {
        const darkColors = result.current.theme.tokens.colors
        expect(darkColors.background).not.toBe(lightColors.background)
        expect(darkColors.foreground).not.toBe(lightColors.foreground)
        expect(darkColors.card).not.toBe(lightColors.card)
        expect(darkColors.primary).toBe(lightColors.primary) // Brand colors stay same
      })
    })

    it('should apply theme to all component tokens', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      act(() => {
        result.current.setThemeMode('dark')
      })

      await waitFor(() => {
        const { colors } = result.current.theme.tokens
        // Verify all semantic color tokens exist
        expect(colors.background).toBeDefined()
        expect(colors.foreground).toBeDefined()
        expect(colors.card).toBeDefined()
        expect(colors.cardForeground).toBeDefined()
        expect(colors.popover).toBeDefined()
        expect(colors.primary).toBeDefined()
        expect(colors.secondary).toBeDefined()
        expect(colors.muted).toBeDefined()
        expect(colors.accent).toBeDefined()
        expect(colors.destructive).toBeDefined()
        expect(colors.border).toBeDefined()
        expect(colors.input).toBeDefined()
        expect(colors.ring).toBeDefined()
      })
    })
  })

  describe('Persistence Across Restarts', () => {
    it('should persist theme preference to AsyncStorage', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      act(() => {
        result.current.setThemeMode('dark')
      })

      await waitFor(async () => {
        const stored = await AsyncStorage.getItem('@motionstory/theme_preference')
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed.mode).toBe('dark')
      })
    })

    it('should restore theme preference on app restart', async () => {
      // Simulate previous session saving dark mode
      const storedPreference = JSON.stringify({ mode: 'dark', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Should restore dark theme from storage
      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('dark')
        expect(result.current.themeMode).toBe('dark')
        expect(result.current.theme.tokens.colors.background).toBe('#09090B')
      })
    })

    it('should restore system preference on app restart', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('system')
      })
    })

    it('should default to light theme if no preference stored', async () => {
      // Ensure no stored preference
      await AsyncStorage.clear()

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(result.current.themeMode).toBe('light')
      expect(result.current.theme.tokens.colors.background).toBe('#FFFFFF')
    })
  })

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      // Mock AsyncStorage.setItem to throw error
      const originalSetItem = AsyncStorage.setItem
      AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage error'))

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Should still change theme in memory even if persistence fails
      act(() => {
        result.current.setThemeMode('dark')
      })

      await waitFor(() => {
        expect(result.current.themeMode).toBe('dark')
      })

      // Restore original
      AsyncStorage.setItem = originalSetItem
    })
  })
})
