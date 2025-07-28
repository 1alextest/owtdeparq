import React, { useState } from 'react';

export type AIModel = 'openai' | 'groq-llama-8b' | 'groq-llama-70b' | 'groq-gemma' | 'llama3.1-8b' | 'llama3.1-70b' | 'llama3.1-instruct';

interface ModelOption {
  id: AIModel;
  name: string;
  description: string;
  type: 'cloud' | 'local';
  quality: 'standard' | 'high' | 'highest';
  speed: 'fast' | 'medium' | 'slow';
  memoryRequired: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    description: 'High quality results with OpenAI\'s cloud service',
    type: 'cloud',
    quality: 'highest',
    speed: 'fast',
    memoryRequired: 'N/A (Cloud)'
  },
  {
    id: 'groq-llama-8b',
    name: 'Groq Llama 3 (8B)',
    description: 'Ultra-fast inference with Groq\'s LPU technology',
    type: 'cloud',
    quality: 'high',
    speed: 'fast',
    memoryRequired: 'N/A (Cloud)'
  },
  {
    id: 'groq-llama-70b',
    name: 'Groq Llama 3 (70B)',
    description: 'High-quality model with very fast inference',
    type: 'cloud',
    quality: 'highest',
    speed: 'fast',
    memoryRequired: 'N/A (Cloud)'
  },
  {
    id: 'groq-gemma',
    name: 'Groq Gemma 7B',
    description: 'Google\'s Gemma model with fast inference',
    type: 'cloud',
    quality: 'high',
    speed: 'fast',
    memoryRequired: 'N/A (Cloud)'
  },
  {
    id: 'llama3.1-8b',
    name: 'Llama 3.1 (8B)',
    description: 'Lightweight local model, good balance of quality and speed',
    type: 'local',
    quality: 'standard',
    speed: 'medium',
    memoryRequired: '~8GB RAM'
  },
  {
    id: 'llama3.1-instruct',
    name: 'Llama 3.1 Instruct',
    description: 'Instruction-tuned model for better responses',
    type: 'local',
    quality: 'high',
    speed: 'medium',
    memoryRequired: '~10GB RAM'
  },
  {
    id: 'llama3.1-70b',
    name: 'Llama 3.1 (70B)',
    description: 'Highest quality local model, requires powerful hardware',
    type: 'local',
    quality: 'highest',
    speed: 'slow',
    memoryRequired: '40GB+ RAM'
  }
];

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const selectedModelInfo = MODEL_OPTIONS.find(model => model.id === selectedModel) || MODEL_OPTIONS[0];
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          AI Model
        </label>
        <button 
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Simple View' : 'Advanced Options'}
        </button>
      </div>
      
      {!showAdvanced ? (
        // Simple view with cloud options
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              id="model-openai"
              name="ai-model-simple"
              type="radio"
              checked={selectedModel === 'openai'}
              onChange={() => onModelChange('openai')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="model-openai" className="ml-2 block text-sm text-gray-700">
              OpenAI GPT-4
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="model-groq"
              name="ai-model-simple"
              type="radio"
              checked={selectedModel.startsWith('groq-')}
              onChange={() => onModelChange('groq-llama-8b')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="model-groq" className="ml-2 block text-sm text-gray-700">
              Groq (Fast)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="model-local"
              name="ai-model-simple"
              type="radio"
              checked={selectedModel.startsWith('llama3.1-')}
              onChange={() => onModelChange('llama3.1-8b')}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="model-local" className="ml-2 block text-sm text-gray-700">
              Local Llama
            </label>
          </div>
        </div>
      ) : (
        // Advanced view with all model options
        <div className="grid grid-cols-1 gap-2 border rounded-md p-3 bg-gray-50">
          {MODEL_OPTIONS.map(model => (
            <div key={model.id} className="flex items-start p-2 hover:bg-gray-100 rounded">
              <input
                id={`model-${model.id}`}
                name="ai-model-advanced"
                type="radio"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={() => onModelChange(model.id)}
                disabled={disabled}
                className="h-4 w-4 mt-1 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3">
                <label htmlFor={`model-${model.id}`} className="block text-sm font-medium text-gray-700">
                  {model.name}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    model.type === 'cloud' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {model.type === 'cloud' ? 'Cloud' : 'Local'}
                  </span>
                </label>
                <p className="text-xs text-gray-500">{model.description}</p>
                <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                  <span>Quality: {qualityStars(model.quality)}</span>
                  <span>Speed: {speedIndicator(model.speed)}</span>
                  <span>Memory: {model.memoryRequired}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="mt-1 text-xs text-gray-500">
        {selectedModelInfo.type === 'cloud' 
          ? 'OpenAI provides higher quality results but requires an API key and sends data to the cloud'
          : `Local ${selectedModelInfo.name} runs on your machine without sending data to the cloud`}
      </p>
    </div>
  );
};

// Helper functions for displaying quality and speed indicators
const qualityStars = (quality: 'standard' | 'high' | 'highest') => {
  switch (quality) {
    case 'highest': return '★★★';
    case 'high': return '★★☆';
    case 'standard': return '★☆☆';
    default: return '★☆☆';
  }
};

const speedIndicator = (speed: 'fast' | 'medium' | 'slow') => {
  switch (speed) {
    case 'fast': return '⚡⚡⚡';
    case 'medium': return '⚡⚡';
    case 'slow': return '⚡';
    default: return '⚡⚡';
  }
};