import React, { useState, useEffect } from 'react';

interface EnhancedGenerationProgressProps {
  isVisible: boolean;
  onCancel: () => void;
  estimatedTime: number;
}

export const EnhancedGenerationProgress: React.FC<EnhancedGenerationProgressProps> = ({
  isVisible,
  onCancel,
  estimatedTime
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime);

  const steps = [
    { title: 'Analyzing your business', description: 'Understanding your market and value proposition' },
    { title: 'Structuring content', description: 'Organizing information into slide framework' },
    { title: 'Generating slides', description: 'Creating compelling content for each slide' },
    { title: 'Optimizing presentation', description: 'Refining content for maximum impact' },
    { title: 'Finalizing deck', description: 'Preparing your professional pitch deck' }
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      setTimeRemaining(estimatedTime);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + (100 / (estimatedTime * 10)), 95);
        
        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        setCurrentStep(Math.min(stepIndex, steps.length - 1));
        
        return newProgress;
      });

      setTimeRemaining(prev => Math.max(prev - 0.1, 0));
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, estimatedTime, steps.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="text-center">
          {/* Animated Icon */}
          <div className="mx-auto h-16 w-16 mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse opacity-20"></div>
            <div className="relative bg-white rounded-full p-3 shadow-lg">
              <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Creating Your Pitch Deck
          </h3>
          
          <p className="text-gray-600 mb-6">
            Our AI is crafting a professional presentation tailored to your business
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              <h4 className="font-medium text-blue-900">
                {steps[currentStep]?.title}
              </h4>
            </div>
            <p className="text-sm text-blue-700">
              {steps[currentStep]?.description}
            </p>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estimated time remaining: {Math.ceil(timeRemaining)}s
          </div>

          {/* Steps Preview */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-1 ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`text-xs text-center max-w-[60px] ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.title.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Cancel Generation
          </button>
        </div>
      </div>
    </div>
  );
};