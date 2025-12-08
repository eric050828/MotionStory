/**
 * useTheme Hook Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Tests useTheme hook context subscription and error handling.
 */

import React from 'react'
import { renderHook } from '@testing-library/react-native'
import { Text } from 'react-native'
import { useTheme } from '../../components/theme/useTheme'
import { ThemeProvider } from '../../components/theme/ThemeProvider'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

// Mock Appearance
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native')
  return {
    ...RN,
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  }
})

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
  })

  it('should throw error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within a ThemeProvider')

    console.error = originalError
  })

  it('should return theme context when used inside ThemeProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.theme).toBeDefined()
    expect(result.current.themeMode).toBeDefined()
    expect(result.current.preferenceMode).toBeDefined()
    expect(result.current.setThemeMode).toBeInstanceOf(Function)
    expect(result.current.toggleTheme).toBeInstanceOf(Function)
  })

  it('should return correct theme configuration', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme.tokens).toBeDefined()
    expect(result.current.theme.tokens.colors).toBeDefined()
    expect(result.current.theme.tokens.spacing).toBeDefined()
    expect(result.current.theme.tokens.typography).toBeDefined()
    expect(result.current.theme.tokens.borderRadius).toBeDefined()
    expect(result.current.theme.tokens.shadows).toBeDefined()
    expect(result.current.theme.tokens.animation).toBeDefined()
  })

  it('should return correct Paper theme integration', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme.paperTheme).toBeDefined()
    expect(result.current.theme.paperTheme.colors).toBeDefined()
    expect(result.current.theme.paperTheme.fonts).toBeDefined()
    expect(result.current.theme.paperTheme.roundness).toBeDefined()
  })

  it('should provide stable function references', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result, rerender } = renderHook(() => useTheme(), { wrapper })

    const setThemeModeRef = result.current.setThemeMode
    const toggleThemeRef = result.current.toggleTheme

    rerender()

    expect(result.current.setThemeMode).toBe(setThemeModeRef)
    expect(result.current.toggleTheme).toBe(toggleThemeRef)
  })
})
