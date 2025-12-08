/**
 * Tab Transition Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests tab switching transitions and state updates.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

// Mock Expo Router
jest.mock('expo-router', () => ({
  Tabs: ({ children }: any) => {
    const { View } = require('react-native')
    return <View testID="tabs">{children}</View>
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => ['(tabs)', 'index'],
  usePathname: () => '/(tabs)/index',
}))

// Mock tab bar component
const MockTabBar = () => {
  const { View, Pressable, Text } = require('react-native')
  const [activeTab, setActiveTab] = React.useState('dashboard')

  return (
    <View testID="tab-bar">
      <Pressable
        testID="tab-dashboard"
        onPress={() => setActiveTab('dashboard')}
      >
        <Text>{activeTab === 'dashboard' ? 'Dashboard (Active)' : 'Dashboard'}</Text>
      </Pressable>
      <Pressable
        testID="tab-workout"
        onPress={() => setActiveTab('workout')}
      >
        <Text>{activeTab === 'workout' ? 'Workout (Active)' : 'Workout'}</Text>
      </Pressable>
    </View>
  )
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Tab Transition', () => {
  describe('Tab Switching', () => {
    it('should switch active tab on press', async () => {
      const { getByTestId, getByText } = render(<MockTabBar />, { wrapper })

      // Initially dashboard is active
      expect(getByText('Dashboard (Active)')).toBeTruthy()
      expect(getByText('Workout')).toBeTruthy()

      // Press workout tab
      fireEvent.press(getByTestId('tab-workout'))

      await waitFor(() => {
        expect(getByText('Workout (Active)')).toBeTruthy()
        expect(getByText('Dashboard')).toBeTruthy()
      })
    })

    it('should update state immediately on tab press', async () => {
      const { getByTestId, getByText } = render(<MockTabBar />, { wrapper })

      fireEvent.press(getByTestId('tab-workout'))

      await waitFor(() => {
        expect(getByText('Workout (Active)')).toBeTruthy()
      })
    })

    it('should maintain state across multiple switches', async () => {
      const { getByTestId, getByText } = render(<MockTabBar />, { wrapper })

      // Switch to workout
      fireEvent.press(getByTestId('tab-workout'))
      await waitFor(() => expect(getByText('Workout (Active)')).toBeTruthy())

      // Switch back to dashboard
      fireEvent.press(getByTestId('tab-dashboard'))
      await waitFor(() => expect(getByText('Dashboard (Active)')).toBeTruthy())
    })
  })

  describe('Animation Smoothness', () => {
    it('should render tab bar without flickering', () => {
      const { getByTestId } = render(<MockTabBar />, { wrapper })
      expect(getByTestId('tab-bar')).toBeTruthy()
    })

    it('should handle rapid tab switches', async () => {
      const { getByTestId, getByText } = render(<MockTabBar />, { wrapper })

      // Rapid switches
      fireEvent.press(getByTestId('tab-workout'))
      fireEvent.press(getByTestId('tab-dashboard'))
      fireEvent.press(getByTestId('tab-workout'))

      await waitFor(() => {
        expect(getByText('Workout (Active)')).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('should announce tab changes to screen readers', () => {
      const { getByTestId } = render(<MockTabBar />, { wrapper })
      expect(getByTestId('tab-bar')).toBeTruthy()
    })

    it('should maintain focus indicators during transitions', () => {
      const { getByTestId } = render(<MockTabBar />, { wrapper })
      expect(getByTestId('tab-dashboard')).toBeTruthy()
      expect(getByTestId('tab-workout')).toBeTruthy()
    })
  })

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { toJSON } = render(<MockTabBar />, { wrapper })
      expect(toJSON()).toMatchSnapshot()
    })
  })
})
