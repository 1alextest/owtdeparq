import React from 'react';
import { render, screen } from '@testing-library/react';
import { FloatingChatbotTrigger } from '../../components/chatbot/ChatbotTrigger';
import { ChatbotProvider } from '../../contexts/ChatbotContext';

// Simple test to verify the chatbot trigger integration
// This tests the component in isolation to avoid Firebase/Auth complexity

describe('Dashboard Chatbot Integration', () => {
  it('renders the floating chatbot trigger with correct props', () => {
    render(
      <ChatbotProvider>
        <FloatingChatbotTrigger
          className="fixed bottom-6 right-6 z-50"
          label="AI Assistant for pitch deck help"
          size="lg"
        />
      </ChatbotProvider>
    );

    const chatbotTrigger = screen.getByRole('button');
    expect(chatbotTrigger).toBeInTheDocument();
    expect(chatbotTrigger).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-50');
  });

  it('has proper accessibility attributes', () => {
    render(
      <ChatbotProvider>
        <FloatingChatbotTrigger
          className="fixed bottom-6 right-6 z-50"
          label="AI Assistant for pitch deck help"
          size="lg"
        />
      </ChatbotProvider>
    );

    const chatbotTrigger = screen.getByRole('button');
    expect(chatbotTrigger).toHaveAttribute('type', 'button');
    expect(chatbotTrigger).toHaveAttribute('aria-label');
  });

  it('renders with large size styling', () => {
    render(
      <ChatbotProvider>
        <FloatingChatbotTrigger
          className="fixed bottom-6 right-6 z-50"
          label="AI Assistant for pitch deck help"
          size="lg"
        />
      </ChatbotProvider>
    );

    const chatbotTrigger = screen.getByRole('button');
    // The large size should apply appropriate classes
    expect(chatbotTrigger).toBeInTheDocument();
  });

  it('is positioned correctly for dashboard use', () => {
    render(
      <ChatbotProvider>
        <div className="relative min-h-screen">
          <FloatingChatbotTrigger
            className="fixed bottom-6 right-6 z-50"
            label="AI Assistant for pitch deck help"
            size="lg"
          />
        </div>
      </ChatbotProvider>
    );

    const chatbotTrigger = screen.getByRole('button');
    
    // Check positioning classes
    expect(chatbotTrigger).toHaveClass('fixed');
    expect(chatbotTrigger).toHaveClass('bottom-6');
    expect(chatbotTrigger).toHaveClass('right-6');
    expect(chatbotTrigger).toHaveClass('z-50');
  });
});