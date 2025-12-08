/**
 * Text Component Unit Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Tests typography tokens integration and text variants.
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Text } from '../../components/ui/Text'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Text Component', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(<Text>Hello World</Text>, { wrapper })
      expect(getByText('Hello World')).toBeTruthy()
    })

    it('should render with testID', () => {
      const { getByTestId } = render(<Text testID="test-text">Test</Text>, { wrapper })
      expect(getByTestId('test-text')).toBeTruthy()
    })
  })

  describe('Typography Variants', () => {
    it('should render heading variant', () => {
      const { getByText } = render(<Text variant="heading">Heading</Text>, { wrapper })
      expect(getByText('Heading')).toBeTruthy()
    })

    it('should render subheading variant', () => {
      const { getByText } = render(<Text variant="subheading">Subheading</Text>, { wrapper })
      expect(getByText('Subheading')).toBeTruthy()
    })

    it('should render body variant (default)', () => {
      const { getByText } = render(<Text>Body Text</Text>, { wrapper })
      expect(getByText('Body Text')).toBeTruthy()
    })

    it('should render caption variant', () => {
      const { getByText } = render(<Text variant="caption">Caption</Text>, { wrapper })
      expect(getByText('Caption')).toBeTruthy()
    })

    it('should render label variant', () => {
      const { getByText } = render(<Text variant="label">Label</Text>, { wrapper })
      expect(getByText('Label')).toBeTruthy()
    })
  })

  describe('Font Weights', () => {
    it('should render normal weight (default)', () => {
      const { getByText } = render(<Text>Normal</Text>, { wrapper })
      expect(getByText('Normal')).toBeTruthy()
    })

    it('should render medium weight', () => {
      const { getByText } = render(<Text weight="medium">Medium</Text>, { wrapper })
      expect(getByText('Medium')).toBeTruthy()
    })

    it('should render bold weight', () => {
      const { getByText } = render(<Text weight="bold">Bold</Text>, { wrapper })
      expect(getByText('Bold')).toBeTruthy()
    })
  })

  describe('Colors', () => {
    it('should render with default foreground color', () => {
      const { getByText } = render(<Text>Default Color</Text>, { wrapper })
      expect(getByText('Default Color')).toBeTruthy()
    })

    it('should render with muted color', () => {
      const { getByText } = render(<Text color="muted">Muted</Text>, { wrapper })
      expect(getByText('Muted')).toBeTruthy()
    })

    it('should render with primary color', () => {
      const { getByText } = render(<Text color="primary">Primary</Text>, { wrapper })
      expect(getByText('Primary')).toBeTruthy()
    })

    it('should render with error color', () => {
      const { getByText } = render(<Text color="error">Error</Text>, { wrapper })
      expect(getByText('Error')).toBeTruthy()
    })
  })

  describe('Number of Lines', () => {
    it('should support numberOfLines prop', () => {
      const { getByText } = render(<Text numberOfLines={2}>Long text that should truncate</Text>, { wrapper })
      expect(getByText('Long text that should truncate')).toBeTruthy()
    })

    it('should support ellipsizeMode prop', () => {
      const { getByText } = render(
        <Text numberOfLines={1} ellipsizeMode="tail">
          Long text
        </Text>,
        { wrapper }
      )
      expect(getByText('Long text')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByLabelText } = render(
        <Text accessibilityLabel="Welcome message">Welcome!</Text>,
        { wrapper }
      )
      expect(getByLabelText('Welcome message')).toBeTruthy()
    })

    it('should support accessibility role', () => {
      const { getByRole } = render(
        <Text accessibilityRole="header">Header Text</Text>,
        { wrapper }
      )
      expect(getByRole('header')).toBeTruthy()
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom style prop', () => {
      const customStyle = { fontSize: 24 }
      const { getByTestId } = render(
        <Text style={customStyle} testID="custom-styled">
          Custom
        </Text>,
        { wrapper }
      )
      expect(getByTestId('custom-styled')).toBeTruthy()
    })
  })

  describe('Snapshot', () => {
    it('should match snapshot for default text', () => {
      const { toJSON } = render(<Text>Default Text</Text>, { wrapper })
      expect(toJSON()).toMatchSnapshot()
    })

    it('should match snapshot for all variants', () => {
      const variants: Array<'heading' | 'subheading' | 'body' | 'caption' | 'label'> = [
        'heading',
        'subheading',
        'body',
        'caption',
        'label',
      ]

      variants.forEach((variant) => {
        const { toJSON } = render(<Text variant={variant}>{variant}</Text>, { wrapper })
        expect(toJSON()).toMatchSnapshot(`text-${variant}`)
      })
    })

    it('should match snapshot for all weights', () => {
      const weights: Array<'normal' | 'medium' | 'bold'> = ['normal', 'medium', 'bold']

      weights.forEach((weight) => {
        const { toJSON } = render(<Text weight={weight}>{weight}</Text>, { wrapper })
        expect(toJSON()).toMatchSnapshot(`text-weight-${weight}`)
      })
    })
  })
})
