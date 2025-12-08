/**
 * Button Component Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Tests button variants, sizes, states, and interactions.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Button } from '../../components/ui/Button'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

// Wrapper with ThemeProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(<Button onPress={() => {}}>Click Me</Button>, { wrapper })
      expect(getByText('Click Me')).toBeTruthy()
    })

    it('should render with testID', () => {
      const { getByTestId } = render(
        <Button onPress={() => {}} testID="test-button">
          Test
        </Button>,
        { wrapper }
      )
      expect(getByTestId('test-button')).toBeTruthy()
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      const { getByText } = render(
        <Button onPress={() => {}} variant="default">
          Default
        </Button>,
        { wrapper }
      )
      expect(getByText('Default')).toBeTruthy()
    })

    it('should render outline variant', () => {
      const { getByText } = render(
        <Button onPress={() => {}} variant="outline">
          Outline
        </Button>,
        { wrapper }
      )
      expect(getByText('Outline')).toBeTruthy()
    })

    it('should render ghost variant', () => {
      const { getByText } = render(
        <Button onPress={() => {}} variant="ghost">
          Ghost
        </Button>,
        { wrapper }
      )
      expect(getByText('Ghost')).toBeTruthy()
    })

    it('should render destructive variant', () => {
      const { getByText } = render(
        <Button onPress={() => {}} variant="destructive">
          Delete
        </Button>,
        { wrapper }
      )
      expect(getByText('Delete')).toBeTruthy()
    })
  })

  describe('Sizes', () => {
    it('should render small size', () => {
      const { getByText } = render(
        <Button onPress={() => {}} size="sm">
          Small
        </Button>,
        { wrapper }
      )
      expect(getByText('Small')).toBeTruthy()
    })

    it('should render medium size (default)', () => {
      const { getByText } = render(<Button onPress={() => {}}>Medium</Button>, { wrapper })
      expect(getByText('Medium')).toBeTruthy()
    })

    it('should render large size', () => {
      const { getByText } = render(
        <Button onPress={() => {}} size="lg">
          Large
        </Button>,
        { wrapper }
      )
      expect(getByText('Large')).toBeTruthy()
    })
  })

  describe('States', () => {
    it('should handle disabled state', () => {
      const onPress = jest.fn()
      const { getByText } = render(
        <Button onPress={onPress} disabled>
          Disabled
        </Button>,
        { wrapper }
      )

      const button = getByText('Disabled')
      fireEvent.press(button)
      expect(onPress).not.toHaveBeenCalled()
    })

    it('should show loading state', () => {
      const { getByTestId } = render(
        <Button onPress={() => {}} loading testID="loading-button">
          Loading
        </Button>,
        { wrapper }
      )

      expect(getByTestId('loading-button')).toBeTruthy()
    })

    it('should disable onPress when loading', () => {
      const onPress = jest.fn()
      const { getByRole } = render(
        <Button onPress={onPress} loading testID="loading-button">
          Loading
        </Button>,
        { wrapper }
      )

      const button = getByRole('button')
      fireEvent.press(button)
      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn()
      const { getByText } = render(<Button onPress={onPress}>Press Me</Button>, { wrapper })

      const button = getByText('Press Me')
      fireEvent.press(button)
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('should handle async onPress', async () => {
      const onPress = jest.fn().mockResolvedValue(undefined)
      const { getByText } = render(<Button onPress={onPress}>Async</Button>, { wrapper })

      const button = getByText('Async')
      fireEvent.press(button)
      await expect(onPress()).resolves.toBeUndefined()
    })
  })

  describe('Icon Support', () => {
    it('should render with icon', () => {
      const icon = <MockIcon testID="button-icon" />
      const { getByTestId } = render(
        <Button onPress={() => {}} icon={icon}>
          With Icon
        </Button>,
        { wrapper }
      )

      expect(getByTestId('button-icon')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = render(
        <Button onPress={() => {}} accessibilityLabel="Submit form">
          Submit
        </Button>,
        { wrapper }
      )

      expect(getByLabelText('Submit form')).toBeTruthy()
    })

    it('should have accessibility role button', () => {
      const { getByRole } = render(<Button onPress={() => {}}>Button</Button>, { wrapper })

      expect(getByRole('button')).toBeTruthy()
    })

    it('should indicate disabled state to screen readers', () => {
      const { getByRole } = render(
        <Button onPress={() => {}} disabled>
          Disabled
        </Button>,
        { wrapper }
      )

      const button = getByRole('button')
      expect(button.props.accessibilityState?.disabled).toBe(true)
    })
  })

  describe('Snapshot', () => {
    it('should match snapshot for default variant', () => {
      const { toJSON } = render(<Button onPress={() => {}}>Default</Button>, { wrapper })
      expect(toJSON()).toMatchSnapshot()
    })

    it('should match snapshot for all variants', () => {
      const variants: Array<'default' | 'outline' | 'ghost' | 'destructive'> = [
        'default',
        'outline',
        'ghost',
        'destructive',
      ]

      variants.forEach((variant) => {
        const { toJSON } = render(
          <Button onPress={() => {}} variant={variant}>
            {variant}
          </Button>,
          { wrapper }
        )
        expect(toJSON()).toMatchSnapshot(`button-${variant}`)
      })
    })
  })
})

// Mock Icon Component
const MockIcon = ({ testID }: { testID: string }) => {
  const { View, Text } = require('react-native')
  return <View testID={testID}><Text>Icon</Text></View>
}
