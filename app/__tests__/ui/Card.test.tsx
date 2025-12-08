/**
 * Card Component Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Tests card elevation, press interaction, and content rendering.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { Card } from '../../components/ui/Card'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>,
        { wrapper }
      )
      expect(getByText('Card Content')).toBeTruthy()
    })

    it('should render with testID', () => {
      const { getByTestId } = render(
        <Card testID="test-card">
          <Text>Test</Text>
        </Card>,
        { wrapper }
      )
      expect(getByTestId('test-card')).toBeTruthy()
    })
  })

  describe('Elevation', () => {
    it('should render with small elevation', () => {
      const { getByTestId } = render(
        <Card elevation="sm" testID="card-sm">
          <Text>Small</Text>
        </Card>,
        { wrapper }
      )
      expect(getByTestId('card-sm')).toBeTruthy()
    })

    it('should render with medium elevation (default)', () => {
      const { getByTestId } = render(
        <Card testID="card-md">
          <Text>Medium</Text>
        </Card>,
        { wrapper }
      )
      expect(getByTestId('card-md')).toBeTruthy()
    })

    it('should render with large elevation', () => {
      const { getByTestId } = render(
        <Card elevation="lg" testID="card-lg">
          <Text>Large</Text>
        </Card>,
        { wrapper }
      )
      expect(getByTestId('card-lg')).toBeTruthy()
    })
  })

  describe('Press Interaction', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn()
      const { getByText } = render(
        <Card onPress={onPress}>
          <Text>Pressable Card</Text>
        </Card>,
        { wrapper }
      )

      const card = getByText('Pressable Card')
      fireEvent.press(card)
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('should not be pressable when onPress is not provided', () => {
      const { getByTestId } = render(
        <Card testID="non-pressable">
          <Text>Non-pressable</Text>
        </Card>,
        { wrapper }
      )

      const card = getByTestId('non-pressable')
      // Should not throw when pressed
      expect(() => fireEvent.press(card)).not.toThrow()
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      const { getByText } = render(
        <Card variant="default">
          <Text>Default</Text>
        </Card>,
        { wrapper }
      )
      expect(getByText('Default')).toBeTruthy()
    })

    it('should render outline variant', () => {
      const { getByText } = render(
        <Card variant="outline">
          <Text>Outline</Text>
        </Card>,
        { wrapper }
      )
      expect(getByText('Outline')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = render(
        <Card accessibilityLabel="Story card">
          <Text>Story</Text>
        </Card>,
        { wrapper }
      )
      expect(getByLabelText('Story card')).toBeTruthy()
    })

    it('should have button role when pressable', () => {
      const { getByRole } = render(
        <Card onPress={() => {}} accessibilityRole="button">
          <Text>Pressable</Text>
        </Card>,
        { wrapper }
      )
      expect(getByRole('button')).toBeTruthy()
    })
  })

  describe('Snapshot', () => {
    it('should match snapshot for default card', () => {
      const { toJSON } = render(
        <Card>
          <Text>Default Card</Text>
        </Card>,
        { wrapper }
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('should match snapshot for all elevations', () => {
      const elevations: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

      elevations.forEach((elevation) => {
        const { toJSON } = render(
          <Card elevation={elevation}>
            <Text>{elevation} elevation</Text>
          </Card>,
          { wrapper }
        )
        expect(toJSON()).toMatchSnapshot(`card-elevation-${elevation}`)
      })
    })

    it('should match snapshot for pressable card', () => {
      const { toJSON } = render(
        <Card onPress={() => {}}>
          <Text>Pressable</Text>
        </Card>,
        { wrapper }
      )
      expect(toJSON()).toMatchSnapshot('card-pressable')
    })
  })
})
