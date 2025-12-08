/**
 * ThemeProvider Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Tests theme initialization, switching, and system mode handling.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { Text, Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeProvider } from '../../components/theme/ThemeProvider'
import { useTheme } from '../../components/theme/useTheme'
import { THEME_STORAGE_KEY } from '../../types/theme'

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

// Test component that uses the theme
const TestComponent = () => {
  const { theme, themeMode, preferenceMode } = useTheme()
  return (
    <>
      <Text testID="theme-mode">{themeMode}</Text>
      <Text testID="preference-mode">{preferenceMode}</Text>
      <Text testID="primary-color">{theme.tokens.colors.primary}</Text>
    </>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with system theme preference when no stored preference', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
        expect(getByTestId('theme-mode').props.children).toBe('light')
      })
    })

    it('should initialize with stored light theme preference', async () => {
      const storedPreference = JSON.stringify({
        mode: 'light',
        lastUpdated: new Date().toISOString(),
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedPreference)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('light')
        expect(getByTestId('theme-mode').props.children).toBe('light')
        expect(getByTestId('primary-color').props.children).toBe('#3b82f6') // Light theme primary
      })
    })

    it('should initialize with stored dark theme preference', async () => {
      const storedPreference = JSON.stringify({
        mode: 'dark',
        lastUpdated: new Date().toISOString(),
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedPreference)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('dark')
        expect(getByTestId('theme-mode').props.children).toBe('dark')
        expect(getByTestId('primary-color').props.children).toBe('#60a5fa') // Dark theme primary
      })
    })

    it('should handle invalid stored preference gracefully', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json')
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
        expect(getByTestId('theme-mode').props.children).toBe('light')
      })
    })
  })

  describe('System Theme Mode', () => {
    it('should use system light theme when preference is system', async () => {
      const storedPreference = JSON.stringify({
        mode: 'system',
        lastUpdated: new Date().toISOString(),
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
        expect(getByTestId('theme-mode').props.children).toBe('light')
        expect(getByTestId('primary-color').props.children).toBe('#3b82f6')
      })
    })

    it('should use system dark theme when preference is system', async () => {
      const storedPreference = JSON.stringify({
        mode: 'system',
        lastUpdated: new Date().toISOString(),
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
        expect(getByTestId('theme-mode').props.children).toBe('dark')
        expect(getByTestId('primary-color').props.children).toBe('#60a5fa')
      })
    })

    it('should default to light theme when system returns null', async () => {
      const storedPreference = JSON.stringify({
        mode: 'system',
        lastUpdated: new Date().toISOString(),
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedPreference)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue(null)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('theme-mode').props.children).toBe('light')
      })
    })
  })

  describe('Theme Context Value', () => {
    it('should provide complete theme configuration', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

      const TestCompleteTheme = () => {
        const { theme } = useTheme()
        return (
          <>
            <Text testID="spacing-md">{theme.tokens.spacing.md}</Text>
            <Text testID="font-size-base">{theme.tokens.typography.fontSize.base}</Text>
            <Text testID="border-radius-md">{theme.tokens.borderRadius.md}</Text>
            <Text testID="paper-dark">{theme.paperTheme.dark.toString()}</Text>
          </>
        )
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestCompleteTheme />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('spacing-md').props.children).toBe(16)
        expect(getByTestId('font-size-base').props.children).toBe(16)
        expect(getByTestId('border-radius-md').props.children).toBe(8)
        expect(getByTestId('paper-dark').props.children).toBe('false')
      })
    })
  })
})
