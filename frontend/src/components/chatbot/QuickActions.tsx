import React from 'react';
import { QuickAction, ChatContext } from '../../types';

interface QuickActionsProps {
  actions: QuickAction[];
  context: ChatContext;
  onActionClick: (action: QuickAction) => void;
  disabled?: boolean;
  className?: string;
  maxActions?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  context,
  onActionClick,
  disabled = false,
  className = '',
  maxActions = 6,
}) => {
  // Filter actions that are relevant to the current context
  const relevantActions = actions.filter(action => 
    action.context.includes(context.type)
  ).slice(0, maxActions);

  if (relevantActions.length === 0) {
    return null;
  }

  const handleActionClick = (action: QuickAction) => {
    if (disabled) return;
    onActionClick(action);
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: QuickAction) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActionClick(action);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Quick Actions
      </h4>
      
      <div className="space-y-2">
        {relevantActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            onKeyDown={(e) => handleKeyDown(e, action)}
            disabled={disabled}
            className={`
              w-full text-left p-3 rounded-lg border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${disabled 
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:bg-gray-100'
              }
            `}
            aria-label={`Quick action: ${action.label}`}
            title={action.prompt}
          >
            <div className="flex items-center">
              <span 
                className="text-lg mr-3 flex-shrink-0" 
                role="img" 
                aria-hidden="true"
              >
                {action.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block truncate">
                  {action.label}
                </span>
                <span className="text-xs text-gray-500 block truncate mt-1">
                  {action.prompt.length > 60 
                    ? `${action.prompt.substring(0, 60)}...` 
                    : action.prompt
                  }
                </span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Compact version for smaller spaces
export const CompactQuickActions: React.FC<QuickActionsProps> = ({
  actions,
  context,
  onActionClick,
  disabled = false,
  className = '',
  maxActions = 3,
}) => {
  const relevantActions = actions.filter(action => 
    action.context.includes(context.type)
  ).slice(0, maxActions);

  if (relevantActions.length === 0) {
    return null;
  }

  const handleActionClick = (action: QuickAction) => {
    if (disabled) return;
    onActionClick(action);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-2">
        Suggestions
      </h4>
      
      <div className="flex flex-wrap gap-2">
        {relevantActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={disabled}
            className={`
              inline-flex items-center px-3 py-2 rounded-full text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200'
              }
            `}
            aria-label={`Quick action: ${action.label}`}
            title={action.prompt}
          >
            <span className="mr-2" role="img" aria-hidden="true">
              {action.icon}
            </span>
            <span className="font-medium">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Context-aware quick actions that automatically get actions from context
export const ContextualQuickActions: React.FC<{
  onActionClick: (action: QuickAction) => void;
  disabled?: boolean;
  className?: string;
  maxActions?: number;
  variant?: 'default' | 'compact';
}> = ({
  onActionClick,
  disabled = false,
  className = '',
  maxActions,
  variant = 'default',
}) => {
  // This would typically get actions from context, but for now we'll use a placeholder
  // In a real implementation, this would use the useChatbot hook to get current context and actions
  const mockActions: QuickAction[] = [
    {
      id: 'help-start',
      label: 'Help me get started',
      icon: '🚀',
      prompt: 'I need help getting started with my pitch deck. Can you guide me?',
      context: ['dashboard'],
    },
    {
      id: 'best-practices',
      label: 'Show best practices',
      icon: '💡',
      prompt: 'What are the best practices for creating an effective pitch deck?',
      context: ['dashboard'],
    },
  ];

  const mockContext: ChatContext = { type: 'dashboard' };

  const QuickActionsComponent = variant === 'compact' ? CompactQuickActions : QuickActions;

  return (
    <QuickActionsComponent
      actions={mockActions}
      context={mockContext}
      onActionClick={onActionClick}
      disabled={disabled}
      className={className}
      maxActions={maxActions}
    />
  );
};

// Hook for getting context-aware quick actions
export const useQuickActions = (context: ChatContext): QuickAction[] => {
  // This would typically integrate with the chatbot context
  // For now, return context-specific actions
  switch (context.type) {
    case 'dashboard':
      return [
        {
          id: 'start-deck',
          label: 'Help me start a pitch deck',
          icon: '🚀',
          prompt: 'I want to create a new pitch deck. Can you guide me through the process and help me understand what makes a compelling investor presentation?',
          context: ['dashboard'],
        },
        {
          id: 'best-practices',
          label: 'Pitch deck best practices',
          icon: '💡',
          prompt: 'What are the key best practices for creating an effective pitch deck that will impress investors?',
          context: ['dashboard'],
        },
        {
          id: 'industry-insights',
          label: 'Industry-specific insights',
          icon: '📊',
          prompt: 'Can you provide insights on what investors look for in pitch decks for my specific industry?',
          context: ['dashboard'],
        },
      ];
    case 'deck':
      return [
        {
          id: 'review-structure',
          label: 'Review deck structure',
          icon: '🔍',
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
          label: 'Add missing slides',
          icon: '➕',
          prompt: 'Are there any important slides missing from my pitch deck that I should consider adding?',
          context: ['deck'],
        },
      ];
    case 'slide':
      return [
        {
          id: 'improve-slide',
          label: 'Improve this slide',
          icon: '✨',
          prompt: 'Can you help me improve the content and structure of this slide?',
          context: ['slide'],
        },
        {
          id: 'make-compelling',
          label: 'Make it more compelling',
          icon: '🎯',
          prompt: 'How can I make this slide more compelling and impactful for investors?',
          context: ['slide'],
        },
        {
          id: 'add-data',
          label: 'Add data points',
          icon: '📈',
          prompt: 'What kind of data points or metrics should I include in this slide to strengthen my argument?',
          context: ['slide'],
        },
      ];
    default:
      return [];
  }
};