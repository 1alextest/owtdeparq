import { useEffect } from 'react';
import { useChatbot } from '../contexts/ChatbotContext';
import { ChatContext } from '../types';

/**
 * Hook to automatically update chatbot context based on current route and data
 * This helps maintain context awareness as users navigate through the application
 */
export const useChatbotContext = (context: ChatContext) => {
  const { updateContext } = useChatbot();

  useEffect(() => {
    updateContext(context);
  }, [context.type, context.deckId, context.slideId, updateContext]);
};

/**
 * Hook to create dashboard context
 */
export const useDashboardChatbotContext = () => {
  const context: ChatContext = {
    type: 'dashboard',
  };

  useChatbotContext(context);
  return context;
};

/**
 * Hook to create deck context
 */
export const useDeckChatbotContext = (deckId: string, deckTitle?: string) => {
  const context: ChatContext = {
    type: 'deck',
    deckId,
    deckTitle,
  };

  useChatbotContext(context);
  return context;
};

/**
 * Hook to create slide context
 */
export const useSlideChatbotContext = (
  deckId: string,
  slideId: string,
  deckTitle?: string,
  slideTitle?: string,
  slideType?: string
) => {
  const context: ChatContext = {
    type: 'slide',
    deckId,
    slideId,
    deckTitle,
    slideTitle,
    slideType,
  };

  useChatbotContext(context);
  return context;
};