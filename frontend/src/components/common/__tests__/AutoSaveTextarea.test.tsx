import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutoSaveTextarea } from '../AutoSaveTextarea';
import { apiClient } from '../../../services/apiClient';

// Mock the API client
jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    updateProjectDescription: jest.fn()
  }
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AutoSaveTextarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with initial value', () => {
    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue="Initial description"
        placeholder="Enter description"
      />
    );

    const textarea = screen.getByDisplayValue('Initial description');
    expect(textarea).toBeInTheDocument();
  });

  it('shows character count', () => {
    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue="Test"
        maxLength={100}
      />
    );

    expect(screen.getByText('4/100')).toBeInTheDocument();
  });

  it('shows warning when near character limit', () => {
    const longText = 'a'.repeat(85); // 85% of 100
    
    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue={longText}
        maxLength={100}
      />
    );

    const characterCount = screen.getByText('85/100');
    expect(characterCount).toHaveClass('text-yellow-600');
  });

  it('shows error when over character limit', () => {
    const longText = 'a'.repeat(105); // Over 100
    
    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue={longText}
        maxLength={100}
      />
    );

    const characterCount = screen.getByText('105/100');
    expect(characterCount).toHaveClass('text-red-600');
    expect(screen.getByText(/exceeds maximum length by 5 characters/)).toBeInTheDocument();
  });

  it('calls onValueChange when text changes', () => {
    const onValueChange = jest.fn();
    
    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue=""
        onValueChange={onValueChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New text' } });

    expect(onValueChange).toHaveBeenCalledWith('New text');
  });

  it('triggers auto-save after debounce delay', async () => {
    mockApiClient.updateProjectDescription.mockResolvedValue({
      project: { id: 'project-1' } as any,
      lastUpdated: new Date(),
      status: 'success'
    });

    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue=""
        debounceMs={300}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Auto-save test' } });

    // Should show saving status after debounce
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    expect(mockApiClient.updateProjectDescription).toHaveBeenCalledWith(
      'project-1',
      'Auto-save test'
    );
  });

  it('shows manual save button on error', async () => {
    mockApiClient.updateProjectDescription.mockRejectedValue(
      new Error('Save failed')
    );

    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue=""
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test' } });

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();
  });

  it('supports Ctrl+S for manual save', async () => {
    mockApiClient.updateProjectDescription.mockResolvedValue({
      project: { id: 'project-1' } as any,
      lastUpdated: new Date(),
      status: 'success'
    });

    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue="Test content"
      />
    );

    const textarea = screen.getByRole('textbox');
    
    fireEvent.keyDown(textarea, { 
      key: 's', 
      ctrlKey: true,
      preventDefault: jest.fn()
    });

    await waitFor(() => {
      expect(mockApiClient.updateProjectDescription).toHaveBeenCalledWith(
        'project-1',
        'Test content'
      );
    });
  });

  it('shows keyboard shortcut hint', () => {
    render(
      <AutoSaveTextarea
        projectId="project-1"
        initialValue=""
      />
    );

    expect(screen.getByText('Ctrl+S to save')).toBeInTheDocument();
  });
});