import React from 'react';
import { ChatbotTrigger, ChatbotTriggerVariant } from './ChatbotTrigger';
import { ChatbotPanel } from './ChatbotPanel';
import { ChatContext } from '../../types';

interface ChatbotSystemProps {
  triggerVariant?: ChatbotTriggerVariant;
  triggerProps?: {
    context?: ChatContext;
    className?: string;
    disabled?: boolean;
    label?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  };
  panelProps?: {
    className?: string;
  };
}

/**
 * Complete chatbot system that includes both trigger and panel
 * This is the main component to use when you want a full chatbot integration
 */
export const ChatbotSystem: React.FC<ChatbotSystemProps> = ({
  triggerVariant = 'floating',
  triggerProps = {},
  panelProps = {},
}) => {
  return (
    <>
      <ChatbotTrigger
        variant={triggerVariant}
        {...triggerProps}
      />
      <ChatbotPanel {...panelProps} />
    </>
  );
};

// Convenience components for common use cases
export const DashboardChatbot: React.FC<{
  className?: string;
}> = ({ className }) => (
  <ChatbotSystem
    triggerVariant="floating"
    triggerProps={{
      context: { type: 'dashboard' },
      position: 'bottom-right',
      size: 'md',
    }}
    panelProps={{ className }}
  />
);

export const DeckEditorChatbot: React.FC<{
  deckId: string;
  deckTitle?: string;
  className?: string;
}> = ({ deckId, deckTitle, className }) => (
  <ChatbotSystem
    triggerVariant="toolbar"
    triggerProps={{
      context: { 
        type: 'deck', 
        deckId, 
        deckTitle 
      },
      showLabel: true,
      label: 'AI Help',
      size: 'md',
    }}
    panelProps={{ className }}
  />
);

export const SlideEditorChatbot: React.FC<{
  deckId: string;
  slideId: string;
  deckTitle?: string;
  slideTitle?: string;
  slideType?: string;
  className?: string;
}> = ({ deckId, slideId, deckTitle, slideTitle, slideType, className }) => (
  <ChatbotSystem
    triggerVariant="inline"
    triggerProps={{
      context: { 
        type: 'slide', 
        deckId, 
        slideId, 
        deckTitle, 
        slideTitle, 
        slideType 
      },
      showLabel: true,
      label: 'Get AI Help',
      size: 'sm',
    }}
    panelProps={{ className }}
  />
);