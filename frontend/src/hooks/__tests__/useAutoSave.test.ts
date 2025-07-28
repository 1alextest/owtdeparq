import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { apiClient } from '../../services/apiClient';

// Mock the API client
jest.mock('../../services/apiClient', () => ({
  apiClient: {
    updateProjectDescription: jest.fn()
  }
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with idle status', () => {
    const { result } = renderHook(() => 
      useAutoSave('project-1', 'initial value')
    );

    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should debounce save calls', async () => {
    mockApiClient.updateProjectDescription.mockResolvedValue({
      project: { id: 'project-1' } as any,
      lastUpdated: new Date(),
      status: 'success'
    });

    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave('project-1', value),
      { initialProps: { value: 'initial' } }
    );

    // Change value multiple times quickly
    rerender({ value: 'change 1' });
    rerender({ value: 'change 2' });
    rerender({ value: 'final change' });

    // Fast-forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('saving');
    });

    // Should only call API once with the final value
    expect(mockApiClient.updateProjectDescription).toHaveBeenCalledTimes(1);
    expect(mockApiClient.updateProjectDescription).toHaveBeenCalledWith(
      'project-1',
      'final change'
    );
  });

  it('should handle save success', async () => {
    const mockDate = new Date('2023-01-01T12:00:00Z');
    mockApiClient.updateProjectDescription.mockResolvedValue({
      project: { id: 'project-1' } as any,
      lastUpdated: mockDate,
      status: 'success'
    });

    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave('project-1', value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'new value' });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('saved');
    });

    expect(result.current.lastSaved).toEqual(mockDate);
    expect(result.current.error).toBeNull();

    // Should reset to idle after 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('idle');
    });
  });

  it('should handle save errors with retry', async () => {
    mockApiClient.updateProjectDescription
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        project: { id: 'project-1' } as any,
        lastUpdated: new Date(),
        status: 'success'
      });

    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave('project-1', value, { maxRetries: 1 }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'new value' });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('error');
    });

    expect(result.current.error).toBe('Network error');

    // Should retry after delay
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('saved');
    });

    expect(mockApiClient.updateProjectDescription).toHaveBeenCalledTimes(2);
  });

  it('should support force save', async () => {
    mockApiClient.updateProjectDescription.mockResolvedValue({
      project: { id: 'project-1' } as any,
      lastUpdated: new Date(),
      status: 'success'
    });

    const { result } = renderHook(() => 
      useAutoSave('project-1', 'test value')
    );

    await act(async () => {
      await result.current.forceSave();
    });

    expect(mockApiClient.updateProjectDescription).toHaveBeenCalledWith(
      'project-1',
      'test value'
    );
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should clear errors', async () => {
    mockApiClient.updateProjectDescription.mockRejectedValue(
      new Error('Test error')
    );

    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave('project-1', value, { maxRetries: 0 }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'new value' });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('error');
      expect(result.current.error).toBe('Test error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.saveStatus).toBe('idle');
  });
});