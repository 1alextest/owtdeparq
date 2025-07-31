import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatbotProvider } from '../../../contexts/ChatbotContext';
import { 
  ChatbotTrigger, 
  FloatingChatbotTrigger, 
  ToolbarChatbotTrigger, 
  InlineChatbotTrigger 
} from '../ChatbotTrigger';
import { ChatContext } from '../../../types';

// Mock the entire chatbot service module
jest.mock('../../../services/chatbotService', () => ({
  chatbotService: {
    sendMessage: jest.fn(),
    improveSpeakerNotes: jest.fn(),
    getQuickActions: jest.fn(),
    validateMessage: jest.fn(),
    validateContext: jest.fn(),
    createChatMessage: jest.fn(),
    getUserFriendlyErrorMessage: jest.fn(),
  },
}));

// Mock Firebase config to avoid initialization issues
jest.mock('../../../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ChatbotProvider>
      {component}
    </ChatbotProvider>
  );
};

describe('ChatbotTrigger', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      renderWithProvider(<ChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('opens chatbot when clicked', () => {
      renderWithProvider(<ChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      act(() => {
        fireEvent.click(button);
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('handles keyboard navigation (Enter key)', () => {
      renderWithProvider(<ChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      act(() => {
        fireEvent.keyDown(button, { key: 'Enter' });
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('handles keyboard navigation (Space key)', () => {
      renderWithProvider(<ChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      act(() => {
        fireEvent.keyDown(button, { key: ' ' });
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('ignores other keyboard keys', () => {
      renderWithProvider(<ChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      act(() => {
        fireEvent.keyDown(button, { key: 'Tab' });
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Variants', () => {
    it('renders floating variant with correct classes', () => {
      renderWithProvider(<ChatbotTrigger variant="floating" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('fixed', 'z-50', 'bg-blue-600', 'bottom-6', 'right-6');
    });

    it('renders toolbar variant with correct classes', () => {
      renderWithProvider(<ChatbotTrigger variant="toolbar" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('bg-blue-600', 'text-white');
      expect(button).not.toHaveClass('fixed');
    });

    it('renders inline variant with correct classes', () => {
      renderWithProvider(<ChatbotTrigger variant="inline" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('bg-white', 'text-blue-600', 'border-blue-600');
      expect(button).not.toHaveClass('fixed');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      renderWithProvider(<ChatbotTrigger size="sm" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('w-10', 'h-10');
    });

    it('renders medium size correctly (default)', () => {
      renderWithProvider(<ChatbotTrigger size="md" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('w-12', 'h-12');
    });

    it('renders large size correctly', () => {
      renderWithProvider(<ChatbotTrigger size="lg" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('w-14', 'h-14');
    });
  });

  describe('Positions (Floating variant)', () => {
    it('renders in bottom-right position by default', () => {
      renderWithProvider(<ChatbotTrigger variant="floating" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('bottom-6', 'right-6');
    });

    it('renders in bottom-left position', () => {
      renderWithProvider(<ChatbotTrigger variant="floating" position="bottom-left" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('bottom-6', 'left-6');
    });

    it('renders in top-right position', () => {
      renderWithProvider(<ChatbotTrigger variant="floating" position="top-right" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('top-6', 'right-6');
    });

    it('renders in top-left position', () => {
      renderWithProvider(<ChatbotTrigger variant="floating" position="top-left" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('top-6', 'left-6');
    });
  });

  describe('Labels and Accessibility', () => {
    it('shows label when showLabel is true', () => {
      renderWithProvider(<ChatbotTrigger showLabel={true} label="Custom Label" />);
      
      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('uses custom label text', () => {
      renderWithProvider(<ChatbotTrigger label="Custom AI Helper" />);
      
      const button = screen.getByRole('button', { name: 'Custom AI Helper' });
      expect(button).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      renderWithProvider(<ChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveAttribute('aria-label', 'AI Assistant');
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('title', 'AI Assistant');
    });

    it('removes aria-label and title when label is shown', () => {
      renderWithProvider(<ChatbotTrigger showLabel={true} label="Visible Label" />);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-label');
      expect(button).not.toHaveAttribute('title');
    });
  });

  describe('Disabled State', () => {
    it('renders disabled state correctly', () => {
      renderWithProvider(<ChatbotTrigger disabled={true} />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('does not open chatbot when disabled and clicked', () => {
      renderWithProvider(<ChatbotTrigger disabled={true} />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      act(() => {
        fireEvent.click(button);
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('does not open chatbot when disabled and Enter is pressed', () => {
      renderWithProvider(<ChatbotTrigger disabled={true} />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      act(() => {
        fireEvent.keyDown(button, { key: 'Enter' });
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Context Passing', () => {
    it('passes context to chatbot when provided', () => {
      const testContext: ChatContext = {
        type: 'deck',
        deckId: 'test-deck-123',
        deckTitle: 'Test Deck',
      };

      renderWithProvider(<ChatbotTrigger context={testContext} />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      // Click to open chatbot - context should be passed internally
      act(() => {
        fireEvent.click(button);
      });
      
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      renderWithProvider(<ChatbotTrigger className="custom-class" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('custom-class');
    });

    it('maintains base classes with custom className', () => {
      renderWithProvider(<ChatbotTrigger className="custom-class" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('custom-class', 'inline-flex', 'items-center', 'justify-center');
    });
  });

  describe('Convenience Components', () => {
    it('FloatingChatbotTrigger renders as floating variant', () => {
      renderWithProvider(<FloatingChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('fixed', 'z-50');
    });

    it('ToolbarChatbotTrigger renders as toolbar variant', () => {
      renderWithProvider(<ToolbarChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('bg-blue-600');
      expect(button).not.toHaveClass('fixed');
    });

    it('InlineChatbotTrigger renders as inline variant', () => {
      renderWithProvider(<InlineChatbotTrigger />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      expect(button).toHaveClass('bg-white', 'text-blue-600');
      expect(button).not.toHaveClass('fixed');
    });
  });

  describe('Visual States', () => {
    it('shows pulse indicator when chatbot is open (floating variant only)', () => {
      renderWithProvider(<ChatbotTrigger variant="floating" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      // Open chatbot
      act(() => {
        fireEvent.click(button);
      });
      
      // Check for pulse indicator (green dot)
      const pulseIndicator = button.querySelector('.bg-green-400');
      expect(pulseIndicator).toBeInTheDocument();
    });

    it('does not show pulse indicator for non-floating variants', () => {
      renderWithProvider(<ChatbotTrigger variant="toolbar" />);
      
      const button = screen.getByRole('button', { name: 'AI Assistant' });
      
      // Open chatbot
      act(() => {
        fireEvent.click(button);
      });
      
      // Should not have pulse indicator
      const pulseIndicator = button.querySelector('.bg-green-400');
      expect(pulseIndicator).not.toBeInTheDocument();
    });
  });
});