// Core type definitions and Zod schemas for the AI Pitch Deck Generator

import { z } from 'zod';

// Slide Types
export const SlideTypeSchema = z.enum([
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
]);

export type SlideType = z.infer<typeof SlideTypeSchema>;

// Slide Schema
export const SlideSchema = z.object({
  id: z.string(),
  slideType: SlideTypeSchema,
  type: SlideTypeSchema.optional(), // Keep for backward compatibility
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  slideOrder: z.number().int().min(0),
  order: z.number().int().min(0).optional(), // Keep for backward compatibility
  speakerNotes: z.string().optional(),
  generatedBy: z.string().optional(),
  deckId: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type Slide = z.infer<typeof SlideSchema>;

// Pitch Deck Schema
export const PitchDeckSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1, 'Deck title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  slides: z.array(SlideSchema).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type PitchDeck = z.infer<typeof PitchDeckSchema>;

// User Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email('Invalid email format'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type User = z.infer<typeof UserSchema>;

// Generation Request Schema (for AI generation)
export const GenerationRequestSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  target_audience: z.string().min(1, 'Target audience is required'),
  key_message: z.string().min(1, 'Key message is required'),
  slide_types: z.array(SlideTypeSchema).min(1, 'At least one slide type required')
});

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

// API Response Schemas
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional()
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string().optional()
});

export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;

// Project Schema
export const ProjectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().optional(),
  deck_count: z.number().int().min(0).default(0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type Project = z.infer<typeof ProjectSchema>;

// Chatbot Types
export const ChatMessageRoleSchema = z.enum(['user', 'assistant']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  timestamp: z.union([z.date(), z.string()]).transform((val) => {
    // Convert string timestamps to Date objects
    return val instanceof Date ? val : new Date(val);
  }),
  suggestions: z.array(z.string()).optional(),
  actions: z.array(z.any()).optional(), // MessageAction type will be defined separately
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatContextSchema = z.object({
  type: z.enum(['dashboard', 'deck', 'slide']),
  deckId: z.string().optional(),
  slideId: z.string().optional(),
  deckTitle: z.string().optional(),
  slideTitle: z.string().optional(),
  slideType: z.string().optional(),
});

export type ChatContext = z.infer<typeof ChatContextSchema>;

export const MessageActionSchema = z.object({
  id: z.string(),
  type: z.enum(['apply_text', 'improve_notes', 'regenerate_slide', 'navigate']),
  label: z.string(),
  data: z.any(),
});

export type MessageAction = z.infer<typeof MessageActionSchema>;

export const QuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  prompt: z.string(),
  context: z.array(z.string()),
});

export type QuickAction = z.infer<typeof QuickActionSchema>;

// Chatbot API Request/Response Types
export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  deckId: z.string().min(1, 'Deck ID is required'),
  slideId: z.string().uuid('Invalid slide ID').optional(),
  context: z.any().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()).optional(),
  contextUsed: z.any().optional(),
  provider: z.string().optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ImproveSpeakerNotesRequestSchema = z.object({
  slideId: z.string().uuid('Invalid slide ID'),
  currentNotes: z.string().min(1, 'Current notes cannot be empty'),
  improvementType: z.enum(['clarity', 'engagement', 'structure', 'detail']),
});

export type ImproveSpeakerNotesRequest = z.infer<typeof ImproveSpeakerNotesRequestSchema>;

export const ImproveSpeakerNotesResponseSchema = z.object({
  improvedNotes: z.string(),
  originalNotes: z.string(),
  improvementType: z.string(),
  slideTitle: z.string(),
  provider: z.string().optional(),
});

export type ImproveSpeakerNotesResponse = z.infer<typeof ImproveSpeakerNotesResponseSchema>;