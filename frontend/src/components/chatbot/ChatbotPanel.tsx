import React, { useEffect, useRef, useState } from 'react';
import { useChatbot } from '../../contexts/ChatbotContext';
import { MessageList } from './ChatMessage';
import { QuickActions } from './QuickActions';

interface ChatbotPanelProps {
  className?: string;
}

export const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ className = '' }) => {
  const {
    isOpen,
    closeChatbot,
    currentContext,
    messages,
    isLoading,
    error,
    quickActions,
    clearError,
    executeAction,
    sendMessage,
    retryLastMessage,
  } = useChatbot();

  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Input state
  const [inputMessage, setInputMessage] = useState('');

  // Handle focus management when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the panel for screen readers
      setTimeout(() => {
        panelRef.current?.focus();
      }, 100);
    } else {
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeChatbot();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeChatbot]);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Wait for panel animation to complete
    }
  }, [isOpen]);

  // Message handling functions
  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message || isLoading) return;

    setInputMessage('');
    await sendMessage(message);
  };

  const handleInputKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickActionClick = (action: any) => {
    setInputMessage(action.prompt);
    // Focus the input after setting the message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleRetryMessage = async () => {
    await retryLastMessage();
  };

  // Get context display information
  const getContextDisplay = () => {
    switch (currentContext.type) {
      case 'dashboard':
        return {
          title: 'AI Assistant',
          subtitle: 'General pitch deck guidance',
          icon: '🏠',
        };
      case 'deck':
        return {
          title: 'Deck Assistant',
          subtitle: currentContext.deckTitle || 'Pitch deck help',
          icon: '📊',
        };
      case 'slide':
        return {
          title: 'Slide Assistant',
          subtitle: currentContext.slideTitle || 'Slide-specific help',
          icon: '📄',
        };
      default:
        return {
          title: 'AI Assistant',
          subtitle: 'How can I help you?',
          icon: '🤖',
        };
    }
  };

  const contextDisplay = getContextDisplay();

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={closeChatbot}
        aria-hidden="true"
      />

      {/* Panel container */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full z-50
          bg-white shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          w-full lg:w-96
          flex flex-col
          focus:outline-none
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-title"
        aria-describedby="chatbot-description"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-blue-600 text-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl" role="img" aria-label="Context icon">
                {contextDisplay.icon}
              </span>
              <div>
                <h2 id="chatbot-title" className="text-lg font-semibold">
                  {contextDisplay.title}
                </h2>
                <p id="chatbot-description" className="text-blue-100 text-sm">
                  {contextDisplay.subtitle}
                </p>
              </div>
            </div>
            
            <button
              onClick={closeChatbot}
              className="
                p-2 rounded-full hover:bg-blue-700 
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-300
              "
              aria-label="Close AI Assistant"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4" role="img" aria-label="AI Assistant">
                🤖
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hi! I'm your AI Assistant
              </h3>
              <p className="text-gray-600 mb-6">
                I'm here to help you create amazing pitch decks. Ask me anything about:
              </p>
              <div className="text-left space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Pitch deck structure and best practices
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Content improvement and suggestions
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Industry-specific insights
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Speaker notes enhancement
                </div>
              </div>
            </div>
          ) : (
            <>
              <MessageList 
                messages={messages}
                isLoading={isLoading}
                onActionClick={(action) => {
                  // Execute the action using the context function
                  executeAction(action);
                }}
                onRetryClick={handleRetryMessage}
              />
              
              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg mt-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && messages.length === 0 && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <QuickActions
              actions={quickActions}
              context={currentContext}
              onActionClick={handleQuickActionClick}
              disabled={isLoading}
              maxActions={3}
            />
          </div>
        )}

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          {/* Error retry option */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">Message failed to send</span>
                </div>
                <button
                  onClick={handleRetryMessage}
                  className="text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
                  disabled={isLoading}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleInputKeyPress}
                placeholder="Ask me anything about your pitch deck..."
                className="
                  w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  resize-none
                "
                disabled={isLoading}
                maxLength={2000}
              />
              {inputMessage.length > 1800 && (
                <p className="text-xs text-gray-500 mt-1">
                  {inputMessage.length}/2000 characters
                </p>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="
                px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                flex items-center justify-center
                min-w-[44px] h-[44px]
              "
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          
          {/* Input hints */}
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </>
  );
};