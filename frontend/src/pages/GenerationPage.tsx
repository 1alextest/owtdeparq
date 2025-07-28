import React, { useState } from 'react';
import { ModeSelector, GenerationMode } from '../components/generation/ModeSelector';
import { FreePromptForm } from '../components/generation/FreePromptForm';
import { CustomForm } from '../components/generation/CustomForm';
import { GenerationProgress } from '../components/generation/GenerationProgress';
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Generate Pitch Deck
              </h1>
              <p className="text-sm text-gray-600">
                Create a professional investor presentation with AI
              </p>
            </div>
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
            <CustomForm
              onSubmit={handleCustomGeneration}
              loading={isGenerating}
              error={error}
              onClearError={clearError}
            />
          )}
        </div>
      </div>

      {/* Generation Progress Modal */}
      <GenerationProgress
        isVisible={isGenerating}
        onCancel={handleCancel}
        estimatedTime={30}
      />
    </>
  );
};