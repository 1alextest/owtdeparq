import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { ChatMessage, ChatContext, QuickAction, MessageAction } from '../types';
import { chatbotService } from '../services/chatbotService';

interface ChatbotState {
  isOpen: boolean;
  currentContext: ChatContext;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  quickActions: QuickAction[];
}

interface ChatbotContextType extends ChatbotState {
  openChatbot: (context?: ChatContext) => void;
  closeChatbot: () => void;
  sendMessage: (message: string) => Promise<void>;
  updateContext: (context: ChatContext) => void;
  clearError: () => void;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  executeAction: (action: MessageAction) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

interface ChatbotProviderProps {
  children: ReactNode;
}

// Session storage keys
const STORAGE_KEYS = {
  MESSAGES: 'chatbot_messages',
  CONTEXT: 'chatbot_context',
} as const;

// Default context for dashboard
const DEFAULT_CONTEXT: ChatContext = {
  type: 'dashboard',
};

// Quick actions based on context
const getQuickActionsForContext = (context: ChatContext): QuickAction[] => {
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

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const [state, setState] = useState<ChatbotState>(() => {
    // Initialize state from session storage
    const savedMessages = sessionStorage.getItem(STORAGE_KEYS.MESSAGES);
    const savedContext = sessionStorage.getItem(STORAGE_KEYS.CONTEXT);
    
    const initialContext = savedContext ? JSON.parse(savedContext) : DEFAULT_CONTEXT;
    
    return {
      isOpen: false,
      currentContext: initialContext,
      messages: savedMessages ? JSON.parse(savedMessages) : [],
      isLoading: false,
      error: null,
      quickActions: getQuickActionsForContext(initialContext),
    };
  });

  // Save messages to session storage whenever they change
  useEffect(() => {
    if (state.messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(state.messages));
    }
  }, [state.messages]);

  // Save context to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(state.currentContext));
  }, [state.currentContext]);

  // Update quick actions when context changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      quickActions: getQuickActionsForContext(state.currentContext),
    }));
  }, [state.currentContext]);

  // Clear conversation history on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const openChatbot = useCallback((context?: ChatContext) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      currentContext: context || prev.currentContext,
      error: null,
    }));
  }, []);

  const closeChatbot = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      error: null,
    }));
  }, []);

  const updateContext = useCallback((context: ChatContext) => {
    setState(prev => {
      // Only update if context has actually changed
      if (JSON.stringify(prev.currentContext) === JSON.stringify(context)) {
        return prev;
      }

      return {
        ...prev,
        currentContext: context,
        // Clear messages when switching to a different deck/slide
        messages: (prev.currentContext.deckId !== context.deckId || 
                  prev.currentContext.slideId !== context.slideId) ? [] : prev.messages,
      };
    });
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await chatbotService.sendMessage(message.trim(), state.currentContext);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [state.currentContext]);

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...state.messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      // Remove the last assistant message if it exists and there was an error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => 
          !(msg.role === 'assistant' && msg.timestamp > lastUserMessage.timestamp)
        ),
      }));
      
      await sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);

  const executeAction = useCallback((action: MessageAction) => {
    // This will be implemented when we create the action handling logic
    // For now, just log the action
    console.log('Executing action:', action);
    
    // TODO: Implement action execution based on action type
    switch (action.type) {
      case 'apply_text':
        // Apply text to slide fields
        break;
      case 'improve_notes':
        // Trigger speaker notes improvement
        break;
      case 'regenerate_slide':
        // Regenerate slide content
        break;
      case 'navigate':
        // Navigate to different slide/deck
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
    sessionStorage.removeItem(STORAGE_KEYS.MESSAGES);
  }, []);

  const value: ChatbotContextType = {
    ...state,
    openChatbot,
    closeChatbot,
    sendMessage,
    updateContext,
    clearError,
    clearMessages,
    retryLastMessage,
    executeAction,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};