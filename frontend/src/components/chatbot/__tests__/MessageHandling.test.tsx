import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatbotPanel } from '../ChatbotPanel';
import { ChatbotProvider } from '../../../contexts/ChatbotContext';
import { chatbotService } from '../../../services/chatbotService';

// Mock the chatbot service
jest.mock('../../../services/chatbotService', () => ({
  chatbotService: {
    sendMessage: jest.fn(),
    getUserFriendlyErrorMessage: jest.fn(),
  },
}));

// Mock the useChatbot hook to return open state
jest.mock('../../../contexts/ChatbotContext', () => ({
  useChatbot: () => ({
    isOpen: true,
    closeChatbot: jest.fn(),
    currentContext: { type: 'dashboard' },
    messages: [],
    isLoading: false,
    error: null,
    quickActions: [
      {
        id: 'start-deck',
        label: 'Help me start a pitch deck',
        icon: '🚀',
        prompt: 'I want to create a new pitch deck. Can you guide me through the process?',
        context: ['dashboard'],
      },
    ],
    clearError: jest.fn(),
    executeAction: jest.fn(),
    sendMessage: jest.fn(),
    retryLastMessage: jest.fn(),
  }),
}));

const mockChatbotService = chatbotService as jest.Mocked<typeof chatbotService>;

// Simple test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

describe('Message Handling and Conversation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatbotService.getUserFriendlyErrorMessage.mockReturnValue('Something went wrong. Please try again.');
  });

  describe('Message Input', () => {
    it('renders message input with placeholder', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      expect(input).toBeInTheDocument();
    });

    it('allows typing in the input field', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      
      expect(input).toHaveValue('Hello AI');
    });

    it('shows character count when approaching limit', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const longMessage = 'a'.repeat(1850);
      fireEvent.change(input, { target: { value: longMessage } });
      
      expect(screen.getByText('1850/2000 characters')).toBeInTheDocument();
    });

    it('disables send button when input is empty', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /Send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has content', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      mockChatbotService.sendMessage.mockResolvedValue({
        message: 'Hello! How can I help you with your pitch deck?',
        suggestions: ['Help with structure', 'Improve content'],
      });

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockChatbotService.sendMessage).toHaveBeenCalledWith(
          'Hello AI',
          expect.any(Object)
        );
      });
    });

    it('sends message when Enter key is pressed', async () => {
      mockChatbotService.sendMessage.mockResolvedValue({
        message: 'Hello! How can I help you?',
      });

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockChatbotService.sendMessage).toHaveBeenCalledWith(
          'Hello AI',
          expect.any(Object)
        );
      });
    });

    it('does not send message when Shift+Enter is pressed', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(mockChatbotService.sendMessage).not.toHaveBeenCalled();
    });

    it('clears input after sending message', async () => {
      mockChatbotService.sendMessage.mockResolvedValue({
        message: 'Hello! How can I help you?',
      });

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      // Input should be cleared immediately
      expect(input).toHaveValue('');
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner on send button during message sending', async () => {
      mockChatbotService.sendMessage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Response' }), 100))
      );

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      // Should show loading spinner
      expect(sendButton.querySelector('.animate-spin')).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });

    it('disables input during message sending', async () => {
      mockChatbotService.sendMessage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Response' }), 100))
      );

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      expect(input).toBeDisabled();
    });

    it('shows typing indicator during AI response', async () => {
      mockChatbotService.sendMessage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Response' }), 100))
      );

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
      });

      // Should show animated dots
      const dots = screen.container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('shows error message when message sending fails', async () => {
      mockChatbotService.sendMessage.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Message failed to send')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('allows retrying failed messages', async () => {
      mockChatbotService.sendMessage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ message: 'Success!' });

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      // First attempt fails
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Message failed to send')).toBeInTheDocument();
      });

      // Retry the message
      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText('Message failed to send')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions Integration', () => {
    it('populates input when quick action is clicked', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      // Quick actions should be visible when no messages exist
      const quickActionButtons = screen.getAllByRole('button');
      const quickActionButton = quickActionButtons.find(button => 
        button.textContent?.includes('Help me start')
      );

      if (quickActionButton) {
        fireEvent.click(quickActionButton);

        const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
        expect(input).toHaveValue(expect.stringContaining('pitch deck'));
      }
    });
  });

  describe('Conversation History', () => {
    it('displays user and assistant messages in conversation', async () => {
      mockChatbotService.sendMessage.mockResolvedValue({
        message: 'Hello! How can I help you with your pitch deck?',
      });

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        // User message should appear
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
        // AI response should appear
        expect(screen.getByText('Hello! How can I help you with your pitch deck?')).toBeInTheDocument();
      });
    });

    it('shows retry button on assistant messages', async () => {
      mockChatbotService.sendMessage.mockResolvedValue({
        message: 'Hello! How can I help you?',
      });

      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Ask me anything about your pitch deck...');
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      
      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Regenerate response/i })).toBeInTheDocument();
      });
    });
  });

  describe('Input Hints', () => {
    it('shows input hints below the input field', () => {
      render(
        <TestWrapper>
          <ChatbotPanel />
        </TestWrapper>
      );

      expect(screen.getByText('Press Enter to send • Shift+Enter for new line')).toBeInTheDocument();
    });
  });
});