import React from 'react';
import { SaveStatus } from '../../hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
  onRetry?: () => void;
  onClearError?: () => void;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSaved,
  error,
  onRetry,
  onClearError,
  className = ''
}) => {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'saved':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${formatLastSaved(lastSaved)}` : 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return lastSaved ? `Last saved ${formatLastSaved(lastSaved)}` : '';
    }
  };

  const statusText = getStatusText();
  const statusIcon = getStatusIcon();

  if (!statusText && !statusIcon) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {statusIcon}
      <span className={`
        ${status === 'saving' ? 'text-blue-600' : ''}
        ${status === 'saved' ? 'text-green-600' : ''}
        ${status === 'error' ? 'text-red-600' : ''}
        ${status === 'idle' ? 'text-gray-500' : ''}
      `}>
        {statusText}
      </span>
      
      {status === 'error' && error && (
        <div className="flex items-center space-x-1">
          <button
            onClick={onRetry}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
            title="Retry saving"
          >
            Retry
          </button>
          <button
            onClick={onClearError}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      
      {status === 'error' && error && (
        <div className="absolute z-10 mt-8 p-2 bg-red-50 border border-red-200 rounded-md shadow-sm">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};