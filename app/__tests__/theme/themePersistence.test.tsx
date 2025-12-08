/**
 * Theme Persistence Integration Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Tests AsyncStorage integration for theme preference persistence.
 */

import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeProvider } from '../../components/theme/ThemeProvider'
import { useTheme } from '../../components/theme/useTheme'
import { THEME_STORAGE_KEY, type ThemePreference } from '../../types/theme'

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

const TestComponent = () => {
  const { preferenceMode, setThemeMode, toggleTheme } = useTheme()
  return (
    <>
      <Text testID="preference-mode">{preferenceMode}</Text>
      <Text testID="set-theme" onPress={() => setThemeMode('dark')}>
        Set Dark
      </Text>
      <Text testID="toggle-theme" onPress={() => toggleTheme()}>
        Toggle
      </Text>
    </>
  )
}

describe('Theme Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should load theme preference from AsyncStorage on mount', async () => {
      const storedPreference: ThemePreference = {
        mode: 'dark',
        lastUpdated: new Date().toISOString(),
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedPreference))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY)
      })
    })

    it('should handle missing AsyncStorage data gracefully', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
      })
    })

    it('should handle corrupted AsyncStorage data gracefully', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('{invalid-json}')

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
      })
    })
  })

  describe('Persistence on Change', () => {
    it('should persist theme preference when setThemeMode is called', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
      })

      await act(async () => {
        getByTestId('set-theme').props.onPress()
      })

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          THEME_STORAGE_KEY,
          expect.stringContaining('"mode":"dark"')
        )
      })
    })

    it('should persist theme preference when toggleTheme is called', async () => {
      const storedPreference: ThemePreference = {
        mode: 'light',
        lastUpdated: new Date().toISOString(),
      }
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedPreference))
      ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('light')
      })

      await act(async () => {
        getByTestId('toggle-theme').props.onPress()
      })

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          THEME_STORAGE_KEY,
          expect.stringContaining('"mode":"dark"')
        )
      })
    })

    it('should include lastUpdated timestamp in persisted preference', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        getByTestId('set-theme').props.onPress()
      })

      await waitFor(() => {
        const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls
        const lastCall = setItemCalls[setItemCalls.length - 1]
        const persistedData = JSON.parse(lastCall[1])

        expect(persistedData.lastUpdated).toBeDefined()
        expect(new Date(persistedData.lastUpdated).getTime()).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle AsyncStorage.setItem failure gracefully', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'))

      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        getByTestId('set-theme').props.onPress()
      })

      // Theme should still change in memory even if persistence fails
      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('dark')
      })

      consoleError.mockRestore()
    })

    it('should handle AsyncStorage.getItem failure gracefully', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read error'))

      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should fallback to default system preference
      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
      })

      consoleError.mockRestore()
    })
  })

  describe('Data Validation', () => {
    it('should validate stored preference mode', async () => {
      const invalidPreference = JSON.stringify({
        mode: 'invalid-mode',
        lastUpdated: new Date().toISOString(),
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidPreference)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should fallback to default when invalid mode detected
      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('system')
      })
    })

    it('should validate lastUpdated timestamp', async () => {
      const invalidPreference = JSON.stringify({
        mode: 'dark',
        lastUpdated: 'invalid-timestamp',
      })
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(invalidPreference)

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should still use the mode even if timestamp is invalid
      await waitFor(() => {
        expect(getByTestId('preference-mode').props.children).toBe('dark')
      })
    })
  })
})
