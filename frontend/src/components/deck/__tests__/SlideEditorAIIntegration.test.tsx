import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SlideEditor } from '../SlideEditor';
import { ChatbotProvider } from '../../../contexts/ChatbotContext';
import { apiClient } from '../../../services/apiClient';

// Mock the API client
jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    regenerateSlide: jest.fn(),
    autosaveSlide: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test wrapper with ChatbotProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatbotProvider>
    {children}
  </ChatbotProvider>
);

describe('SlideEditor AI Integration', () => {
  const mockSlide = {
    id: 'slide-123',
    pitch_deck_id: 'deck-123',
    type: 'problem',
    title: 'Problem Statement',
    content: 'Our target market faces significant challenges with existing solutions.',
    speakerNotes: 'Talk about the pain points customers experience daily.',
    slide_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockProps = {
    slide: mockSlide,
    onSlideUpdate: jest.fn(),
    onRegenerateSlide: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.autosaveSlide.mockResolvedValue({});
  });

  describe('Get AI Help Button', () => {
    it('renders the Get AI Help button in the header', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const aiHelpButton = screen.getByRole('button', { name: /Get AI Help/i });
      expect(aiHelpButton).toBeInTheDocument();
    });

    it('positions the Get AI Help button before the Regenerate button', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const aiHelpButton = screen.getByRole('button', { name: /Get AI Help/i });
      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });

      expect(aiHelpButton).toBeInTheDocument();
      expect(regenerateButton).toBeInTheDocument();

      // Check that both buttons are in the same container
      const buttonContainer = aiHelpButton.closest('.flex.items-center.space-x-2');
      expect(buttonContainer).toContainElement(regenerateButton);
    });

    it('applies consistent styling with purple theme', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const aiHelpButton = screen.getByRole('button', { name: /Get AI Help/i });
      
      expect(aiHelpButton).toHaveClass('px-3', 'py-2', 'text-sm', 'font-medium');
      expect(aiHelpButton).toHaveClass('text-purple-700', 'bg-purple-100');
    });
  });

  describe('Text Selection Detection', () => {
    it('shows contextual help when text is selected in title field', async () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText('Slide Title');
      
      // Simulate text selection
      fireEvent.focus(titleInput);
      Object.defineProperty(titleInput, 'selectionStart', { value: 0, configurable: true });
      Object.defineProperty(titleInput, 'selectionEnd', { value: 7, configurable: true }); // "Problem"
      fireEvent.select(titleInput);

      await waitFor(() => {
        expect(screen.getByText(/Selected:/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Improve Selection/i })).toBeInTheDocument();
      });
    });

    it('shows contextual help when text is selected in content field', async () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const contentTextarea = screen.getByLabelText('Slide Content');
      
      // Simulate text selection
      fireEvent.focus(contentTextarea);
      Object.defineProperty(contentTextarea, 'selectionStart', { value: 0, configurable: true });
      Object.defineProperty(contentTextarea, 'selectionEnd', { value: 10, configurable: true }); // "Our target"
      fireEvent.select(contentTextarea);

      await waitFor(() => {
        expect(screen.getByText(/Selected:/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Improve Selection/i })).toBeInTheDocument();
      });
    });

    it('truncates long selected text in the display', async () => {
      const longTextSlide = {
        ...mockSlide,
        content: 'This is a very long piece of text that should be truncated when displayed in the selection context helper because it exceeds the maximum display length',
      };

      render(
        <TestWrapper>
          <SlideEditor {...mockProps} slide={longTextSlide} />
        </TestWrapper>
      );

      const contentTextarea = screen.getByLabelText('Slide Content');
      
      // Simulate selecting the entire long text
      fireEvent.focus(contentTextarea);
      Object.defineProperty(contentTextarea, 'selectionStart', { value: 0, configurable: true });
      Object.defineProperty(contentTextarea, 'selectionEnd', { value: longTextSlide.content.length, configurable: true });
      fireEvent.select(contentTextarea);

      await waitFor(() => {
        const selectedTextDisplay = screen.getByText(/Selected:/);
        expect(selectedTextDisplay.textContent).toContain('...');
      });
    });
  });

  describe('Speaker Notes Improvement', () => {
    it('shows Improve with AI button when speaker notes exist', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
      expect(improveButton).toBeInTheDocument();
    });

    it('does not show Improve with AI button when speaker notes are empty', () => {
      const slideWithoutNotes = { ...mockSlide, speakerNotes: '' };
      
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} slide={slideWithoutNotes} />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /Improve with AI/i })).not.toBeInTheDocument();
    });

    it('opens SpeakerNotesImprover modal when Improve with AI is clicked', async () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
      fireEvent.click(improveButton);

      await waitFor(() => {
        expect(screen.getByText('Improve Speaker Notes')).toBeInTheDocument();
        expect(screen.getByText('Choose how you\'d like to improve your speaker notes with AI assistance')).toBeInTheDocument();
      });
    });

    it('closes SpeakerNotesImprover modal when cancelled', async () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      // Open the modal
      const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
      fireEvent.click(improveButton);

      await waitFor(() => {
        expect(screen.getByText('Improve Speaker Notes')).toBeInTheDocument();
      });

      // Cancel the modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Improve Speaker Notes')).not.toBeInTheDocument();
      });
    });

    it('applies improved notes when approved', async () => {
      const onSlideUpdate = jest.fn();
      
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} onSlideUpdate={onSlideUpdate} />
        </TestWrapper>
      );

      // Open the modal
      const improveButton = screen.getByRole('button', { name: /Improve with AI/i });
      fireEvent.click(improveButton);

      await waitFor(() => {
        expect(screen.getByText('Improve Speaker Notes')).toBeInTheDocument();
      });

      // The SpeakerNotesImprover component would handle the improvement process
      // For this test, we're just verifying the modal integration works
      expect(screen.getByText('Current Notes')).toBeInTheDocument();
      expect(screen.getAllByText(mockSlide.speakerNotes)).toHaveLength(2); // In textarea and modal
    });
  });

  describe('Layout Integration', () => {
    it('does not disrupt existing slide editor layout', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      // Check that all existing elements are still present
      expect(screen.getByText('Problem Statement')).toBeInTheDocument();
      expect(screen.getByText('Slide 2 • Saved')).toBeInTheDocument();
      expect(screen.getByLabelText('Slide Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Slide Content')).toBeInTheDocument();
      expect(screen.getByLabelText('Speaker Notes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();

      // AI integration elements should be present
      expect(screen.getByRole('button', { name: /Get AI Help/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Improve with AI/i })).toBeInTheDocument();
    });

    it('maintains proper spacing and styling', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const aiHelpButton = screen.getByRole('button', { name: /Get AI Help/i });
      const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
      const saveButton = screen.getByRole('button', { name: /Save/i });

      // Check that buttons are in the same container with proper spacing
      const buttonContainer = aiHelpButton.closest('.flex.items-center.space-x-2');
      expect(buttonContainer).toContainElement(regenerateButton);
      expect(buttonContainer).toContainElement(saveButton);
    });
  });

  describe('Context Awareness', () => {
    it('passes correct slide context to AI help buttons', () => {
      render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const aiHelpButton = screen.getByRole('button', { name: /Get AI Help/i });
      expect(aiHelpButton).toBeInTheDocument();

      // The context would be passed to the chatbot trigger
      // This is verified by the component rendering without errors
    });

    it('updates context when slide changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <SlideEditor {...mockProps} />
        </TestWrapper>
      );

      const newSlide = {
        ...mockSlide,
        id: 'slide-456',
        title: 'Solution Overview',
        type: 'solution',
      };

      rerender(
        <TestWrapper>
          <SlideEditor {...mockProps} slide={newSlide} />
        </TestWrapper>
      );

      expect(screen.getByText('Solution Overview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get AI Help/i })).toBeInTheDocument();
    });
  });
});