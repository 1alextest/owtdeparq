import React from 'react';
import { useChatbot } from '../../contexts/ChatbotContext';
import { ChatContext } from '../../types';

export type ChatbotTriggerVariant = 'floating' | 'toolbar' | 'inline';

interface ChatbotTriggerProps {
  variant?: ChatbotTriggerVariant;
  context?: ChatContext;
  className?: string;
  disabled?: boolean;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ChatbotTrigger: React.FC<ChatbotTriggerProps> = ({
  variant = 'floating',
  context,
  className = '',
  disabled = false,
  label = 'AI Assistant',
  showLabel = false,
  size = 'md',
  position = 'bottom-right',
}) => {
  const { isOpen, openChatbot } = useChatbot();

  const handleClick = () => {
    if (disabled) return;
    openChatbot(context);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-xs',
      padding: 'px-2 py-1',
    },
    md: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm',
      padding: 'px-3 py-2',
    },
    lg: {
      button: 'w-14 h-14',
      icon: 'w-7 h-7',
      text: 'text-base',
      padding: 'px-4 py-2',
    },
  };

  // Position classes for floating variant
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Base button classes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-full
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${disabled ? '' : 'hover:scale-105 active:scale-95'}
  `.trim();

  // Variant-specific styling
  const variantClasses = {
    floating: `
      fixed z-50 shadow-lg
      bg-blue-600 text-white
      hover:bg-blue-700 hover:shadow-xl
      ${positionClasses[position]}
      ${sizeClasses[size].button}
    `.trim(),
    
    toolbar: `
      bg-blue-600 text-white
      hover:bg-blue-700
      ${showLabel ? sizeClasses[size].padding : sizeClasses[size].button}
    `.trim(),
    
    inline: `
      bg-white text-blue-600 border border-blue-600
      hover:bg-blue-50
      ${showLabel ? sizeClasses[size].padding : sizeClasses[size].button}
    `.trim(),
  };

  // AI Assistant Icon (chat bubble with sparkles)
  const ChatbotIcon = () => (
    <svg
      className={sizeClasses[size].icon}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
      {/* Sparkle effect for AI indication */}
      <circle cx="18" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="6" cy="18" r="1" fill="currentColor" opacity="0.6" />
    </svg>
  );

  // Pulsing indicator when chatbot is active
  const PulseIndicator = () => (
    <div className="absolute -top-1 -right-1">
      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
    </div>
  );

  const buttonContent = (
    <>
      <ChatbotIcon />
      {showLabel && (
        <span className={`ml-2 ${sizeClasses[size].text}`}>
          {label}
        </span>
      )}
      {isOpen && variant === 'floating' && <PulseIndicator />}
    </>
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={showLabel ? undefined : label}
      aria-pressed={isOpen}
      title={showLabel ? undefined : label}
    >
      {buttonContent}
    </button>
  );
};

// Convenience components for specific variants
export const FloatingChatbotTrigger: React.FC<Omit<ChatbotTriggerProps, 'variant'>> = (props) => (
  <ChatbotTrigger {...props} variant="floating" />
);

export const ToolbarChatbotTrigger: React.FC<Omit<ChatbotTriggerProps, 'variant'>> = (props) => (
  <ChatbotTrigger {...props} variant="toolbar" />
);

export const InlineChatbotTrigger: React.FC<Omit<ChatbotTriggerProps, 'variant'>> = (props) => (
  <ChatbotTrigger {...props} variant="inline" />
);