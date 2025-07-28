import React, { useState, useEffect } from 'react';

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface GenerationProgressProps {
  isVisible: boolean;
  onCancel?: () => void;
  estimatedTime?: number; // in seconds
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isVisible,
  onCancel,
  estimatedTime = 30
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const steps: GenerationStep[] = [
    {
      id: 'analyzing',
      title: 'Analyzing your prompt',
      description: 'Understanding your business concept and extracting key information',
      completed: false,
      current: false
    },
    {
      id: 'structuring',
      title: 'Structuring content',
      description: 'Organizing information into professional slide categories',
      completed: false,
      current: false
    },
    {
      id: 'generating',
      title: 'Generating slides',
      description: 'Creating compelling content for each slide using AI',
      completed: false,
      current: false
    },
    {
      id: 'finalizing',
      title: 'Finalizing deck',
      description: 'Polishing content and preparing your pitch deck',
      completed: false,
      current: false
    }
  ];

  // Update steps based on elapsed time
  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Progress through steps based on elapsed time
  useEffect(() => {
    if (!isVisible) return;

    const stepDuration = estimatedTime / steps.length;
    const newCurrentStep = Math.min(
      Math.floor(elapsedTime / stepDuration),
      steps.length - 1
    );
    
    setCurrentStep(newCurrentStep);
  }, [elapsedTime, estimatedTime, steps.length, isVisible]);

  const getUpdatedSteps = (): GenerationStep[] => {
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStep,
      current: index === currentStep
    }));
  };

  const progressPercentage = Math.min(((currentStep + 1) / steps.length) * 100, 100);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Generating Your Pitch Deck
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This usually takes {estimatedTime} seconds. Please don't close this window.
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {getUpdatedSteps().map((step, index) => (
              <div key={step.id} className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {step.completed ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : step.current ? (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${
                    step.completed ? 'text-green-700' : 
                    step.current ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    step.completed ? 'text-green-600' : 
                    step.current ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Time indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Elapsed time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </p>
          </div>

          {/* AI Working Indicator */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  AI is crafting your professional pitch deck with investor-ready content...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};