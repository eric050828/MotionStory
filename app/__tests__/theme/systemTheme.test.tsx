/**
 * System Theme Synchronization Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests automatic theme sync with OS-level appearance settings
 */

import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../components/theme/useTheme'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

// Mock Appearance API
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(),
  removeChangeListener: jest.fn(),
}))

describe('System Theme Synchronization', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await AsyncStorage.clear()
  })

  describe('Appearance API Integration', () => {
    it('should read system theme on mount when mode is "system"', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(Appearance.getColorScheme).toHaveBeenCalled()
        expect(result.current.preferenceMode).toBe('system')
        expect(result.current.themeMode).toBe('dark') // Resolved from system
        expect(result.current.theme.tokens.colors.background).toBe('#09090B') // Dark theme
      })
    })

    it('should register appearance change listener when mode is "system"', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(Appearance.addChangeListener).toHaveBeenCalled()
      })
    })

    it('should not actively listen when mode is "light" or "dark"', async () => {
      const storedPreference = JSON.stringify({ mode: 'light', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('light')
        expect(result.current.themeMode).toBe('light')
      })
    })

    it('should cleanup listener on unmount', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { unmount } = renderHook(() => useTheme(), { wrapper })

      unmount()

      await waitFor(() => {
        expect(Appearance.removeChangeListener).toHaveBeenCalled()
      })
    })
  })

  describe('Dynamic System Theme Changes', () => {
    it('should update theme when system switches from light to dark', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      let changeListener: ((preferences: any) => void) | null = null
      ;(Appearance.addChangeListener as jest.Mock).mockImplementation((listener) => {
        changeListener = listener
        return { remove: jest.fn() }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('system')
        expect(result.current.themeMode).toBe('light') // Resolved from system
        expect(result.current.theme.tokens.colors.background).toBe('#ffffff') // Light
      })

      // Simulate system theme change to dark
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')
      act(() => {
        if (changeListener) {
          changeListener({ colorScheme: 'dark' })
        }
      })

      await waitFor(() => {
        expect(result.current.theme.tokens.colors.background).toBe('#09090B') // Dark
      })
    })

    it('should update theme when system switches from dark to light', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')

      let changeListener: ((preferences: any) => void) | null = null
      ;(Appearance.addChangeListener as jest.Mock).mockImplementation((listener) => {
        changeListener = listener
        return { remove: jest.fn() }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.theme.tokens.colors.background).toBe('#09090B') // Dark
      })

      // Simulate system theme change to light
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')
      act(() => {
        if (changeListener) {
          changeListener({ colorScheme: 'light' })
        }
      })

      await waitFor(() => {
        expect(result.current.theme.tokens.colors.background).toBe('#ffffff') // Light
      })
    })

    it('should ignore system changes when mode is "light"', async () => {
      const storedPreference = JSON.stringify({ mode: 'light', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      let changeListener: ((preferences: any) => void) | null = null
      ;(Appearance.addChangeListener as jest.Mock).mockImplementation((listener) => {
        changeListener = listener
        return { remove: jest.fn() }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(result.current.preferenceMode).toBe('light')
      expect(result.current.themeMode).toBe('light')
      expect(result.current.theme.tokens.colors.background).toBe('#ffffff')

      // Simulate system theme change to dark
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')
      act(() => {
        if (changeListener) {
          changeListener({ colorScheme: 'dark' })
        }
      })

      // Should still be light (user preference overrides system)
      expect(result.current.theme.tokens.colors.background).toBe('#ffffff')
    })

    it('should ignore system changes when mode is "dark"', async () => {
      const storedPreference = JSON.stringify({ mode: 'dark', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')

      let changeListener: ((preferences: any) => void) | null = null
      ;(Appearance.addChangeListener as jest.Mock).mockImplementation((listener) => {
        changeListener = listener
        return { remove: jest.fn() }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(result.current.preferenceMode).toBe('dark')
      expect(result.current.themeMode).toBe('dark')
      expect(result.current.theme.tokens.colors.background).toBe('#09090B')

      // Simulate system theme change to light
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')
      act(() => {
        if (changeListener) {
          changeListener({ colorScheme: 'light' })
        }
      })

      // Should still be dark (user preference overrides system)
      expect(result.current.theme.tokens.colors.background).toBe('#09090B')
    })
  })

  describe('Mode Switching Behavior', () => {
    it('should start listening when switching to "system" mode', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Initially light mode (default)
      expect(result.current.preferenceMode).toBe('system') // Default is system
      expect(result.current.themeMode).toBe('light') // Resolved from system (mocked as light)

      // Switch to system mode explicitly with dark system
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')
      act(() => {
        result.current.setThemeMode('system')
      })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('system')
        expect(Appearance.addChangeListener).toHaveBeenCalled()
        expect(result.current.themeMode).toBe('dark') // Resolved from system
        expect(result.current.theme.tokens.colors.background).toBe('#09090B') // Dark from system
      })
    })

    it('should stop listening when switching from "system" to "light"', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      const removeListener = jest.fn()
      ;(Appearance.addChangeListener as jest.Mock).mockReturnValue({ remove: removeListener })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('system')
      })

      // Switch to light mode
      act(() => {
        result.current.setThemeMode('light')
      })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('light')
        expect(result.current.themeMode).toBe('light')
        // Listener should be removed
        expect(removeListener).toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle null system color scheme gracefully', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue(null)

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('system')
        expect(result.current.themeMode).toBe('light') // Resolved from null -> light fallback
        // Should fallback to light theme when system returns null
        expect(result.current.theme.tokens.colors.background).toBe('#ffffff')
      })
    })

    it('should handle rapid system theme changes', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      let changeListener: ((preferences: any) => void) | null = null
      ;(Appearance.addChangeListener as jest.Mock).mockImplementation((listener) => {
        changeListener = listener
        return { remove: jest.fn() }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Rapid system changes
      act(() => {
        if (changeListener) {
          changeListener({ colorScheme: 'dark' })
          changeListener({ colorScheme: 'light' })
          changeListener({ colorScheme: 'dark' })
          changeListener({ colorScheme: 'light' })
        }
      })

      await waitFor(() => {
        // Should end up with light theme
        expect(result.current.theme.tokens.colors.background).toBe('#ffffff')
      })
    })
  })

  describe('Performance', () => {
    it('should handle system theme change in less than 300ms', async () => {
      const storedPreference = JSON.stringify({ mode: 'system', lastUpdated: new Date().toISOString() })
      await AsyncStorage.setItem('@motionstory/theme_preference', storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      let changeListener: ((preferences: any) => void) | null = null
      ;(Appearance.addChangeListener as jest.Mock).mockImplementation((listener) => {
        changeListener = listener
        return { remove: jest.fn() }
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      await waitFor(() => {
        expect(result.current.preferenceMode).toBe('system')
      })

      // Measure system theme change performance
      const startTime = performance.now()

      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')
      act(() => {
        if (changeListener) {
          changeListener({ colorScheme: 'dark' })
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(300)
      await waitFor(() => {
        expect(result.current.theme.tokens.colors.background).toBe('#09090B')
      })
    })
  })
})
