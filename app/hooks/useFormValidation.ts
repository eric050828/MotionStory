/**
 * Form Validation Hook
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Reusable form validation logic with error state management
 */

import { useState, useCallback } from 'react'

export type ValidationRule<T = any> = {
  required?: {
    value: boolean
    message: string
  }
  minLength?: {
    value: number
    message: string
  }
  maxLength?: {
    value: number
    message: string
  }
  pattern?: {
    value: RegExp
    message: string
  }
  validate?: {
    validator: (value: T) => boolean
    message: string
  }
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export type FormErrors<T> = {
  [K in keyof T]?: string
}

export interface UseFormValidationReturn<T> {
  errors: FormErrors<T>
  validate: (values: T) => boolean
  validateField: (name: keyof T, value: any) => string | undefined
  clearError: (name: keyof T) => void
  clearErrors: () => void
  setError: (name: keyof T, message: string) => void
}

export function useFormValidation<T extends Record<string, any>>(
  rules: ValidationRules<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FormErrors<T>>({})

  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      const fieldRules = rules[name]
      if (!fieldRules) return undefined

      // Required validation
      if (fieldRules.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)

        if (fieldRules.required.value && isEmpty) {
          return fieldRules.required.message
        }
      }

      // Skip other validations if value is empty and not required
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        return undefined
      }

      // MinLength validation
      if (fieldRules.minLength && typeof value === 'string') {
        if (value.length < fieldRules.minLength.value) {
          return fieldRules.minLength.message
        }
      }

      // MaxLength validation
      if (fieldRules.maxLength && typeof value === 'string') {
        if (value.length > fieldRules.maxLength.value) {
          return fieldRules.maxLength.message
        }
      }

      // Pattern validation
      if (fieldRules.pattern && typeof value === 'string') {
        if (!fieldRules.pattern.value.test(value)) {
          return fieldRules.pattern.message
        }
      }

      // Custom validation
      if (fieldRules.validate) {
        if (!fieldRules.validate.validator(value)) {
          return fieldRules.validate.message
        }
      }

      return undefined
    },
    [rules]
  )

  const validate = useCallback(
    (values: T): boolean => {
      const newErrors: FormErrors<T> = {}

      for (const name in rules) {
        const error = validateField(name, values[name])
        if (error) {
          newErrors[name] = error
        }
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [rules, validateField]
  )

  const clearError = useCallback((name: keyof T) => {
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[name]
      return updated
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const setError = useCallback((name: keyof T, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }))
  }, [])

  return {
    errors,
    validate,
    validateField,
    clearError,
    clearErrors,
    setError,
  }
}
