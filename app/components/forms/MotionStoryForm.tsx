/**
 * MotionStory Form Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Form for creating/editing motion stories with validation and error handling
 */

import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Toast } from '../ui/Toast'
import { useFormValidation } from '../../hooks/useFormValidation'
import { useTheme } from '../theme/useTheme'

export interface MotionStoryFormData {
  title: string
  description: string
}

export interface MotionStoryFormProps {
  initialData?: Partial<MotionStoryFormData>
  onSubmit: (data: MotionStoryFormData) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  isLoading?: boolean
  testID?: string
}

export function MotionStoryForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  isLoading = false,
  testID = 'motion-story-form',
}: MotionStoryFormProps) {
  const { theme } = useTheme()
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { errors, validate, validateField, clearError } = useFormValidation<MotionStoryFormData>({
    title: {
      required: {
        value: true,
        message: 'Title is required',
      },
      minLength: {
        value: 3,
        message: 'Title must be at least 3 characters',
      },
      maxLength: {
        value: 100,
        message: 'Title must not exceed 100 characters',
      },
    },
    description: {
      required: {
        value: true,
        message: 'Description is required',
      },
      minLength: {
        value: 10,
        message: 'Description must be at least 10 characters',
      },
      maxLength: {
        value: 1000,
        message: 'Description must not exceed 1000 characters',
      },
    },
  })

  const handleTitleChange = (text: string) => {
    setTitle(text)
    if (errors.title) {
      clearError('title')
    }
  }

  const handleDescriptionChange = (text: string) => {
    setDescription(text)
    if (errors.description) {
      clearError('description')
    }
  }

  const handleSubmit = async () => {
    const formData: MotionStoryFormData = {
      title: title.trim(),
      description: description.trim(),
    }

    const isValid = validate(formData)

    if (!isValid) {
      setToastType('error')
      setToastMessage('Please fix the errors before submitting')
      setShowToast(true)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      setToastType('success')
      setToastMessage('Motion story created successfully!')
      setShowToast(true)
    } catch (error) {
      setToastType('error')
      setToastMessage(error instanceof Error ? error.message : 'Failed to submit form')
      setShowToast(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container} testID={testID}>
          <Input
            label="Title"
            placeholder="Enter title"
            value={title}
            onChangeText={handleTitleChange}
            error={errors.title}
            testID="title-input"
            editable={!isSubmitting && !isLoading}
            maxLength={100}
          />

          <Input
            label="Description"
            placeholder="Enter description"
            value={description}
            onChangeText={handleDescriptionChange}
            error={errors.description}
            multiline={true}
            numberOfLines={4}
            testID="description-input"
            editable={!isSubmitting && !isLoading}
            maxLength={1000}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={submitLabel}
              onPress={handleSubmit}
              testID="submit-button"
              disabled={isSubmitting || isLoading}
              loading={isSubmitting || isLoading}
              style={styles.submitButton}
            />

            {onCancel && (
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
                testID="cancel-button"
                disabled={isSubmitting || isLoading}
                style={styles.cancelButton}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setShowToast(false)}
        testID="form-toast"
        duration={3000}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
})
