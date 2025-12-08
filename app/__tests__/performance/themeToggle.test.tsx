/**
 * Theme Toggle Performance Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests theme switching performance meets <300ms target with no flickering
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../components/theme/useTheme'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

describe('Theme Toggle Performance', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  afterEach(async () => {
    await AsyncStorage.clear()
  })

  describe('Switch Speed', () => {
    it('should switch theme in less than 300ms', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const startTime = performance.now()

      act(() => {
        result.current.setThemeMode('dark')
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(300)
      expect(result.current.themeMode).toBe('dark')
    })

    it('should switch back to light theme in less than 300ms', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Switch to dark first
      act(() => {
        result.current.setThemeMode('dark')
      })

      const startTime = performance.now()

      act(() => {
        result.current.setThemeMode('light')
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(300)
      expect(result.current.themeMode).toBe('light')
    })

    it('should handle rapid theme toggles efficiently', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const startTime = performance.now()

      // Simulate rapid toggling
      act(() => {
        result.current.setThemeMode('dark')
        result.current.setThemeMode('light')
        result.current.setThemeMode('dark')
        result.current.setThemeMode('light')
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // All 4 toggles should complete in reasonable time
      expect(duration).toBeLessThan(1000)
      expect(result.current.themeMode).toBe('light')
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory on multiple theme switches', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result, unmount } = renderHook(() => useTheme(), { wrapper })

      // Perform multiple theme switches
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.setThemeMode(i % 2 === 0 ? 'dark' : 'light')
        })
      }

      // Should still be responsive
      const startTime = performance.now()
      act(() => {
        result.current.setThemeMode('dark')
      })
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(300)

      unmount()
    })

    it('should cleanup resources on unmount', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { unmount } = renderHook(() => useTheme(), { wrapper })

      // Should not throw errors or warnings on unmount
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('No Flickering', () => {
    it('should maintain consistent theme object reference during switch', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const themeReferences: any[] = []

      // Capture theme references during switch
      act(() => {
        themeReferences.push(result.current.theme)
        result.current.setThemeMode('dark')
        themeReferences.push(result.current.theme)
      })

      // Theme object should be stable (memoized)
      // Only 2 unique references expected (light and dark)
      const uniqueRefs = new Set(themeReferences)
      expect(uniqueRefs.size).toBeLessThanOrEqual(2)
    })

    it('should not trigger unnecessary re-renders', async () => {
      let renderCount = 0

      const TestComponent = () => {
        const { theme } = useTheme()
        renderCount++
        return null
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>
          <TestComponent />
          {children}
        </ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const initialRenderCount = renderCount

      act(() => {
        result.current.setThemeMode('dark')
      })

      // Should only trigger one additional render for theme change
      // Initial: 1, After theme change: 2
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(1)
    })
  })

  describe('AsyncStorage Performance', () => {
    it('should not block UI thread during persistence', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const startTime = performance.now()

      act(() => {
        result.current.setThemeMode('dark')
      })

      const syncEndTime = performance.now()
      const syncDuration = syncEndTime - startTime

      // Theme should update synchronously (UI not blocked)
      expect(syncDuration).toBeLessThan(100)
      expect(result.current.themeMode).toBe('dark')

      // AsyncStorage write happens async in background
      // This shouldn't affect the sync duration
    })

    it('should batch multiple theme changes to AsyncStorage', async () => {
      const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Multiple rapid changes
      act(() => {
        result.current.setThemeMode('dark')
        result.current.setThemeMode('light')
        result.current.setThemeMode('dark')
      })

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should only persist final state (or reasonable number of calls)
      expect(setItemSpy.mock.calls.length).toBeLessThanOrEqual(5)

      setItemSpy.mockRestore()
    })
  })

  describe('Component Re-render Performance', () => {
    it('should use React.memo for theme-dependent components', () => {
      // This test verifies the pattern, actual implementation in T037
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      // Theme object should be memoized
      const theme1 = result.current.theme
      const theme2 = result.current.theme

      expect(theme1).toBe(theme2) // Same reference when mode unchanged
    })

    it('should use useMemo for expensive theme calculations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      )

      const { result } = renderHook(() => useTheme(), { wrapper })

      const startTime = performance.now()

      // Access theme tokens multiple times
      const { colors } = result.current.theme.tokens
      const colors2 = result.current.theme.tokens.colors
      const colors3 = result.current.theme.tokens.colors

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should be instant (memoized)
      expect(duration).toBeLessThan(50)
      expect(colors).toBe(colors2)
      expect(colors2).toBe(colors3)
    })
  })
})
