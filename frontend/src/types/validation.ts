// Validation utilities for type-safe data handling

import { z } from 'zod';
import { 
  SlideSchema, 
  PitchDeckSchema, 
  UserSchema, 
  GenerationRequestSchema,
  ApiErrorSchema,
  ApiSuccessSchema,
  ProjectSchema
} from './index';

// Validation result type
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
  }
}

// Specific validation functions for common use cases
export const validateSlide = (data: unknown) => validateData(SlideSchema, data);
export const validatePitchDeck = (data: unknown) => validateData(PitchDeckSchema, data);
export const validateUser = (data: unknown) => validateData(UserSchema, data);
export const validateGenerationRequest = (data: unknown) => validateData(GenerationRequestSchema, data);
export const validateProject = (data: unknown) => validateData(ProjectSchema, data);
export const validateApiError = (data: unknown) => validateData(ApiErrorSchema, data);
export const validateApiSuccess = (data: unknown) => validateData(ApiSuccessSchema, data);

// Safe parsing functions (returns undefined on error instead of throwing)
export const safeParseSlide = (data: unknown) => SlideSchema.safeParse(data);
export const safeParsePitchDeck = (data: unknown) => PitchDeckSchema.safeParse(data);
export const safeParseUser = (data: unknown) => UserSchema.safeParse(data);
export const safeParseGenerationRequest = (data: unknown) => GenerationRequestSchema.safeParse(data);

// Form validation helpers
export function getFieldErrors(error: z.ZodError, fieldName: string): string[] {
  return error.errors
    .filter(err => err.path.includes(fieldName))
    .map(err => err.message);
}

export function hasFieldError(error: z.ZodError, fieldName: string): boolean {
  return error.errors.some(err => err.path.includes(fieldName));
}