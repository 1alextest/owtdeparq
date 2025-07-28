// Constants and enums for the AI Pitch Deck Generator

import { SlideType } from './index';

// Slide type definitions with display names and descriptions
export const SLIDE_TYPE_INFO: Record<SlideType, { 
  label: string; 
  description: string;
  icon?: string;
}> = {
  cover: {
    label: 'Cover Slide',
    description: 'Company name, tagline, and basic information',
    icon: '🏢'
  },
  problem: {
    label: 'Problem',
    description: 'The problem your company solves',
    icon: '❗'
  },
  solution: {
    label: 'Solution',
    description: 'How your product/service solves the problem',
    icon: '💡'
  },
  market: {
    label: 'Market Opportunity',
    description: 'Market size, trends, and opportunity',
    icon: '📈'
  },
  product: {
    label: 'Product',
    description: 'Product overview and features',
    icon: '📱'
  },
  business_model: {
    label: 'Business Model',
    description: 'How you make money',
    icon: '💰'
  },
  go_to_market: {
    label: 'Go-to-Market',
    description: 'Marketing and sales strategy',
    icon: '🚀'
  },
  competition: {
    label: 'Competition',
    description: 'Competitive landscape and differentiation',
    icon: '⚔️'
  },
  team: {
    label: 'Team',
    description: 'Key team members and their expertise',
    icon: '👥'
  },
  financials: {
    label: 'Financials',
    description: 'Revenue projections and key metrics',
    icon: '📊'
  },
  traction: {
    label: 'Traction',
    description: 'Progress and milestones achieved',
    icon: '📈'
  },
  funding_ask: {
    label: 'Funding Ask',
    description: 'Investment amount and use of funds',
    icon: '🎯'
  }
};

// Default slide order for template generation
export const DEFAULT_SLIDE_ORDER: SlideType[] = [
  'cover',
  'problem',
  'solution',
  'market',
  'product',
  'business_model',
  'go_to_market',
  'competition',
  'team',
  'financials',
  'traction',
  'funding_ask'
];

// Common industries for the generation form
export const COMMON_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Real Estate',
  'Food & Beverage',
  'Transportation',
  'Entertainment',
  'Manufacturing',
  'Other'
];

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile'
  },
  DECKS: {
    LIST: '/api/decks',
    CREATE: '/api/decks',
    GET: (id: string) => `/api/decks/${id}`,
    UPDATE: (id: string) => `/api/decks/${id}`,
    DELETE: (id: string) => `/api/decks/${id}`
  },
  SLIDES: {
    CREATE: (deckId: string) => `/api/decks/${deckId}/slides`,
    UPDATE: (deckId: string, slideId: string) => `/api/decks/${deckId}/slides/${slideId}`,
    DELETE: (deckId: string, slideId: string) => `/api/decks/${deckId}/slides/${slideId}`,
    REORDER: (deckId: string) => `/api/decks/${deckId}/slides/reorder`
  },
  GENERATION: {
    GENERATE: '/api/generate'
  }
} as const;