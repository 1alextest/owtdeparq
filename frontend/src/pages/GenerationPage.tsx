import React, { useState } from 'react';
import { ModeSelector, GenerationMode } from '../components/generation/ModeSelector';
import { FreePromptForm } from '../components/generation/FreePromptForm';
import { CustomFormWizard } from '../components/generation/CustomFormWizard';
import { EnhancedGenerationProgress } from '../components/generation/EnhancedGenerationProgress';
import { useNavigation } from '../App';
import { apiClient } from '../services/apiClient';

interface GenerationPageProps {
  projectId: string;
}

export const GenerationPage: React.FC<GenerationPageProps> = ({ projectId }) => {
  const { navigate, goBack } = useNavigation();
  
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('free');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFreeGeneration = async (prompt: string, model: string) => {
    if (!projectId) {
      setError('Project ID is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiClient.generateFreeDeck(prompt, projectId, model);

      // Navigate to the generated deck
      navigate(`/projects/${projectId}/decks/${response.deck_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pitch deck');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomGeneration = async (formData: any) => {
    if (!projectId) {
      setError('Project ID is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiClient.generateCustomDeck(formData, projectId);

      // Navigate to the generated deck
      navigate(`/projects/${projectId}/decks/${response.deck_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pitch deck');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setIsGenerating(false);
    // In a real implementation, you might want to cancel the API request
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Generate Pitch Deck
              </h1>
              <p className="text-sm text-gray-500">
                Create a professional investor presentation with AI
              </p>
            </div>
            <button
              onClick={goBack}
              className="text-gray-500 hover:text-gray-700 inline-flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Mode Selection */}
          <ModeSelector
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            disabled={isGenerating}
          />

          {/* Generation Form */}
          {selectedMode === 'free' && (
            <FreePromptForm
              onSubmit={handleFreeGeneration}
              loading={isGenerating}
              error={error}
              onClearError={clearError}
            />
          )}

          {selectedMode === 'custom' && (
            <CustomFormWizard
              onSubmit={handleCustomGeneration}
              loading={isGenerating}
              error={error}
              onClearError={clearError}
            />
          )}
        </div>
      </div>

      {/* Generation Progress Modal */}
      <EnhancedGenerationProgress
        isVisible={isGenerating}
        onCancel={handleCancel}
        estimatedTime={30}
      />
    </>
  );
};