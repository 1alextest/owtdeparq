import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SlideEditor } from '../SlideEditor';
import { apiClient } from '../../../services/apiClient';

// Mock the API client
jest.mock('../../../services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('SlideEditor', () => {
  const mockSlide = {
    id: 'slide-123',
    pitch_deck_id: 'deck-456',
    type: 'problem',
    title: 'Test Problem',
    content: 'This is a test problem slide content',
    slide_order: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockOnSlideUpdate = jest.fn();
  const mockOnRegenerateSlide = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders slide editor with slide data', () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    expect(screen.getByDisplayValue('Test Problem')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test problem slide content')).toBeInTheDocument();
    expect(screen.getByText('Problem Statement')).toBeInTheDocument();
  });

  it('shows unsaved changes when content is modified', () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Problem');
    fireEvent.change(titleInput, { target: { value: 'Modified Problem' } });

    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
  });

  it('auto-saves changes after delay', async () => {
    mockApiService.autosaveSlide.mockResolvedValue({
      success: true,
      timestamp: '2025-01-01T00:01:00Z'
    });

    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Problem');
    fireEvent.change(titleInput, { target: { value: 'Modified Problem' } });

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockApiService.autosaveSlide).toHaveBeenCalledWith('slide-123', {
        title: 'Modified Problem',
        content: 'This is a test problem slide content',
        speaker_notes: ''
      });
    });
  });

  it('falls back to regular save if autosave fails', async () => {
    mockApiService.autosaveSlide.mockRejectedValue(new Error('Autosave failed'));

    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Problem');
    fireEvent.change(titleInput, { target: { value: 'Modified Problem' } });

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(mockApiService.autosaveSlide).toHaveBeenCalled();
      expect(mockOnSlideUpdate).toHaveBeenCalledWith('slide-123', {
        title: 'Modified Problem',
        content: 'This is a test problem slide content'
      });
    });
  });

  it('handles manual save', async () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Problem');
    fireEvent.change(titleInput, { target: { value: 'Modified Problem' } });

    const saveButton = screen.getByRole('button', { name: /Save/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSlideUpdate).toHaveBeenCalledWith('slide-123', {
        title: 'Modified Problem',
        content: 'This is a test problem slide content'
      });
    });
  });

  it('shows regenerate options when regenerate button is clicked', () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /Regenerate/ });
    fireEvent.click(regenerateButton);

    expect(screen.getByText('General Improvement')).toBeInTheDocument();
    expect(screen.getByText('Improve Clarity')).toBeInTheDocument();
    expect(screen.getByText('Increase Impact')).toBeInTheDocument();
    expect(screen.getByText('Add Data Focus')).toBeInTheDocument();
  });

  it('calls onRegenerateSlide when regenerate option is selected', async () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /Regenerate/ });
    fireEvent.click(regenerateButton);

    const clarityOption = screen.getByText('Improve Clarity');
    fireEvent.click(clarityOption);

    await waitFor(() => {
      expect(mockOnRegenerateSlide).toHaveBeenCalledWith('slide-123', 'clarity');
    });
  });

  it('shows character count for title and content', () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    expect(screen.getByText('12/100 characters')).toBeInTheDocument(); // Title length
    expect(screen.getByText('37/2000 characters')).toBeInTheDocument(); // Content length
  });

  it('disables inputs when loading', () => {
    render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={true}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Problem');
    const contentTextarea = screen.getByDisplayValue('This is a test problem slide content');
    const saveButton = screen.getByRole('button', { name: /Saving.../ });

    expect(titleInput).toBeDisabled();
    expect(contentTextarea).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('updates local state when slide prop changes', () => {
    const { rerender } = render(
      <SlideEditor
        slide={mockSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    const updatedSlide = {
      ...mockSlide,
      title: 'Updated Title',
      content: 'Updated content'
    };

    rerender(
      <SlideEditor
        slide={updatedSlide}
        onSlideUpdate={mockOnSlideUpdate}
        onRegenerateSlide={mockOnRegenerateSlide}
        loading={false}
      />
    );

    expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated content')).toBeInTheDocument();
  });
});