import { apiClient } from './apiClient';
import {
  ChatRequest,
  ChatResponse,
  ImproveSpeakerNotesRequest,
  ImproveSpeakerNotesResponse,
  ChatMessage,
  ChatContext,
  QuickAction,
} from '../types';
import { createDashboardVirtualDeckId } from '../utils/virtual-decks';

/**
 * Service class for chatbot API integration
 * Handles chat messages, speaker notes improvement, and error handling with retry logic
 */
export class ChatbotService {
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second

  /**
   * Send a chat message to the AI assistant
   * @param message - User message
   * @param context - Current chat context (deck/slide info)
   * @param userId - Current user's ID
   * @returns Promise<ChatResponse>
   */
  async sendMessage(message: string, context: ChatContext, userId: string): Promise<ChatResponse> {
    // Determine the effective deck ID (real deck or virtual dashboard deck)
    const effectiveDeckId = context.type === 'dashboard'
      ? createDashboardVirtualDeckId(userId)
      : context.deckId!;

    const request: ChatRequest = {
      message: message.trim(),
      deckId: effectiveDeckId,
      ...(context.slideId && { slideId: context.slideId }),
      context: {
        type: context.type,
        deckTitle: context.deckTitle,
        slideTitle: context.slideTitle,
        slideType: context.slideType,
      },
    };

    return this.executeWithRetry(() => apiClient.sendChatMessage(request));
  }

  /**
   * Improve speaker notes for a specific slide
   * @param slideId - ID of the slide
   * @param currentNotes - Current speaker notes
   * @param improvementType - Type of improvement (clarity, engagement, structure, detail)
   * @returns Promise<ImproveSpeakerNotesResponse>
   */
  async improveSpeakerNotes(
    slideId: string,
    currentNotes: string,
    improvementType: 'clarity' | 'engagement' | 'structure' | 'detail'
  ): Promise<ImproveSpeakerNotesResponse> {
    const request: ImproveSpeakerNotesRequest = {
      slideId,
      currentNotes: currentNotes.trim(),
      improvementType,
    };

    return this.executeWithRetry(() => apiClient.improveSpeakerNotes(request));
  }

  /**
   * Get context-aware quick actions based on current context
   * @param context - Current chat context
   * @returns Array of quick actions
   */
  getQuickActions(context: ChatContext): QuickAction[] {
    const baseActions: QuickAction[] = [];

    switch (context.type) {
      case 'dashboard':
        baseActions.push(
          {
            id: 'help-start-deck',
            label: 'Help me start a new pitch deck',
            icon: '🚀',
            prompt: 'I want to create a new pitch deck. Can you guide me through the process and help me understand what makes a compelling investor presentation?',
            context: ['dashboard'],
          },
          {
            id: 'best-practices',
            label: 'Show me pitch deck best practices',
            icon: '💡',
            prompt: 'What are the key best practices for creating effective pitch decks that investors want to see?',
            context: ['dashboard'],
          },
          {
            id: 'industry-insights',
            label: 'Get industry-specific insights',
            icon: '📊',
            prompt: 'Can you provide insights on what investors look for in pitch decks for my industry?',
            context: ['dashboard'],
          }
        );
        break;

      case 'deck':
        baseActions.push(
          {
            id: 'review-structure',
            label: 'Review deck structure',
            icon: '🏗️',
            prompt: 'Can you review the overall structure of my pitch deck and suggest improvements?',
            context: ['deck'],
          },
          {
            id: 'improve-flow',
            label: 'Improve overall flow',
            icon: '🔄',
            prompt: 'How can I improve the flow and narrative of my pitch deck to make it more compelling?',
            context: ['deck'],
          },
          {
            id: 'missing-slides',
            label: 'Identify missing slides',
            icon: '🔍',
            prompt: 'Are there any important slides or sections missing from my pitch deck?',
            context: ['deck'],
          }
        );
        break;

      case 'slide':
        baseActions.push(
          {
            id: 'improve-slide',
            label: 'Improve this slide',
            icon: '✨',
            prompt: `Can you help me improve the content and messaging of this ${context.slideType || 'slide'}?`,
            context: ['slide'],
          },
          {
            id: 'make-compelling',
            label: 'Make it more compelling',
            icon: '🎯',
            prompt: 'How can I make this slide more compelling and persuasive for investors?',
            context: ['slide'],
          },
          {
            id: 'add-data',
            label: 'Suggest data points',
            icon: '📈',
            prompt: 'What specific data points or metrics should I include in this slide to strengthen my case?',
            context: ['slide'],
          }
        );
        break;
    }

    return baseActions;
  }

  /**
   * Validate chat message before sending
   * @param message - Message to validate
   * @returns Validation result with error message if invalid
   */
  validateMessage(message: string): { isValid: boolean; error?: string } {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (trimmedMessage.length > 2000) {
      return { isValid: false, error: 'Message is too long (max 2000 characters)' };
    }

    return { isValid: true };
  }

  /**
   * Validate chat context
   * @param context - Context to validate
   * @returns Validation result with error message if invalid
   */
  validateContext(context: ChatContext): { isValid: boolean; error?: string } {
    if (context.type === 'deck' || context.type === 'slide') {
      if (!context.deckId) {
        return { isValid: false, error: 'Deck ID is required for deck/slide context' };
      }
    }

    if (context.type === 'slide' && !context.slideId) {
      return { isValid: false, error: 'Slide ID is required for slide context' };
    }

    return { isValid: true };
  }

  /**
   * Create a chat message object
   * @param role - Message role (user or assistant)
   * @param content - Message content
   * @param suggestions - Optional suggestions
   * @param actions - Optional actions
   * @returns ChatMessage object
   */
  createChatMessage(
    role: 'user' | 'assistant',
    content: string,
    suggestions?: string[],
    actions?: any[]
  ): ChatMessage {
    return {
      id: this.generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      suggestions,
      actions,
    };
  }

  /**
   * Execute API call with retry logic
   * @param apiCall - Function that makes the API call
   * @returns Promise with the API response
   */
  private async executeWithRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors (4xx status codes)
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.baseRetryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    // eslint-disable-next-line no-throw-literal
    throw lastError!;
  }

  /**
   * Check if an error should not be retried
   * @param error - Error to check
   * @returns True if error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication errors, validation errors, etc.
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('authentication failed') ||
      message.includes('invalid') ||
      message.includes('bad request') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    );
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique message ID
   * @returns Unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user-friendly error message
   * @param error - Error object
   * @returns User-friendly error message
   */
  getUserFriendlyErrorMessage(error: any): string {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('authentication')) {
      return 'Authentication failed. Please log in again.';
    }

    if (message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (message.includes('service unavailable') || message.includes('500')) {
      return 'AI service is temporarily unavailable. Please try again later.';
    }

    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Return the original error message if it's user-friendly, otherwise a generic message
    if (error.message && error.message.length < 100 && !message.includes('http')) {
      return error.message;
    }

    return 'Something went wrong. Please try again.';
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();