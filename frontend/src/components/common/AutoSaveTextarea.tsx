import React, { useState, useEffect } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { SaveStatusIndicator } from './SaveStatusIndicator';

interface AutoSaveTextareaProps {
  projectId: string;
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  debounceMs?: number;
  onValueChange?: (value: string) => void;
}

export const AutoSaveTextarea: React.FC<AutoSaveTextareaProps> = ({
  projectId,
  initialValue = '',
  placeholder = 'Enter description...',
  maxLength = 1000,
  rows = 3,
  className = '',
  disabled = false,
  label,
  required = false,
  debounceMs = 500,
  onValueChange
}) => {
  const [value, setValue] = useState(initialValue);
  
  const {
    saveStatus,
    lastSaved,
    error,
    forceSave,
    clearError
  } = useAutoSave(projectId, value, { debounceMs });

  // Update local value when initialValue changes (e.g., when project loads)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValueChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Force save on Ctrl+S
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      forceSave();
    }
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            resize-none transition-colors
            ${isOverLimit ? 'border-red-300 focus:ring-red-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
            ${className}
          `}
        />
        
        {/* Manual save button for fallback */}
        {saveStatus === 'error' && (
          <button
            onClick={forceSave}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Manual save"
          >
            Save
          </button>
        )}
      </div>

      {/* Character count and save status */}
      <div className="flex justify-between items-center">
        <SaveStatusIndicator
          status={saveStatus}
          lastSaved={lastSaved}
          error={error}
          onRetry={forceSave}
          onClearError={clearError}
          className="flex-1"
        />
        
        <div className="flex items-center space-x-2">
          {/* Keyboard shortcut hint */}
          <span className="text-xs text-gray-400 hidden sm:inline">
            Ctrl+S to save
          </span>
          
          {/* Character count */}
          <span className={`text-xs ${
            isOverLimit ? 'text-red-600 font-medium' : 
            isNearLimit ? 'text-yellow-600' : 'text-gray-500'
          }`}>
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>
      
      {/* Error message for character limit */}
      {isOverLimit && (
        <p className="text-xs text-red-600">
          Description exceeds maximum length by {characterCount - maxLength} characters
        </p>
      )}
    </div>
  );
};