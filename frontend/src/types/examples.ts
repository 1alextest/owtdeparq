// Example usage of TypeScript interfaces and Zod validation

import { 
  Slide, 
  PitchDeck, 
  GenerationRequest,
  SlideType 
} from './index';
import { 
  validateSlide, 
  validatePitchDeck, 
  validateGenerationRequest,
  safeParseSlide 
} from './validation';
import { SLIDE_TYPE_INFO, DEFAULT_SLIDE_ORDER } from './constants';

// Example: Creating a new slide
export function createSlide(
  type: SlideType, 
  title: string, 
  content: string, 
  order: number
): Slide {
  return {
    id: crypto.randomUUID(),
    slideType: type,
    type, // backward compatibility
    title,
    content,
    slideOrder: order,
    order, // backward compatibility
    deckId: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };
}

// Example: Validating slide data from API
export function processSlideFromAPI(apiData: unknown): Slide | null {
  const validation = validateSlide(apiData);
  
  if (validation.success && validation.data) {
    return validation.data;
  } else {
    console.error('Invalid slide data:', validation.errors);
    return null;
  }
}

// Example: Safe parsing with error handling
export function safeProcessSlide(apiData: unknown): { slide?: Slide; errors?: string[] } {
  const result = safeParseSlide(apiData);
  
  if (result.success) {
    return { slide: result.data };
  } else {
    return { 
      errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
    };
  }
}

// Example: Creating a new pitch deck
export function createEmptyDeck(userId: string, title: string): PitchDeck {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    slides: [],
    created_at: new Date().toISOString()
  };
}

// Example: Creating a generation request
export function createGenerationRequest(
  companyName: string,
  industry: string,
  targetAudience: string,
  keyMessage: string,
  slideTypes?: SlideType[]
): GenerationRequest {
  return {
    company_name: companyName,
    industry,
    target_audience: targetAudience,
    key_message: keyMessage,
    slide_types: slideTypes || DEFAULT_SLIDE_ORDER
  };
}

// Example: Validating form data
export function validateDeckForm(formData: {
  title: string;
  description?: string;
}): { isValid: boolean; errors: string[] } {
  const deckData = {
    id: 'temp',
    user_id: 'temp',
    title: formData.title,
    description: formData.description,
    slides: []
  };

  const validation = validatePitchDeck(deckData);
  
  return {
    isValid: validation.success,
    errors: validation.errors || []
  };
}

// Example: Getting slide type information
export function getSlideTypeInfo(type: SlideType) {
  return SLIDE_TYPE_INFO[type];
}

// Example: Sorting slides by order
export function sortSlidesByOrder(slides: Slide[]): Slide[] {
  return [...slides].sort((a, b) => (a.slideOrder || a.order || 0) - (b.slideOrder || b.order || 0));
}