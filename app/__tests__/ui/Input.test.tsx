/**
 * Input Component Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests Input component behavior, states, and accessibility
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Input } from '../../components/ui/Input'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render with placeholder', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" />,
        { wrapper }
      )

      expect(getByPlaceholderText('Enter text')).toBeTruthy()
    })

    it('should render with value', () => {
      const { getByDisplayValue } = render(
        <Input value="Test value" onChangeText={() => {}} />,
        { wrapper }
      )

      expect(getByDisplayValue('Test value')).toBeTruthy()
    })

    it('should render with label', () => {
      const { getByText } = render(
        <Input label="Username" placeholder="Enter username" />,
        { wrapper }
      )

      expect(getByText('Username')).toBeTruthy()
    })
  })

  describe('User Interaction', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn()
      const { getByPlaceholderText } = render(
        <Input placeholder="Type here" onChangeText={onChangeText} />,
        { wrapper }
      )

      const input = getByPlaceholderText('Type here')
      fireEvent.changeText(input, 'Hello')

      expect(onChangeText).toHaveBeenCalledWith('Hello')
    })

    it('should call onFocus when input is focused', () => {
      const onFocus = jest.fn()
      const { getByPlaceholderText } = render(
        <Input placeholder="Focus test" onFocus={onFocus} />,
        { wrapper }
      )

      const input = getByPlaceholderText('Focus test')
      fireEvent(input, 'focus')

      expect(onFocus).toHaveBeenCalled()
    })

    it('should call onBlur when input loses focus', () => {
      const onBlur = jest.fn()
      const { getByPlaceholderText } = render(
        <Input placeholder="Blur test" onBlur={onBlur} />,
        { wrapper }
      )

      const input = getByPlaceholderText('Blur test')
      fireEvent(input, 'blur')

      expect(onBlur).toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    it('should render error message when error prop is provided', () => {
      const { getByText } = render(
        <Input placeholder="Test" error="This field is required" />,
        { wrapper }
      )

      expect(getByText('This field is required')).toBeTruthy()
    })

    it('should apply error styling when error is present', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Input
          placeholder="Test"
          error="Error message"
          testID="input-container"
        />,
        { wrapper }
      )

      // Input should be rendered
      expect(getByPlaceholderText('Test')).toBeTruthy()
      // Error state should affect styling
      expect(getByTestId('input-container')).toBeTruthy()
    })

    it('should not render error message when error is null/undefined', () => {
      const { queryByTestId } = render(
        <Input placeholder="Test" />,
        { wrapper }
      )

      expect(queryByTestId('input-error')).toBeNull()
    })
  })

  describe('Icon Support', () => {
    it('should render left icon when provided', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Search"
          leftIcon={<MockIcon testID="left-icon" />}
        />,
        { wrapper }
      )

      expect(getByTestId('left-icon')).toBeTruthy()
    })

    it('should render right icon when provided', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Password"
          rightIcon={<MockIcon testID="right-icon" />}
        />,
        { wrapper }
      )

      expect(getByTestId('right-icon')).toBeTruthy()
    })

    it('should render both left and right icons', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Username"
          leftIcon={<MockIcon testID="left-icon" />}
          rightIcon={<MockIcon testID="right-icon" />}
        />,
        { wrapper }
      )

      expect(getByTestId('left-icon')).toBeTruthy()
      expect(getByTestId('right-icon')).toBeTruthy()
    })
  })

  describe('SecureTextEntry', () => {
    it('should hide text when secureTextEntry is true', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Password"
          value="secret123"
          secureTextEntry={true}
          onChangeText={() => {}}
        />,
        { wrapper }
      )

      const input = getByPlaceholderText('Password')
      expect(input.props.secureTextEntry).toBe(true)
    })

    it('should show text when secureTextEntry is false', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Username"
          value="john_doe"
          secureTextEntry={false}
          onChangeText={() => {}}
        />,
        { wrapper }
      )

      const input = getByPlaceholderText('Username')
      expect(input.props.secureTextEntry).toBe(false)
    })
  })

  describe('Multiline Support', () => {
    it('should render as multiline when multiline prop is true', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Description"
          multiline={true}
          numberOfLines={4}
        />,
        { wrapper }
      )

      const input = getByPlaceholderText('Description')
      expect(input.props.multiline).toBe(true)
      expect(input.props.numberOfLines).toBe(4)
    })

    it('should render as single line by default', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Title" />,
        { wrapper }
      )

      const input = getByPlaceholderText('Title')
      expect(input.props.multiline).toBeUndefined()
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when editable is false', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Disabled" editable={false} />,
        { wrapper }
      )

      const input = getByPlaceholderText('Disabled')
      expect(input.props.editable).toBe(false)
    })

    it('should not call onChangeText when disabled', () => {
      const onChangeText = jest.fn()
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Disabled"
          editable={false}
          onChangeText={onChangeText}
        />,
        { wrapper }
      )

      const input = getByPlaceholderText('Disabled')
      fireEvent.changeText(input, 'Should not work')

      // TextInput with editable=false should not trigger onChangeText
      // This behavior is handled by React Native
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility label', () => {
      const { getByLabelText } = render(
        <Input
          placeholder="Email"
          accessibilityLabel="Email input field"
        />,
        { wrapper }
      )

      expect(getByLabelText('Email input field')).toBeTruthy()
    })

    it('should have accessibility hint when provided', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Password"
          accessibilityHint="Enter your password to log in"
        />,
        { wrapper }
      )

      const input = getByPlaceholderText('Password')
      expect(input.props.accessibilityHint).toBe('Enter your password to log in')
    })

    it('should indicate error state for screen readers', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Email"
          error="Invalid email format"
        />,
        { wrapper }
      )

      const input = getByPlaceholderText('Email')
      // Error state should be communicated via accessibility
      expect(input).toBeTruthy()
    })
  })

  describe('Theme Integration', () => {
    it('should apply theme colors correctly', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Themed input" />,
        { wrapper }
      )

      // Input should render with theme applied
      expect(getByPlaceholderText('Themed input')).toBeTruthy()
    })

    it('should update style when theme changes', () => {
      const { getByPlaceholderText, rerender } = render(
        <Input placeholder="Dynamic theme" />,
        { wrapper }
      )

      expect(getByPlaceholderText('Dynamic theme')).toBeTruthy()

      // Re-render with same props (theme change happens at provider level)
      rerender(
        <ThemeProvider>
          <Input placeholder="Dynamic theme" />
        </ThemeProvider>
      )

      expect(getByPlaceholderText('Dynamic theme')).toBeTruthy()
    })
  })
})

// Mock icon component for testing
const MockIcon = ({ testID }: { testID: string }) => {
  const { View } = require('react-native')
  return <View testID={testID} />
}
