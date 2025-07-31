import React from 'react';
import { ChatMessage as ChatMessageType, MessageAction } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick?: (action: MessageAction) => void;
  onRetryClick?: () => void;
  isLoading?: boolean;
}

// Lightweight markdown parser for AI responses
const parseMarkdown = (text: string): string => {
  let html = text;

  // Headers: # Header, ## Header, ### Header (do this before line breaks)
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

  // Code blocks: ```code``` (do this before inline code)
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>');

  // Code inline: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

  // Bold text: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic text: *text* or _text_ (avoid conflicts with bold)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes: > text
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2">$1</blockquote>');

  // Lists: - item or * item
  const listItems = html.match(/^[\s]*[-*]\s+(.+)$/gm);
  if (listItems) {
    const listContent = listItems.map(item => 
      item.replace(/^[\s]*[-*]\s+(.+)$/, '<li class="ml-4">$1</li>')
    ).join('');
    html = html.replace(/^[\s]*[-*]\s+(.+)$/gm, '');
    html = html.replace(/\n\n/g, `\n<ul class="list-disc list-inside space-y-1 my-2">${listContent}</ul>\n`);
  }

  // Numbered lists: 1. item
  const numberedItems = html.match(/^[\s]*\d+\.\s+(.+)$/gm);
  if (numberedItems) {
    const listContent = numberedItems.map(item => 
      item.replace(/^[\s]*\d+\.\s+(.+)$/, '<li class="ml-4">$1</li>')
    ).join('');
    html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '');
    html = html.replace(/\n\n/g, `\n<ol class="list-decimal list-inside space-y-1 my-2">${listContent}</ol>\n`);
  }

  // Convert line breaks to <br> tags (do this last)
  html = html.replace(/\n/g, '<br>');

  return html;
};

// Message status indicator component
const MessageStatus: React.FC<{
  role: 'user' | 'assistant';
  timestamp: Date | string | null | undefined;
  isLoading?: boolean;
}> = ({ role, timestamp, isLoading }) => {
  const formatTime = (date: Date | string | null | undefined) => {
    try {
      // Handle null, undefined, or empty values
      if (!date) {
        return 'Now';
      }

      // Ensure we have a proper Date object
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided to formatTime:', date);
        return 'Now';
      }

      return dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting time:', error, 'Date value:', date);
      return 'Now';
    }
  };

  if (isLoading && role === 'assistant') {
    return (
      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span>Typing...</span>
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500 mt-1 opacity-70">
      {formatTime(timestamp)}
      {role === 'assistant' && (
        <span className="ml-2">
          <svg className="inline w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </div>
  );
};

// Loading message component for pending AI responses
export const LoadingMessage: React.FC = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs lg:max-w-sm">
        <div className="bg-gray-100 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-600">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main ChatMessage component
export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onActionClick,
  onRetryClick,
  isLoading = false 
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Message bubble styling
  const bubbleClasses = `
    max-w-xs lg:max-w-sm px-4 py-2 rounded-lg break-words
    ${isUser 
      ? 'bg-blue-600 text-white ml-auto' 
      : 'bg-gray-100 text-gray-900'
    }
  `;

  // Container styling
  const containerClasses = `
    flex mb-4
    ${isUser ? 'justify-end' : 'justify-start'}
  `;

  return (
    <div className={containerClasses}>
      <div className="max-w-xs lg:max-w-sm">
        {/* Assistant avatar for AI messages */}
        {isAssistant && (
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm" role="img" aria-label="AI Assistant">
                🤖
              </span>
            </div>
            <div className="flex-1">
              <div className={bubbleClasses}>
                {/* Render markdown content for assistant messages */}
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: parseMarkdown(message.content) 
                  }}
                />
                <MessageStatus 
                  role={message.role} 
                  timestamp={message.timestamp} 
                  isLoading={isLoading}
                />
              </div>
              
              {/* Message suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="
                        block w-full text-left text-xs text-blue-600 
                        hover:text-blue-800 hover:bg-blue-50 
                        px-2 py-1 rounded border border-blue-200
                        transition-colors duration-200
                      "
                      onClick={() => {
                        // This would trigger sending the suggestion as a new message
                        console.log('Suggestion clicked:', suggestion);
                      }}
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Message actions */}
              {message.actions && message.actions.length > 0 && onActionClick && (
                <div className="mt-2 space-y-1">
                  {message.actions.map((action) => (
                    <button
                      key={action.id}
                      className="
                        block w-full text-left text-xs text-green-600 
                        hover:text-green-800 hover:bg-green-50 
                        px-2 py-1 rounded border border-green-200
                        transition-colors duration-200
                      "
                      onClick={() => onActionClick(action)}
                    >
                      ⚡ {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Retry button for failed messages */}
              {onRetryClick && (
                <div className="mt-2">
                  <button
                    className="
                      text-xs text-gray-500 hover:text-gray-700 
                      hover:bg-gray-50 px-2 py-1 rounded
                      transition-colors duration-200
                      flex items-center space-x-1
                    "
                    onClick={onRetryClick}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Regenerate response</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User message (simpler layout) */}
        {isUser && (
          <div className={bubbleClasses}>
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
            <MessageStatus 
              role={message.role} 
              timestamp={message.timestamp} 
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Message list component for displaying multiple messages
export const MessageList: React.FC<{
  messages: ChatMessageType[];
  isLoading?: boolean;
  onActionClick?: (action: MessageAction) => void;
  onRetryClick?: () => void;
}> = ({ messages, isLoading = false, onActionClick, onRetryClick }) => {
  return (
    <div className="space-y-0">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          onActionClick={onActionClick}
          onRetryClick={index === messages.length - 1 ? onRetryClick : undefined} // Only show retry on last message
        />
      ))}
      {isLoading && <LoadingMessage />}
    </div>
  );
};