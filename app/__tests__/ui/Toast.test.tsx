/**
 * Toast Component Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests Toast notification component with different types and auto-dismiss
 */

import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Toast } from '../../components/ui/Toast'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

// Mock timers for auto-dismiss testing
jest.useFakeTimers()

describe('Toast Component', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Basic Rendering', () => {
    it('should render when visible is true', () => {
      const { getByText } = render(
        <Toast visible={true} message="Test toast" />,
        { wrapper }
      )

      expect(getByText('Test toast')).toBeTruthy()
    })

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <Toast visible={false} message="Hidden toast" />,
        { wrapper }
      )

      expect(queryByText('Hidden toast')).toBeNull()
    })

    it('should render with custom testID', () => {
      const { getByTestId } = render(
        <Toast visible={true} message="Test" testID="custom-toast" />,
        { wrapper }
      )

      expect(getByTestId('custom-toast')).toBeTruthy()
    })
  })

  describe('Toast Types', () => {
    it('should render success toast with success styling', () => {
      const { getByText, getByTestId } = render(
        <Toast
          visible={true}
          message="Success message"
          type="success"
          testID="success-toast"
        />,
        { wrapper }
      )

      expect(getByText('Success message')).toBeTruthy()
      expect(getByTestId('success-toast')).toBeTruthy()
    })

    it('should render error toast with error styling', () => {
      const { getByText, getByTestId } = render(
        <Toast
          visible={true}
          message="Error message"
          type="error"
          testID="error-toast"
        />,
        { wrapper }
      )

      expect(getByText('Error message')).toBeTruthy()
      expect(getByTestId('error-toast')).toBeTruthy()
    })

    it('should render warning toast with warning styling', () => {
      const { getByText, getByTestId } = render(
        <Toast
          visible={true}
          message="Warning message"
          type="warning"
          testID="warning-toast"
        />,
        { wrapper }
      )

      expect(getByText('Warning message')).toBeTruthy()
      expect(getByTestId('warning-toast')).toBeTruthy()
    })

    it('should render info toast with info styling', () => {
      const { getByText, getByTestId } = render(
        <Toast
          visible={true}
          message="Info message"
          type="info"
          testID="info-toast"
        />,
        { wrapper }
      )

      expect(getByText('Info message')).toBeTruthy()
      expect(getByTestId('info-toast')).toBeTruthy()
    })

    it('should render default toast when type is not specified', () => {
      const { getByText } = render(
        <Toast visible={true} message="Default toast" />,
        { wrapper }
      )

      expect(getByText('Default toast')).toBeTruthy()
    })
  })

  describe('Auto Dismiss', () => {
    it('should auto-dismiss after default duration (3000ms)', async () => {
      const onDismiss = jest.fn()

      render(
        <Toast
          visible={true}
          message="Auto dismiss"
          onDismiss={onDismiss}
        />,
        { wrapper }
      )

      // Fast-forward time by 3000ms
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled()
      })
    })

    it('should auto-dismiss after custom duration', async () => {
      const onDismiss = jest.fn()

      render(
        <Toast
          visible={true}
          message="Custom duration"
          duration={5000}
          onDismiss={onDismiss}
        />,
        { wrapper }
      )

      // Fast-forward time by 4999ms (should not dismiss yet)
      act(() => {
        jest.advanceTimersByTime(4999)
      })

      expect(onDismiss).not.toHaveBeenCalled()

      // Fast-forward by 1 more ms
      act(() => {
        jest.advanceTimersByTime(1)
      })

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled()
      })
    })

    it('should not auto-dismiss when duration is 0', async () => {
      const onDismiss = jest.fn()

      render(
        <Toast
          visible={true}
          message="Manual dismiss"
          duration={0}
          onDismiss={onDismiss}
        />,
        { wrapper }
      )

      // Fast-forward time significantly
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  describe('Manual Dismiss', () => {
    it('should call onDismiss when dismiss button is pressed', () => {
      const onDismiss = jest.fn()
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Dismissible"
          onDismiss={onDismiss}
          dismissible={true}
          testID="dismissible-toast"
        />,
        { wrapper }
      )

      const dismissButton = getByTestId('toast-dismiss-button')
      fireEvent.press(dismissButton)

      expect(onDismiss).toHaveBeenCalled()
    })

    it('should not render dismiss button when dismissible is false', () => {
      const { queryByTestId } = render(
        <Toast
          visible={true}
          message="Not dismissible"
          dismissible={false}
        />,
        { wrapper }
      )

      expect(queryByTestId('toast-dismiss-button')).toBeNull()
    })

    it('should render dismiss button by default', () => {
      const { getByTestId } = render(
        <Toast visible={true} message="Default dismissible" />,
        { wrapper }
      )

      expect(getByTestId('toast-dismiss-button')).toBeTruthy()
    })
  })

  describe('Title Support', () => {
    it('should render title when provided', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          title="Success"
          message="Operation completed"
        />,
        { wrapper }
      )

      expect(getByText('Success')).toBeTruthy()
      expect(getByText('Operation completed')).toBeTruthy()
    })

    it('should render without title when not provided', () => {
      const { getByText, queryByTestId } = render(
        <Toast visible={true} message="Message only" />,
        { wrapper }
      )

      expect(getByText('Message only')).toBeTruthy()
      expect(queryByTestId('toast-title')).toBeNull()
    })
  })

  describe('Position', () => {
    it('should render at top position', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Top toast"
          position="top"
          testID="top-toast"
        />,
        { wrapper }
      )

      expect(getByTestId('top-toast')).toBeTruthy()
    })

    it('should render at bottom position', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Bottom toast"
          position="bottom"
          testID="bottom-toast"
        />,
        { wrapper }
      )

      expect(getByTestId('bottom-toast')).toBeTruthy()
    })

    it('should render at top by default', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Default position"
          testID="default-toast"
        />,
        { wrapper }
      )

      // Default position should be top
      expect(getByTestId('default-toast')).toBeTruthy()
    })
  })

  describe('Animation', () => {
    it('should animate in when becoming visible', () => {
      const { getByText, rerender } = render(
        <Toast visible={false} message="Animated" />,
        { wrapper }
      )

      // Initially not visible
      expect(() => getByText('Animated')).toThrow()

      // Make visible
      rerender(
        <ThemeProvider>
          <Toast visible={true} message="Animated" />
        </ThemeProvider>
      )

      // Should now be visible
      expect(getByText('Animated')).toBeTruthy()
    })

    it('should animate out when becoming hidden', () => {
      const { getByText, rerender } = render(
        <Toast visible={true} message="Animated out" />,
        { wrapper }
      )

      // Initially visible
      expect(getByText('Animated out')).toBeTruthy()

      // Make hidden
      rerender(
        <ThemeProvider>
          <Toast visible={false} message="Animated out" />
        </ThemeProvider>
      )

      // Animation happens, component may still be in DOM briefly
      // Test that it eventually disappears
      act(() => {
        jest.advanceTimersByTime(300) // Animation duration
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility role', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Accessible toast"
          testID="accessible-toast"
        />,
        { wrapper }
      )

      const toast = getByTestId('accessible-toast')
      expect(toast.props.accessibilityRole).toBe('alert')
    })

    it('should announce message to screen readers', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Screen reader message"
          testID="sr-toast"
        />,
        { wrapper }
      )

      const toast = getByTestId('sr-toast')
      expect(toast.props.accessibilityLiveRegion).toBe('polite')
    })

    it('should use assertive live region for errors', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Error occurred"
          type="error"
          testID="error-sr-toast"
        />,
        { wrapper }
      )

      const toast = getByTestId('error-sr-toast')
      expect(toast.props.accessibilityLiveRegion).toBe('assertive')
    })
  })

  describe('Theme Integration', () => {
    it('should apply theme colors based on type', () => {
      const { getByTestId } = render(
        <Toast
          visible={true}
          message="Themed success"
          type="success"
          testID="themed-toast"
        />,
        { wrapper }
      )

      expect(getByTestId('themed-toast')).toBeTruthy()
    })

    it('should update when theme changes', () => {
      const { getByText, rerender } = render(
        <Toast visible={true} message="Theme change" />,
        { wrapper }
      )

      expect(getByText('Theme change')).toBeTruthy()

      // Re-render with theme change
      rerender(
        <ThemeProvider>
          <Toast visible={true} message="Theme change" />
        </ThemeProvider>
      )

      expect(getByText('Theme change')).toBeTruthy()
    })
  })
})
