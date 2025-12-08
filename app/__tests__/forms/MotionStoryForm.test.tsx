/**
 * MotionStory Form Integration Test
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Tests form validation, error handling, and submission flow
 */

import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { ThemeProvider } from '../../components/theme/ThemeProvider'

// Mock form component for testing (will be implemented in T047)
const MockMotionStoryForm = ({ onSubmit, onCancel }: any) => {
  const { Input } = require('../../components/ui/Input')
  const { Button } = require('../../components/ui/Button')
  const { Toast } = require('../../components/ui/Toast')
  const { useState } = require('react')
  const { View } = require('react-native')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<any>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const validate = () => {
    const newErrors: any = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ title, description })
      setToastType('success')
      setToastMessage('Motion story created successfully!')
      setShowToast(true)
    } else {
      setToastType('error')
      setToastMessage('Please fix the errors before submitting')
      setShowToast(true)
    }
  }

  return (
    <View testID="motion-story-form">
      <Input
        label="Title"
        placeholder="Enter title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        testID="title-input"
      />

      <Input
        label="Description"
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        multiline={true}
        numberOfLines={4}
        testID="description-input"
      />

      <Button
        title="Submit"
        onPress={handleSubmit}
        testID="submit-button"
      />

      <Button
        title="Cancel"
        variant="outline"
        onPress={onCancel}
        testID="cancel-button"
      />

      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setShowToast(false)}
        testID="form-toast"
      />
    </View>
  )
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('MotionStory Form Integration', () => {
  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      const { getByTestId } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      expect(getByTestId('title-input')).toBeTruthy()
      expect(getByTestId('description-input')).toBeTruthy()
      expect(getByTestId('submit-button')).toBeTruthy()
      expect(getByTestId('cancel-button')).toBeTruthy()
    })

    it('should render labels for inputs', () => {
      const { getByText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      expect(getByText('Title')).toBeTruthy()
      expect(getByText('Description')).toBeTruthy()
    })
  })

  describe('Required Field Validation', () => {
    it('should show error when title is empty on submit', async () => {
      const onSubmit = jest.fn()
      const { getByTestId, getByText } = render(
        <MockMotionStoryForm onSubmit={onSubmit} onCancel={jest.fn()} />,
        { wrapper }
      )

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Title is required')).toBeTruthy()
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    it('should show error when description is empty on submit', async () => {
      const onSubmit = jest.fn()
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <MockMotionStoryForm onSubmit={onSubmit} onCancel={jest.fn()} />,
        { wrapper }
      )

      // Fill title only
      const titleInput = getByPlaceholderText('Enter title')
      fireEvent.changeText(titleInput, 'Valid Title')

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Description is required')).toBeTruthy()
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    it('should show errors for both fields when both are empty', async () => {
      const { getByTestId, getByText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Title is required')).toBeTruthy()
        expect(getByText('Description is required')).toBeTruthy()
      })
    })
  })

  describe('Format Validation', () => {
    it('should show error when title is too short', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      const titleInput = getByPlaceholderText('Enter title')
      fireEvent.changeText(titleInput, 'Ab')

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Title must be at least 3 characters')).toBeTruthy()
      })
    })

    it('should show error when description is too short', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      const titleInput = getByPlaceholderText('Enter title')
      const descInput = getByPlaceholderText('Enter description')

      fireEvent.changeText(titleInput, 'Valid Title')
      fireEvent.changeText(descInput, 'Too short')

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Description must be at least 10 characters')).toBeTruthy()
      })
    })
  })

  describe('Successful Submission', () => {
    it('should submit form when all fields are valid', async () => {
      const onSubmit = jest.fn()
      const { getByTestId, getByPlaceholderText } = render(
        <MockMotionStoryForm onSubmit={onSubmit} onCancel={jest.fn()} />,
        { wrapper }
      )

      const titleInput = getByPlaceholderText('Enter title')
      const descInput = getByPlaceholderText('Enter description')

      fireEvent.changeText(titleInput, 'My First Motion Story')
      fireEvent.changeText(descInput, 'This is a detailed description of my motion story.')

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          title: 'My First Motion Story',
          description: 'This is a detailed description of my motion story.',
        })
      })
    })

    it('should show success toast after valid submission', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      const titleInput = getByPlaceholderText('Enter title')
      const descInput = getByPlaceholderText('Enter description')

      fireEvent.changeText(titleInput, 'Valid Title')
      fireEvent.changeText(descInput, 'Valid description with enough characters')

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Motion story created successfully!')).toBeTruthy()
      })
    })

    it('should clear errors when valid data is entered', async () => {
      const { getByTestId, getByText, getByPlaceholderText, queryByText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      // Submit with empty fields to trigger errors
      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Title is required')).toBeTruthy()
      })

      // Fill in valid data
      const titleInput = getByPlaceholderText('Enter title')
      const descInput = getByPlaceholderText('Enter description')

      fireEvent.changeText(titleInput, 'Valid Title')
      fireEvent.changeText(descInput, 'Valid description with enough characters')

      // Submit again
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(queryByText('Title is required')).toBeNull()
        expect(queryByText('Description is required')).toBeNull()
      })
    })
  })

  describe('Error Toast', () => {
    it('should show error toast when validation fails', async () => {
      const { getByTestId, getByText } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(getByText('Please fix the errors before submitting')).toBeTruthy()
      })
    })
  })

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const onCancel = jest.fn()
      const { getByTestId } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={onCancel} />,
        { wrapper }
      )

      const cancelButton = getByTestId('cancel-button')
      fireEvent.press(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('should not submit form when cancel is pressed', () => {
      const onSubmit = jest.fn()
      const onCancel = jest.fn()
      const { getByTestId } = render(
        <MockMotionStoryForm onSubmit={onSubmit} onCancel={onCancel} />,
        { wrapper }
      )

      const cancelButton = getByTestId('cancel-button')
      fireEvent.press(cancelButton)

      expect(onSubmit).not.toHaveBeenCalled()
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('Form State Management', () => {
    it('should preserve input values during validation errors', async () => {
      const { getByTestId, getByPlaceholderText, getByDisplayValue } = render(
        <MockMotionStoryForm onSubmit={jest.fn()} onCancel={jest.fn()} />,
        { wrapper }
      )

      const titleInput = getByPlaceholderText('Enter title')
      fireEvent.changeText(titleInput, 'AB') // Too short

      const submitButton = getByTestId('submit-button')
      fireEvent.press(submitButton)

      await waitFor(() => {
        // Value should still be present
        expect(getByDisplayValue('AB')).toBeTruthy()
      })
    })

    it('should handle multiple validation attempts', async () => {
      const onSubmit = jest.fn()
      const { getByTestId, getByPlaceholderText } = render(
        <MockMotionStoryForm onSubmit={onSubmit} onCancel={jest.fn()} />,
        { wrapper }
      )

      const submitButton = getByTestId('submit-button')

      // First attempt - both fields empty
      fireEvent.press(submitButton)
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled()
      })

      // Second attempt - title too short
      const titleInput = getByPlaceholderText('Enter title')
      fireEvent.changeText(titleInput, 'AB')
      fireEvent.press(submitButton)
      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled()
      })

      // Third attempt - valid data
      const descInput = getByPlaceholderText('Enter description')
      fireEvent.changeText(titleInput, 'Valid Title')
      fireEvent.changeText(descInput, 'Valid description text here')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1)
      })
    })
  })
})
