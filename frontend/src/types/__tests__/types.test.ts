// Tests for TypeScript interfaces and Zod schemas

import {
  SlideSchema,
  PitchDeckSchema,
  UserSchema,
  GenerationRequestSchema,
  SlideType
} from '../index';
import {
  validateSlide,
  validatePitchDeck,
  validateUser,
  validateGenerationRequest,
  safeParseSlide
} from '../validation';

describe('Slide Schema Validation', () => {
  const validSlide = {
    id: '123',
    type: 'title' as SlideType,
    title: 'Test Slide',
    content: 'Test content',
    order: 0
  };

  test('validates correct slide data', () => {
    const result = validateSlide(validSlide);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validSlide);
  });

  test('rejects slide with missing title', () => {
    const invalidSlide = { ...validSlide, title: '' };
    const result = validateSlide(invalidSlide);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('title: Title is required');
  });

  test('rejects slide with invalid type', () => {
    const invalidSlide = { ...validSlide, type: 'invalid_type' };
    const result = validateSlide(invalidSlide);
    expect(result.success).toBe(false);
  });

  test('rejects slide with negative order', () => {
    const invalidSlide = { ...validSlide, order: -1 };
    const result = validateSlide(invalidSlide);
    expect(result.success).toBe(false);
  });
});

describe('PitchDeck Schema Validation', () => {
  const validDeck = {
    id: '456',
    user_id: '789',
    title: 'Test Deck',
    description: 'Test description',
    slides: []
  };

  test('validates correct deck data', () => {
    const result = validatePitchDeck(validDeck);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validDeck);
  });

  test('rejects deck with empty title', () => {
    const invalidDeck = { ...validDeck, title: '' };
    const result = validatePitchDeck(invalidDeck);
    expect(result.success).toBe(false);
  });

  test('rejects deck with title too long', () => {
    const invalidDeck = { ...validDeck, title: 'a'.repeat(201) };
    const result = validatePitchDeck(invalidDeck);
    expect(result.success).toBe(false);
  });

  test('validates deck with slides', () => {
    const deckWithSlides = {
      ...validDeck,
      slides: [{
        id: '123',
        type: 'title' as SlideType,
        title: 'Test Slide',
        content: 'Test content',
        order: 0
      }]
    };
    const result = validatePitchDeck(deckWithSlides);
    expect(result.success).toBe(true);
  });
});

describe('User Schema Validation', () => {
  const validUser = {
    id: '123',
    email: 'test@example.com'
  };

  test('validates correct user data', () => {
    const result = validateUser(validUser);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validUser);
  });

  test('rejects user with invalid email', () => {
    const invalidUser = { ...validUser, email: 'invalid-email' };
    const result = validateUser(invalidUser);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('email: Invalid email format');
  });
});

describe('GenerationRequest Schema Validation', () => {
  const validRequest = {
    company_name: 'Test Company',
    industry: 'Technology',
    target_audience: 'Investors',
    key_message: 'We solve problems',
    slide_types: ['title', 'problem', 'solution'] as SlideType[]
  };

  test('validates correct generation request', () => {
    const result = validateGenerationRequest(validRequest);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validRequest);
  });

  test('rejects request with empty company name', () => {
    const invalidRequest = { ...validRequest, company_name: '' };
    const result = validateGenerationRequest(invalidRequest);
    expect(result.success).toBe(false);
  });

  test('rejects request with empty slide types', () => {
    const invalidRequest = { ...validRequest, slide_types: [] };
    const result = validateGenerationRequest(invalidRequest);
    expect(result.success).toBe(false);
  });
});

describe('Safe Parsing', () => {
  test('safe parse returns success for valid data', () => {
    const validSlide = {
      id: '123',
      type: 'title' as SlideType,
      title: 'Test Slide',
      content: 'Test content',
      order: 0
    };
    
    const result = safeParseSlide(validSlide);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validSlide);
    }
  });

  test('safe parse returns error for invalid data', () => {
    const invalidSlide = {
      id: '123',
      type: 'invalid_type',
      title: '',
      content: 'Test content',
      order: -1
    };
    
    const result = safeParseSlide(invalidSlide);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });
});