import React, { useState } from 'react';
import { ModelSelector, AIModel } from './ModelSelector';

interface FreePromptFormProps {
  onSubmit: (prompt: string, model: AIModel) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const FreePromptForm: React.FC<FreePromptFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  onClearError
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('groq-llama-8b');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationError(null);
    if (onClearError) onClearError();
    
    // Validate prompt
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setValidationError('Please enter a prompt to generate your pitch deck');
      return;
    }
    
    if (trimmedPrompt.length < 10) {
      setValidationError('Prompt must be at least 10 characters long');
      return;
    }
    
    if (trimmedPrompt.length > 2000) {
      setValidationError('Prompt must be less than 2000 characters');
      return;
    }
    
    try {
      await onSubmit(trimmedPrompt, selectedModel);
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (validationError) setValidationError(null);
    if (error && onClearError) onClearError();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Free Mode Generation
          </h2>
          <p className="text-gray-600">
            Describe your business idea, and our AI will generate a complete 12-slide pitch deck for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={loading}
          />
          
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your business idea *
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={handlePromptChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Example: My startup TechFlow is a SaaS platform that helps small businesses automate their workflow processes. We target SMBs in the service industry who struggle with manual processes and want to improve efficiency..."
              disabled={loading}
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {prompt.length}/2000 characters
              </p>
              <p className="text-xs text-gray-500">
                Minimum 10 characters required
              </p>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}

          {/* API Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                {onClearError && (
                  <div className="ml-auto pl-3">
                    <button
                      type="button"
                      onClick={onClearError}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for better results:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Include your company name and what it does</li>
              <li>• Describe the problem you're solving</li>
              <li>• Mention your target market or customers</li>
              <li>• Include any unique advantages or features</li>
              <li>• Add context about your industry or business model</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !prompt.trim() || prompt.trim().length < 10}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Pitch Deck...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Pitch Deck
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};