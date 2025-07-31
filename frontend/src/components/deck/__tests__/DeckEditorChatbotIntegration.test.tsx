import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DeckEditor } from '../DeckEditor';
import { ChatbotProvider } from '../../../contexts/ChatbotContext';
import { apiClient } from '../../../services/apiClient';

// Mock the API client
jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    getDeck: jest.fn(),
    getDeckSlides: jest.fn(),
    updateSlide: jest.fn(),
    reorderSlides: jest.fn(),
    regenerateSlide: jest.fn(),
    createSlide: jest.fn(),
    duplicateSlide: jest.fn(),
    deleteSlide: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test wrapper with ChatbotProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChatbotProvider>
    {children}
  </ChatbotProvider>
);

describe('DeckEditor Chatbot Integration', () => {
  const mockDeck = {
    id: 'deck-123',
    user_id: 'user-123',
    projectId: 'project-123',
    title: 'Test Pitch Deck',
    description: 'A test deck for chatbot integration',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockSlides = [
    {
      id: 'slide-1',
      pitch_deck_id: 'deck-123',
      type: 'cover',
      title: 'Cover Slide',
      content: 'Welcome to our pitch',
      slide_order: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'slide-2',
      pitch_deck_id: 'deck-123',
      type: 'problem',
      title: 'Problem Statement',
      content: 'The problem we solve',
      slide_order: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.getDeck.mockResolvedValue(mockDeck);
    mockApiClient.getDeckSlides.mockResolvedValue(mockSlides);
  });

  it('renders the AI Assistant button in the toolbar', async () => {
    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    // Wait for the deck to load
    await waitFor(() => {
      expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    });

    // Check if the AI Assistant button is present
    const aiAssistantButton = screen.getByRole('button', { name: /AI Assistant/i });
    expect(aiAssistantButton).toBeInTheDocument();
  });

  it('positions the AI Assistant button next to the Export button', async () => {
    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    });

    const aiAssistantButton = screen.getByRole('button', { name: /AI Assistant/i });
    const exportButton = screen.getByRole('button', { name: /Export/i });

    expect(aiAssistantButton).toBeInTheDocument();
    expect(exportButton).toBeInTheDocument();

    // Check that both buttons are in the same container (header toolbar)
    const toolbar = aiAssistantButton.closest('div');
    expect(toolbar).toContainElement(exportButton);
  });

  it('applies consistent styling with the Export button', async () => {
    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    });

    const aiAssistantButton = screen.getByRole('button', { name: /AI Assistant/i });
    const exportButton = screen.getByRole('button', { name: /Export/i });

    // Check that both buttons have similar styling classes
    expect(aiAssistantButton).toHaveClass('px-4', 'py-2', 'rounded-md', 'transition-colors', 'inline-flex', 'items-center');
    expect(exportButton).toHaveClass('px-4', 'py-2', 'rounded-md', 'transition-colors', 'inline-flex', 'items-center');

    // AI Assistant should have purple styling to differentiate from Export
    expect(aiAssistantButton).toHaveClass('bg-purple-600', 'text-white');
    expect(exportButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('does not disrupt existing deck editor layout', async () => {
    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    });

    // Check that all existing elements are still present
    expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    expect(screen.getByText('2 slides')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();

    // Check that slide list is present (using getAllByText since slides appear in multiple places)
    expect(screen.getAllByText('Cover Slide')).toHaveLength(2); // In slide list and editor
    expect(screen.getAllByText('Problem Statement')).toHaveLength(1); // Only in slide list

    // AI Assistant button should be present without breaking layout
    expect(screen.getByRole('button', { name: /AI Assistant/i })).toBeInTheDocument();
  });

  it('shows the AI Assistant button with proper label', async () => {
    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    });

    const aiAssistantButton = screen.getByRole('button', { name: /AI Assistant/i });
    
    // Check that the button shows the label text
    expect(aiAssistantButton).toHaveTextContent('AI Assistant');
  });

  it('handles loading state without breaking chatbot integration', async () => {
    // Mock delayed API responses
    mockApiClient.getDeck.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockDeck), 100))
    );
    mockApiClient.getDeckSlides.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSlides), 100))
    );

    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    // Should show loading state initially
    expect(screen.getByText('Loading deck...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Pitch Deck')).toBeInTheDocument();
    });

    // AI Assistant button should be present after loading
    expect(screen.getByRole('button', { name: /AI Assistant/i })).toBeInTheDocument();
  });

  it('handles error state gracefully', async () => {
    mockApiClient.getDeck.mockRejectedValue(new Error('Failed to load deck'));

    render(
      <TestWrapper>
        <DeckEditor deckId="deck-123" projectId="project-123" />
      </TestWrapper>
    );

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Error loading deck')).toBeInTheDocument();
    });

    // AI Assistant button should not be present in error state
    expect(screen.queryByRole('button', { name: /AI Assistant/i })).not.toBeInTheDocument();
  });
});