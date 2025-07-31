import { apiClient } from '../apiClient';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('API Client - AI Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message with correct payload for real deck', async () => {
      const mockResponse = {
        message: 'AI response about your deck',
        suggestions: ['Improve slide 1', 'Add more data'],
        provider: 'groq',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const chatRequest = {
        message: 'How can I improve my pitch deck?',
        deckId: 'real-deck-123',
        slideId: 'slide-456',
        context: {
          type: 'slide' as const,
          deckId: 'real-deck-123',
          slideId: 'slide-456',
          deckTitle: 'My Startup Deck',
          slideTitle: 'Problem Statement',
          slideType: 'problem',
        },
      };

      const result = await apiClient.sendChatMessage(chatRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/chatbot/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify(chatRequest),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should send chat message for virtual deck (dashboard)', async () => {
      const mockResponse = {
        message: 'General pitch deck guidance',
        suggestions: ['Start with problem', 'Define your market'],
        provider: 'groq',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const chatRequest = {
        message: 'What should I include in my pitch deck?',
        deckId: 'a4446b18-c9fb-592a-8808-16b166a802f4', // Virtual deck UUID
        context: {
          type: 'dashboard' as const,
        },
      };

      const result = await apiClient.sendChatMessage(chatRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/chatbot/chat',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(chatRequest),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle chat API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const chatRequest = {
        message: 'Test message',
        deckId: 'deck-123',
        context: { type: 'deck' as const },
      };

      await expect(apiClient.sendChatMessage(chatRequest)).rejects.toThrow();
    });
  });

  describe('regenerateSlide', () => {
    it('should regenerate slide with correct DTO format', async () => {
      const mockRegeneratedSlide = {
        id: 'slide-123',
        title: 'Enhanced Problem Statement',
        content: 'Enhanced problem content with better structure',
        speaker_notes: 'Enhanced speaker notes',
        generatedBy: 'groq',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegeneratedSlide,
      } as Response);

      const result = await apiClient.regenerateSlide('slide-123', 'make it more compelling');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/generate/slides/slide-123/regenerate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            modelChoice: 'groq',
            userFeedback: 'make it more compelling',
            userApiKey: undefined,
          }),
        }
      );

      expect(result).toEqual(mockRegeneratedSlide);
    });

    it('should use default improvement type when none provided', async () => {
      const mockRegeneratedSlide = {
        id: 'slide-123',
        title: 'Improved Title',
        content: 'Improved content',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegeneratedSlide,
      } as Response);

      await apiClient.regenerateSlide('slide-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            modelChoice: 'groq',
            userFeedback: 'general',
            userApiKey: undefined,
          }),
        })
      );
    });

    it('should handle regeneration API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(apiClient.regenerateSlide('slide-123')).rejects.toThrow();
    });

    it('should use Groq as default model choice', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'slide-123' }),
      } as Response);

      await apiClient.regenerateSlide('slide-123', 'improve clarity');

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.modelChoice).toBe('groq');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.sendChatMessage({
        message: 'test',
        deckId: 'deck-123',
        context: { type: 'deck' },
      })).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(apiClient.sendChatMessage({
        message: 'test',
        deckId: 'deck-123',
        context: { type: 'deck' },
      })).rejects.toThrow();
    });

    it('should handle 404 not found errors for slide regeneration', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(apiClient.regenerateSlide('nonexistent-slide')).rejects.toThrow();
    });
  });

  describe('Request Headers', () => {
    it('should include authorization header when token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await apiClient.sendChatMessage({
        message: 'test',
        deckId: 'deck-123',
        context: { type: 'deck' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should include content-type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await apiClient.regenerateSlide('slide-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Response Validation', () => {
    it('should return parsed JSON response for successful requests', async () => {
      const expectedResponse = {
        message: 'Success',
        data: { key: 'value' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedResponse,
      } as Response);

      const result = await apiClient.sendChatMessage({
        message: 'test',
        deckId: 'deck-123',
        context: { type: 'deck' },
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty response bodies', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response);

      const result = await apiClient.sendChatMessage({
        message: 'test',
        deckId: 'deck-123',
        context: { type: 'deck' },
      });

      expect(result).toBeNull();
    });
  });
});
