import React, { useState, useCallback } from 'react';
import { chatbotService } from '../../services/chatbotService';
import { ImproveSpeakerNotesResponse } from '../../types';

export type ImprovementType = 'clarity' | 'engagement' | 'structure' | 'detail';

interface SpeakerNotesImproverProps {
  slideId: string;
  currentNotes: string;
  onApply: (improvedNotes: string) => void;
  onCancel: () => void;
  className?: string;
}

interface ImprovementOption {
  type: ImprovementType;
  label: string;
  description: string;
  icon: string;
}

const IMPROVEMENT_OPTIONS: ImprovementOption[] = [
  {
    type: 'clarity',
    label: 'Improve Clarity',
    description: 'Make the notes clearer and easier to understand',
    icon: '🔍',
  },
  {
    type: 'engagement',
    label: 'Boost Engagement',
    description: 'Make the notes more engaging and compelling',
    icon: '🎯',
  },
  {
    type: 'structure',
    label: 'Better Structure',
    description: 'Improve the organization and flow of the notes',
    icon: '📋',
  },
  {
    type: 'detail',
    label: 'Add Detail',
    description: 'Expand with more specific details and examples',
    icon: '📝',
  },
];

export const SpeakerNotesImprover: React.FC<SpeakerNotesImproverProps> = ({
  slideId,
  currentNotes,
  onApply,
  onCancel,
  className = '',
}) => {
  const [selectedType, setSelectedType] = useState<ImprovementType>('clarity');
  const [isImproving, setIsImproving] = useState(false);
  const [improvedNotes, setImprovedNotes] = useState<string>('');
  const [improvementResponse, setImprovementResponse] = useState<ImproveSpeakerNotesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'compare'>('select');

  const handleImprove = useCallback(async () => {
    if (!currentNotes.trim()) {
      setError('Please add some speaker notes first before improving them.');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const response = await chatbotService.improveSpeakerNotes(
        slideId,
        currentNotes,
        selectedType
      );

      setImprovementResponse(response);
      setImprovedNotes(response.improvedNotes);
      setStep('compare');
    } catch (err) {
      const errorMessage = chatbotService.getUserFriendlyErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsImproving(false);
    }
  }, [slideId, currentNotes, selectedType]);

  const handleApply = useCallback(() => {
    if (improvedNotes) {
      onApply(improvedNotes);
    }
  }, [improvedNotes, onApply]);

  const handleTryAgain = useCallback(() => {
    setStep('select');
    setImprovedNotes('');
    setImprovementResponse(null);
    setError(null);
  }, []);

  const renderSelectionStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Improve Speaker Notes
        </h3>
        <p className="text-sm text-gray-600">
          Choose how you'd like to improve your speaker notes with AI assistance
        </p>
      </div>

      {/* Current Notes Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Notes</h4>
        <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
          {currentNotes || (
            <span className="italic text-gray-500">No speaker notes yet</span>
          )}
        </div>
      </div>

      {/* Improvement Type Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Select Improvement Type
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {IMPROVEMENT_OPTIONS.map((option) => (
            <label
              key={option.type}
              className={`
                relative flex items-start p-4 rounded-lg border cursor-pointer
                transition-all duration-200
                ${selectedType === option.type
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="improvementType"
                value={option.type}
                checked={selectedType === option.type}
                onChange={(e) => setSelectedType(e.target.value as ImprovementType)}
                className="sr-only"
              />
              <div className="flex items-center w-full">
                <span className="text-2xl mr-3" role="img" aria-hidden="true">
                  {option.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {option.description}
                  </div>
                </div>
                {selectedType === option.type && (
                  <div className="ml-3">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="
            px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
            rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 transition-colors
          "
        >
          Cancel
        </button>
        <button
          onClick={handleImprove}
          disabled={isImproving || !currentNotes.trim()}
          className="
            px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent 
            rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          "
        >
          {isImproving ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              Improving...
            </div>
          ) : (
            'Improve Notes'
          )}
        </button>
      </div>
    </div>
  );

  const renderComparisonStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Review Improved Notes
        </h3>
        <p className="text-sm text-gray-600">
          Compare your original notes with the AI-improved version
        </p>
      </div>

      {/* Improvement Info */}
      {improvementResponse && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-lg mr-2" role="img" aria-hidden="true">
              {IMPROVEMENT_OPTIONS.find(opt => opt.type === improvementResponse.improvementType)?.icon}
            </span>
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                {IMPROVEMENT_OPTIONS.find(opt => opt.type === improvementResponse.improvementType)?.label}
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                Applied to: {improvementResponse.slideTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original Notes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
            Original Notes
          </h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {currentNotes}
            </div>
          </div>
        </div>

        {/* Improved Notes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Improved Notes
          </h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 h-64 overflow-y-auto">
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {improvedNotes}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleTryAgain}
          className="
            px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
            rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 transition-colors
          "
        >
          Try Different Type
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="
              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
              rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-blue-500 transition-colors
            "
          >
            Keep Original
          </button>
          <button
            onClick={handleApply}
            className="
              px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent 
              rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-green-500 transition-colors
            "
          >
            Apply Improved Notes
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      {step === 'select' ? renderSelectionStep() : renderComparisonStep()}
    </div>
  );
};

// Compact version for smaller spaces
export const CompactSpeakerNotesImprover: React.FC<SpeakerNotesImproverProps> = ({
  slideId,
  currentNotes,
  onApply,
  onCancel,
  className = '',
}) => {
  const [selectedType, setSelectedType] = useState<ImprovementType>('clarity');
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = useCallback(async () => {
    if (!currentNotes.trim()) {
      setError('Please add some speaker notes first.');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      const response = await chatbotService.improveSpeakerNotes(
        slideId,
        currentNotes,
        selectedType
      );

      onApply(response.improvedNotes);
    } catch (err) {
      const errorMessage = chatbotService.getUserFriendlyErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsImproving(false);
    }
  }, [slideId, currentNotes, selectedType, onApply]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Improve Speaker Notes</h4>
        
        {/* Quick Type Selection */}
        <div className="flex flex-wrap gap-2">
          {IMPROVEMENT_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => setSelectedType(option.type)}
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                transition-colors duration-200
                ${selectedType === option.type
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-1" role="img" aria-hidden="true">
                {option.icon}
              </span>
              {option.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImprove}
            disabled={isImproving || !currentNotes.trim()}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isImproving ? 'Improving...' : 'Improve'}
          </button>
        </div>
      </div>
    </div>
  );
};