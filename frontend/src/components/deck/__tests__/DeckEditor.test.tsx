import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeckEditor } from '../DeckEditor';
import { apiClient } from '../../../services/apiClient';

// Mock the API client
jest.mock('../../../services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock child components
jest.mock('../SlideList', () => ({
  SlideList: ({ onSlideAdd, onSlideDuplicate, onSlideDelete }: any) => (
    <div data-testid="slide-list">
      <button onClick={onSlideAdd}>Add Slide</button>
      <button onClick={() => onSlideDuplicate('slide-1')}>Duplicate Slide</button>
      <button onClick={() => onSlideDelete('slide-1')}>Delete Slide</button>
    </div>
  )
}));

jest.mock('../SlideEditor', () => ({
  SlideEditor: () => <div data-testid="slide-editor">Slide Editor</div>
}));

jest.mock('../SlidePreview', () => ({
  SlidePreview: () => <div data-testid="slide-preview">Slide Preview</div>
}));

describe('DeckEditor', () => {
  const mockDeck = {
    id: 'deck-123',
    user_id: 'user-456',
    projectId: 'project-789',
    title: 'Test Deck',
    description: 'Test deck description',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockSlides = [
    {
      id: 'slide-1',
      pitch_deck_id: 'deck-123',
      type: 'cover',
      title: 'Cover Slide',
      content: 'Cover content',
      slide_order: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'slide-2',
      pitch_deck_id: 'deck-123',
      type: 'problem',
      title: 'Problem Slide',
      content: 'Problem content',
      slide_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockApiService.getDeck.mockResolvedValue({
      success: true,
      data: mockDeck
    });
    
    mockApiService.getDeckSlides.mockResolvedValue({
      success: true,
      data: mockSlides
    });
  });

  it('loads deck and slides on mount', async () => {
    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(mockApiService.getDeck).toHaveBeenCalledWith('deck-123');
      expect(mockApiService.getDeckSlides).toHaveBeenCalledWith('deck-123');
    });

    expect(screen.getByText('Test Deck')).toBeInTheDocument();
    expect(screen.getByText('2 slides')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    expect(screen.getByText('Loading deck...')).toBeInTheDocument();
  });

  it('shows error state when loading fails', async () => {
    mockApiService.getDeck.mockRejectedValue(new Error('Failed to load deck'));

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByText('Error loading deck')).toBeInTheDocument();
      expect(screen.getByText('Failed to load deck')).toBeInTheDocument();
    });
  });

  it('handles slide addition', async () => {
    const newSlide = {
      id: 'slide-3',
      pitch_deck_id: 'deck-123',
      type: 'custom',
      title: 'New Slide',
      content: 'Add your content here...',
      slide_order: 2,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    };

    mockApiService.createSlide.mockResolvedValue({
      success: true,
      data: newSlide,
      message: 'Slide created successfully'
    });

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByTestId('slide-list')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Slide');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockApiService.createSlide).toHaveBeenCalledWith('deck-123', {
        type: 'custom',
        title: 'New Slide',
        content: 'Add your content here...'
      });
    });
  });

  it('handles slide duplication', async () => {
    const duplicatedSlide = {
      id: 'slide-3',
      pitch_deck_id: 'deck-123',
      type: 'cover',
      title: 'Cover Slide (Copy)',
      content: 'Cover content',
      slide_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    };

    mockApiService.duplicateSlide.mockResolvedValue({
      success: true,
      data: duplicatedSlide,
      message: 'Slide duplicated successfully'
    });

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByTestId('slide-list')).toBeInTheDocument();
    });

    const duplicateButton = screen.getByText('Duplicate Slide');
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(mockApiService.duplicateSlide).toHaveBeenCalledWith('slide-1');
    });
  });

  it('handles slide deletion', async () => {
    mockApiService.deleteSlide.mockResolvedValue({
      success: true,
      message: 'Slide deleted successfully'
    });

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByTestId('slide-list')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete Slide');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockApiService.deleteSlide).toHaveBeenCalledWith('slide-1');
    });
  });

  it('switches between edit and preview modes', async () => {
    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByTestId('slide-editor')).toBeInTheDocument();
    });

    const previewButton = screen.getByRole('button', { name: 'Preview' });
    fireEvent.click(previewButton);

    expect(screen.getByTestId('slide-preview')).toBeInTheDocument();
    expect(screen.queryByTestId('slide-editor')).not.toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    expect(screen.getByTestId('slide-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('slide-preview')).not.toBeInTheDocument();
  });

  it('shows saving indicator when operations are in progress', async () => {
    // Mock a slow API response
    mockApiService.createSlide.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: mockSlides[0],
        message: 'Slide created'
      }), 100))
    );

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByTestId('slide-list')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Slide');
    fireEvent.click(addButton);

    // Should show saving indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('All changes saved')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApiService.createSlide.mockRejectedValue(new Error('Failed to create slide'));

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByTestId('slide-list')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Slide');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockApiService.createSlide).toHaveBeenCalled();
      // Error handling would be visible in the UI (not tested here due to mocked components)
    });
  });

  it('retries loading when try again button is clicked', async () => {
    mockApiService.getDeck.mockRejectedValueOnce(new Error('Failed to load deck'));
    mockApiService.getDeck.mockResolvedValueOnce({
      success: true,
      data: mockDeck
    });

    render(<DeckEditor deckId="deck-123" projectId="project-789" />);

    await waitFor(() => {
      expect(screen.getByText('Error loading deck')).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText('Test Deck')).toBeInTheDocument();
    });

    expect(mockApiService.getDeck).toHaveBeenCalledTimes(2);
  });
});