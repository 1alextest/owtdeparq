import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage, LoadingMessage, MessageList } from '../ChatMessage';
import { ChatMessage as ChatMessageType, MessageAction } from '../../../types';

describe('ChatMessage', () => {
  const mockUserMessage: ChatMessageType = {
    id: 'user-1',
    role: 'user',
    content: 'Hello, can you help me with my pitch deck?',
    timestamp: new Date('2023-01-01T05:00:00Z'),
  };

  const mockAssistantMessage: ChatMessageType = {
    id: 'assistant-1',
    role: 'assistant',
    content: 'Of course! I\'d be happy to help you with your pitch deck. What specific area would you like to focus on?',
    timestamp: new Date('2023-01-01T05:00:30Z'),
  };

  const mockAssistantMessageWithMarkdown: ChatMessageType = {
    id: 'assistant-2',
    role: 'assistant',
    content: 'Here are some **key elements** for a great pitch deck: Keep it *concise* and use `clear language`. Check out [this resource](https://example.com) for more info.',
    timestamp: new Date('2023-01-01T05:01:00Z'),
  };

  const mockMessageWithSuggestions: ChatMessageType = {
    id: 'assistant-3',
    role: 'assistant',
    content: 'I can help you improve your pitch deck in several ways:',
    timestamp: new Date('2023-01-01T05:01:30Z'),
    suggestions: [
      'Review the overall structure',
      'Improve the problem statement',
      'Add market size data',
    ],
  };

  const mockMessageWithActions: ChatMessageType = {
    id: 'assistant-4',
    role: 'assistant',
    content: 'I can apply these improvements to your slide:',
    timestamp: new Date('2023-01-01T05:02:00Z'),
    actions: [
      {
        id: 'action-1',
        type: 'apply_text',
        label: 'Apply improved title',
        data: { field: 'title', value: 'New Title' },
      },
      {
        id: 'action-2',
        type: 'improve_notes',
        label: 'Enhance speaker notes',
        data: { slideId: 'slide-123' },
      },
    ],
  };

  describe('User Messages', () => {
    it('renders user message correctly', () => {
      render(<ChatMessage message={mockUserMessage} />);

      expect(screen.getByText('Hello, can you help me with my pitch deck?')).toBeInTheDocument();
      // Check that some timestamp is displayed
      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
    });

    it('applies correct styling for user messages', () => {
      render(<ChatMessage message={mockUserMessage} />);

      const messageContainer = screen.getByText('Hello, can you help me with my pitch deck?').closest('.bg-blue-600');
      expect(messageContainer).toBeInTheDocument();
    });

    it('positions user messages on the right', () => {
      render(<ChatMessage message={mockUserMessage} />);

      const outerContainer = screen.getByText('Hello, can you help me with my pitch deck?').closest('.flex');
      expect(outerContainer).toHaveClass('justify-end');
    });
  });

  describe('Assistant Messages', () => {
    it('renders assistant message correctly', () => {
      render(<ChatMessage message={mockAssistantMessage} />);

      expect(screen.getByText(/Of course! I'd be happy to help/)).toBeInTheDocument();
      // Check that some timestamp is displayed
      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
    });

    it('applies correct styling for assistant messages', () => {
      render(<ChatMessage message={mockAssistantMessage} />);

      const messageContainer = screen.getByText(/Of course! I'd be happy to help/).closest('.bg-gray-100');
      expect(messageContainer).toBeInTheDocument();
    });

    it('positions assistant messages on the left', () => {
      render(<ChatMessage message={mockAssistantMessage} />);

      const outerContainer = screen.getByText(/Of course! I'd be happy to help/).closest('.justify-start');
      expect(outerContainer).toBeInTheDocument();
    });

    it('displays AI avatar for assistant messages', () => {
      render(<ChatMessage message={mockAssistantMessage} />);

      expect(screen.getByLabelText('AI Assistant')).toBeInTheDocument();
    });

    it('shows checkmark for assistant messages', () => {
      render(<ChatMessage message={mockAssistantMessage} />);

      const checkmark = screen.getByRole('img', { hidden: true });
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('renders bold text correctly', () => {
      render(<ChatMessage message={mockAssistantMessageWithMarkdown} />);

      const boldText = screen.getByText('key elements');
      expect(boldText.tagName).toBe('STRONG');
    });

    it('renders italic text correctly', () => {
      render(<ChatMessage message={mockAssistantMessageWithMarkdown} />);

      const italicText = screen.getByText('concise');
      expect(italicText.tagName).toBe('EM');
    });

    it('renders code correctly', () => {
      render(<ChatMessage message={mockAssistantMessageWithMarkdown} />);

      expect(screen.getByText('clear language')).toBeInTheDocument();
    });

    it('renders links correctly', () => {
      render(<ChatMessage message={mockAssistantMessageWithMarkdown} />);

      const link = screen.getByText('this resource');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Message Suggestions', () => {
    it('renders suggestions when provided', () => {
      render(<ChatMessage message={mockMessageWithSuggestions} />);

      expect(screen.getByText('💡 Review the overall structure')).toBeInTheDocument();
      expect(screen.getByText('💡 Improve the problem statement')).toBeInTheDocument();
      expect(screen.getByText('💡 Add market size data')).toBeInTheDocument();
    });

    it('handles suggestion clicks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<ChatMessage message={mockMessageWithSuggestions} />);

      const suggestionButton = screen.getByText('💡 Review the overall structure');
      fireEvent.click(suggestionButton);

      expect(consoleSpy).toHaveBeenCalledWith('Suggestion clicked:', 'Review the overall structure');
      
      consoleSpy.mockRestore();
    });

    it('applies correct styling to suggestion buttons', () => {
      render(<ChatMessage message={mockMessageWithSuggestions} />);

      const suggestionButton = screen.getByText('💡 Review the overall structure');
      expect(suggestionButton).toHaveClass('text-blue-600', 'border-blue-200');
    });
  });

  describe('Message Actions', () => {
    const mockOnActionClick = jest.fn();

    beforeEach(() => {
      mockOnActionClick.mockClear();
    });

    it('renders actions when provided', () => {
      render(
        <ChatMessage 
          message={mockMessageWithActions} 
          onActionClick={mockOnActionClick}
        />
      );

      expect(screen.getByText('⚡ Apply improved title')).toBeInTheDocument();
      expect(screen.getByText('⚡ Enhance speaker notes')).toBeInTheDocument();
    });

    it('handles action clicks', () => {
      render(
        <ChatMessage 
          message={mockMessageWithActions} 
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByText('⚡ Apply improved title');
      fireEvent.click(actionButton);

      expect(mockOnActionClick).toHaveBeenCalledWith({
        id: 'action-1',
        type: 'apply_text',
        label: 'Apply improved title',
        data: { field: 'title', value: 'New Title' },
      });
    });

    it('does not render actions when onActionClick is not provided', () => {
      render(<ChatMessage message={mockMessageWithActions} />);

      expect(screen.queryByText('⚡ Apply improved title')).not.toBeInTheDocument();
    });

    it('applies correct styling to action buttons', () => {
      render(
        <ChatMessage 
          message={mockMessageWithActions} 
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByText('⚡ Apply improved title');
      expect(actionButton).toHaveClass('text-green-600', 'border-green-200');
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator for assistant messages when loading', () => {
      render(<ChatMessage message={mockAssistantMessage} isLoading={true} />);

      expect(screen.getByText('Typing...')).toBeInTheDocument();
    });

    it('does not show loading indicator for user messages', () => {
      render(<ChatMessage message={mockUserMessage} isLoading={true} />);

      expect(screen.queryByText('Typing...')).not.toBeInTheDocument();
    });

    it('shows normal timestamp when not loading', () => {
      render(<ChatMessage message={mockAssistantMessage} isLoading={false} />);

      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
      expect(screen.queryByText('Typing...')).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('formats timestamps correctly', () => {
      const message: ChatMessageType = {
        id: 'test-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date('2023-01-01T09:30:00Z'),
      };

      render(<ChatMessage message={message} />);

      // Check that timestamp is formatted as time
      expect(screen.getByText(/\d{1,2}:\d{2} [AP]M/)).toBeInTheDocument();
    });
  });
});

describe('LoadingMessage', () => {
  it('renders loading message correctly', () => {
    render(<LoadingMessage />);

    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('has correct positioning and styling', () => {
    render(<LoadingMessage />);

    const container = screen.getByText('AI is thinking...').closest('.justify-start');
    expect(container).toBeInTheDocument();
  });

  it('shows animated dots', () => {
    render(<LoadingMessage />);

    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });
});

describe('MessageList', () => {
  const mockMessages: ChatMessageType[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date('2023-01-01T10:00:00Z'),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date('2023-01-01T10:00:30Z'),
    },
  ];

  const mockOnActionClick = jest.fn();

  beforeEach(() => {
    mockOnActionClick.mockClear();
  });

  it('renders multiple messages correctly', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading message when loading', () => {
    render(<MessageList messages={mockMessages} isLoading={true} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('does not show loading message when not loading', () => {
    render(<MessageList messages={mockMessages} isLoading={false} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument();
  });

  it('passes onActionClick to individual messages', () => {
    const messageWithAction: ChatMessageType = {
      id: 'msg-3',
      role: 'assistant',
      content: 'Test message',
      timestamp: new Date(),
      actions: [
        {
          id: 'action-1',
          type: 'apply_text',
          label: 'Test Action',
          data: {},
        },
      ],
    };

    render(
      <MessageList 
        messages={[messageWithAction]} 
        onActionClick={mockOnActionClick}
      />
    );

    const actionButton = screen.getByText('⚡ Test Action');
    fireEvent.click(actionButton);

    expect(mockOnActionClick).toHaveBeenCalledWith({
      id: 'action-1',
      type: 'apply_text',
      label: 'Test Action',
      data: {},
    });
  });

  it('renders empty list correctly', () => {
    render(<MessageList messages={[]} />);

    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument();
  });
});