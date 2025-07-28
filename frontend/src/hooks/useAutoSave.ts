import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
  forceSave: () => Promise<void>;
  clearError: () => void;
}

export const useAutoSave = (
  projectId: string,
  value: string,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn => {
  const {
    debounceMs = 500,
    maxRetries = 3,
    retryDelayMs = 1000
  } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const lastValueRef = useRef(value);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const saveDescription = useCallback(async (description: string): Promise<void> => {
    if (!isMountedRef.current) return;
    
    try {
      setSaveStatus('saving');
      setError(null);
      
      const response = await apiClient.updateProjectDescription(projectId, description);
      
      if (!isMountedRef.current) return;
      
      setSaveStatus('saved');
      setLastSaved(response.lastUpdated ? new Date(response.lastUpdated) : new Date());
      retryCountRef.current = 0;
      
      // Reset to idle after showing saved status briefly
      setTimeout(() => {
        if (isMountedRef.current) {
          setSaveStatus('idle');
        }
      }, 2000);
      
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to save description';
      setError(errorMessage);
      setSaveStatus('error');
      
      // Retry logic with exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = retryDelayMs * Math.pow(2, retryCountRef.current - 1);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            saveDescription(description);
          }
        }, delay);
      }
    }
  }, [projectId, maxRetries, retryDelayMs]);

  const debouncedSave = useCallback((description: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        saveDescription(description);
      }
    }, debounceMs);
  }, [saveDescription, debounceMs]);

  // Auto-save when value changes
  useEffect(() => {
    // Don't save if value hasn't actually changed
    if (value === lastValueRef.current) {
      return;
    }
    
    lastValueRef.current = value;
    
    // Don't save empty values on initial load
    if (value.trim() === '' && saveStatus === 'idle' && !lastSaved) {
      return;
    }
    
    debouncedSave(value);
  }, [value, debouncedSave, saveStatus, lastSaved]);

  const forceSave = useCallback(async (): Promise<void> => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    await saveDescription(value);
  }, [saveDescription, value]);

  const clearError = useCallback(() => {
    setError(null);
    if (saveStatus === 'error') {
      setSaveStatus('idle');
    }
  }, [saveStatus]);

  return {
    saveStatus,
    lastSaved,
    error,
    forceSave,
    clearError
  };
};