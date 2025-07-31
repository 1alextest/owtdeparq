import { chatbotService } from '../chatbotService';
import { ChatContext } from '../../types';

// Mock the apiClient
jest.mock('../apiClient', () => ({
  apiClient: {
    sendChatMessage: jest.fn(),
    improveSpeakerNotes: jest.fn(),
  },
}));

describe('ChatbotService', () => {
  describe('validateMessage', () => {
    it('should validate empty message', () => {
      const result = chatbotService.validateMessage('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });

    it('should validate whitespace-only message', () => {
      const result = chatbotService.validateMessage('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message cannot be empty');
    });

    it('should validate message too long', () => {
      const longMessage = 'a'.repeat(2001);
      const result = chatbotService.validateMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Message is too long (max 2000 characters)');
    });

    it('should validate valid message', () => {
      const result = chatbotService.validateMessage('Hello, this is a valid message');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateContext', () => {
    it('should validate dashboard context', () => {
      const context: ChatContext = { type: 'dashboard' };
      const result = chatbotService.validateContext(context);
      expect(result.isValid).toBe(true);
    });

    it('should validate deck context without deckId', () => {
      const context: ChatContext = { type: 'deck' };
      const result = chatbotService.validateContext(context);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Deck ID is required for deck/slide context');
    });

    it('should validate deck context with deckId', () => {
      const context: ChatContext = { 
        type: 'deck', 
        deckId: 'deck-123',
        deckTitle: 'My Deck'
      };
      const result = chatbotService.validateContext(context);
      expect(result.isValid).toBe(true);
    });

    it('should validate slide context without slideId', () => {
      const context: ChatContext = { 
        type: 'slide', 
        deckId: 'deck-123'
      };
      const result = chatbotService.validateContext(context);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Slide ID is required for slide context');
    });

    it('should validate slide context with slideId', () => {
      const context: ChatContext = { 
        type: 'slide', 
        deckId: 'deck-123',
        slideId: 'slide-456',
        slideTitle: 'Problem Statement',
        slideType: 'problem'
      };
      const result = chatbotService.validateContext(context);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getQuickActions', () => {
    it('should return dashboard quick actions', () => {
      const context: ChatContext = { type: 'dashboard' };
      const actions = chatbotService.getQuickActions(context);
      
      expect(actions).toHaveLength(3);
      expect(actions[0].id).toBe('help-start-deck');
      expect(actions[1].id).toBe('best-practices');
      expect(actions[2].id).toBe('industry-insights');
    });

    it('should return deck quick actions', () => {
      const context: ChatContext = { 
        type: 'deck', 
        deckId: 'deck-123',
        deckTitle: 'My Deck'
      };
      const actions = chatbotService.getQuickActions(context);
      
      expect(actions).toHaveLength(3);
      expect(actions[0].id).toBe('review-structure');
      expect(actions[1].id).toBe('improve-flow');
      expect(actions[2].id).toBe('missing-slides');
    });

    it('should return slide quick actions', () => {
      const context: ChatContext = { 
        type: 'slide', 
        deckId: 'deck-123',
        slideId: 'slide-456',
        slideType: 'problem'
      };
      const actions = chatbotService.getQuickActions(context);
      
      expect(actions).toHaveLength(3);
      expect(actions[0].id).toBe('improve-slide');
      expect(actions[1].id).toBe('make-compelling');
      expect(actions[2].id).toBe('add-data');
    });
  });

  describe('createChatMessage', () => {
    it('should create user message', () => {
      const message = chatbotService.createChatMessage('user', 'Hello');
      
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });

    it('should create assistant message with suggestions', () => {
      const suggestions = ['Suggestion 1', 'Suggestion 2'];
      const message = chatbotService.createChatMessage('assistant', 'Hello back', suggestions);
      
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hello back');
      expect(message.suggestions).toEqual(suggestions);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should handle network errors', () => {
      const error = new Error('Network request failed');
      const message = chatbotService.getUserFriendlyErrorMessage(error);
      expect(message).toBe('Network error. Please check your connection and try again.');
    });

    it('should handle authentication errors', () => {
      const error = new Error('Authentication failed');
      const message = chatbotService.getUserFriendlyErrorMessage(error);
      expect(message).toBe('Authentication failed. Please log in again.');
    });

    it('should handle rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const message = chatbotService.getUserFriendlyErrorMessage(error);
      expect(message).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should handle generic errors', () => {
      const error = new Error('Some random error');
      const message = chatbotService.getUserFriendlyErrorMessage(error);
      expect(message).toBe('Some random error');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some complex technical error with lots of details that users should not see because it contains sensitive information and technical jargon that would be confusing');
      const message = chatbotService.getUserFriendlyErrorMessage(error);
      expect(message).toBe('Something went wrong. Please try again.');
    });
  });
});