import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { ChatbotProvider, useChatbot } from '../ChatbotContext';
import { ChatContext } from '../../types';

// Mock the entire chatbot service module
jest.mock('../../services/chatbotService', () => ({
  chatbotService: {
    sendMessage: jest.fn(),
    improveSpeakerNotes: jest.fn(),
    getQuickActions: jest.fn(),
    validateMessage: jest.fn(),
    validateContext: jest.fn(),
    createChatMessage: jest.fn(),
    getUserFriendlyErrorMessage: jest.fn(),
  },
}));

// Mock Firebase config to avoid initialization issues
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

const mockChatbotService = require('../../services/chatbotService').chatbotService;

// Test component that uses the chatbot context
const TestComponent: React.FC = () => {
  const {
    isOpen,
    currentContext,
    messages,
    isLoading,
    error,
    quickActions,
    openChatbot,
    closeChatbot,
    sendMessage,
    updateContext,
    clearError,
    clearMessages,
    retryLastMessage,
  } = useChatbot();

  return (
    <div>
      <div data-testid="is-open">{isOpen.toString()}</div>
      <div data-testid="context-type">{currentContext.type}</div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="quick-actions-count">{quickActions.length}</div>
      
      <button onClick={() => openChatbot()}>Open Chatbot</button>
      <button onClick={closeChatbot}>Close Chatbot</button>
      <button onClick={() => sendMessage('test message')}>Send Message</button>
      <button onClick={() => updateContext({ type: 'deck', deckId: 'test-deck' })}>
        Update Context
      </button>
      <button onClick={clearError}>Clear Error</button>
      <button onClick={clearMessages}>Clear Messages</button>
      <button onClick={retryLastMessage}>Retry Last Message</button>
    </div>
  );
};

describe('ChatbotContext', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('provides initial state correctly', () => {
    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('context-type')).toHaveTextContent('dashboard');
    expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('quick-actions-count')).toHaveTextContent('3'); // Dashboard has 3 quick actions
  });

  it('opens and closes chatbot correctly', async () => {
    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Initially closed
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');

    // Open chatbot
    act(() => {
      fireEvent.click(screen.getByText('Open Chatbot'));
    });
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');

    // Close chatbot
    act(() => {
      fireEvent.click(screen.getByText('Close Chatbot'));
    });
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('updates context correctly', async () => {
    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Initially dashboard context
    expect(screen.getByTestId('context-type')).toHaveTextContent('dashboard');
    expect(screen.getByTestId('quick-actions-count')).toHaveTextContent('3');

    // Update to deck context
    act(() => {
      fireEvent.click(screen.getByText('Update Context'));
    });
    expect(screen.getByTestId('context-type')).toHaveTextContent('deck');
    expect(screen.getByTestId('quick-actions-count')).toHaveTextContent('3'); // Deck also has 3 quick actions
  });

  it('sends messages correctly', async () => {
    mockChatbotService.sendMessage.mockResolvedValue({
      message: 'AI response',
      suggestions: ['suggestion 1', 'suggestion 2'],
    });

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Send a message
    act(() => {
      fireEvent.click(screen.getByText('Send Message'));
    });

    // Wait for message to be processed
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2'); // User + AI message
    });

    expect(mockChatbotService.sendMessage).toHaveBeenCalledWith('test message', {
      type: 'dashboard',
    });
  });

  it('handles message sending errors', async () => {
    mockChatbotService.sendMessage.mockRejectedValue(new Error('Network error'));

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Send a message that will fail
    act(() => {
      fireEvent.click(screen.getByText('Send Message'));
    });

    // Wait for error to be set
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1'); // Only user message
    });
  });

  it('clears error correctly', async () => {
    mockChatbotService.sendMessage.mockRejectedValue(new Error('Test error'));

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Trigger an error
    act(() => {
      fireEvent.click(screen.getByText('Send Message'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });

    // Clear the error
    act(() => {
      fireEvent.click(screen.getByText('Clear Error'));
    });
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('clears messages correctly', async () => {
    mockChatbotService.sendMessage.mockResolvedValue({
      message: 'AI response',
    });

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Send a message first
    act(() => {
      fireEvent.click(screen.getByText('Send Message'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
    });

    // Clear messages
    act(() => {
      fireEvent.click(screen.getByText('Clear Messages'));
    });
    expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
  });

  it('persists messages in session storage', async () => {
    mockChatbotService.sendMessage.mockResolvedValue({
      message: 'AI response',
    });

    const { unmount } = render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Send a message
    act(() => {
      fireEvent.click(screen.getByText('Send Message'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
    });

    // Unmount and remount to simulate page refresh
    unmount();

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Messages should be restored from session storage
    expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
  });

  it('persists context in session storage', async () => {
    const { unmount } = render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Update context
    act(() => {
      fireEvent.click(screen.getByText('Update Context'));
    });
    expect(screen.getByTestId('context-type')).toHaveTextContent('deck');

    // Unmount and remount to simulate page refresh
    unmount();

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Context should be restored from session storage
    expect(screen.getByTestId('context-type')).toHaveTextContent('deck');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useChatbot must be used within a ChatbotProvider');

    consoleSpy.mockRestore();
  });

  it('retries last message correctly', async () => {
    // First call fails, second succeeds
    mockChatbotService.sendMessage
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        message: 'AI response after retry',
      });

    render(
      <ChatbotProvider>
        <TestComponent />
      </ChatbotProvider>
    );

    // Send a message that will fail
    act(() => {
      fireEvent.click(screen.getByText('Send Message'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      expect(screen.getByTestId('messages-count')).toHaveTextContent('1'); // Only user message
    });

    // Retry the last message
    act(() => {
      fireEvent.click(screen.getByText('Retry Last Message'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('messages-count')).toHaveTextContent('2'); // User + AI message
    });

    expect(mockChatbotService.sendMessage).toHaveBeenCalledTimes(2);
  });
});