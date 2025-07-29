import React, { useState } from 'react';
import { ModelSelector, AIModel } from './ModelSelector';

interface CustomFormData {
  company_name: string;
  industry: string;
  target_market: string;
  problem_statement: string;
  solution: string;
  business_model: string;
  key_features: string;
  competitive_advantage: string;
  team_background: string;
  funding_stage: string;
  traction: string;
}

interface CustomFormWizardProps {
  onSubmit: (formData: CustomFormData & { preferredModel: AIModel }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

type WizardStep = 'basics' | 'problem-solution' | 'business' | 'additional' | 'review';

export const CustomFormWizard: React.FC<CustomFormWizardProps> = ({
  onSubmit,
  loading = false,
  error = null,
  onClearError
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [selectedModel, setSelectedModel] = useState<AIModel>('groq-llama-8b');
  const [formData, setFormData] = useState<CustomFormData>({
    company_name: '',
    industry: '',
    target_market: '',
    problem_statement: '',
    solution: '',
    business_model: '',
    key_features: '',
    competitive_advantage: '',
    team_background: '',
    funding_stage: '',
    traction: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const steps: { key: WizardStep; title: string; description: string }[] = [
    { key: 'basics', title: 'Basic Info', description: 'Company and market details' },
    { key: 'problem-solution', title: 'Problem & Solution', description: 'Core value proposition' },
    { key: 'business', title: 'Business Model', description: 'How you make money' },
    { key: 'additional', title: 'Additional Details', description: 'Team, funding, and traction' },
    { key: 'review', title: 'Review', description: 'Confirm and generate' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 'basics':
        if (!formData.company_name.trim()) errors.company_name = 'Company name is required';
        if (!formData.industry.trim()) errors.industry = 'Industry is required';
        if (!formData.target_market.trim()) errors.target_market = 'Target market is required';
        break;
      case 'problem-solution':
        if (!formData.problem_statement.trim()) errors.problem_statement = 'Problem statement is required';
        if (!formData.solution.trim()) errors.solution = 'Solution is required';
        break;
      // Other steps are optional
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].key);
      }
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      try {
        await onSubmit({ ...formData, preferredModel: selectedModel });
      } catch (err) {
        // Error handling is done by parent component
      }
    }
  };

  const handleInputChange = (field: keyof CustomFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear API error
    if (error && onClearError) onClearError();
  };

  const renderField = (
    field: keyof CustomFormData,
    label: string,
    placeholder: string,
    required: boolean = false,
    type: 'input' | 'textarea' | 'select' = 'input',
    options?: string[]
  ) => {
    const hasError = !!validationErrors[field];
    const value = formData[field];

    return (
      <div>
        <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            id={field}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={placeholder}
            disabled={loading}
            maxLength={500}
          />
        ) : type === 'select' ? (
          <select
            id={field}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id={field}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              hasError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={placeholder}
            disabled={loading}
            maxLength={500}
          />
        )}
        
        <div className="flex justify-between items-center mt-1">
          {hasError ? (
            <p className="text-sm text-red-600">{validationErrors[field]}</p>
          ) : (
            <div></div>
          )}
          <p className="text-xs text-gray-500">
            {value.length}/500
          </p>
        </div>
      </div>
    );
  };

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'Manufacturing', 'Real Estate', 'Food & Beverage', 'Transportation',
    'Entertainment', 'Energy', 'Agriculture', 'Other'
  ];

  const fundingStageOptions = [
    'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 
    'Growth Stage', 'Not seeking funding'
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <p className="text-sm text-gray-600 mb-6">
                Tell us about your company and target market
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('company_name', 'Company Name', 'e.g., TechFlow', true)}
              {renderField('industry', 'Industry', 'Select your industry', true, 'select', industryOptions)}
            </div>
            
            {renderField('target_market', 'Target Market', 'e.g., Small businesses in the service industry', true, 'textarea')}
          </div>
        );

      case 'problem-solution':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem & Solution</h3>
              <p className="text-sm text-gray-600 mb-6">
                Describe the core problem you're solving and your solution
              </p>
            </div>
            
            <div className="space-y-6">
              {renderField('problem_statement', 'Problem Statement', 'Describe the key problem your target market faces', true, 'textarea')}
              {renderField('solution', 'Your Solution', 'Explain how your product/service solves this problem', true, 'textarea')}
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Model</h3>
              <p className="text-sm text-gray-600 mb-6">
                How does your business work and make money?
              </p>
            </div>
            
            <div className="space-y-6">
              {renderField('business_model', 'Business Model', 'How do you make money? (e.g., SaaS subscription, marketplace fees)', false, 'textarea')}
              {renderField('key_features', 'Key Features', 'What are the main features or capabilities of your product?', false, 'textarea')}
              {renderField('competitive_advantage', 'Competitive Advantage', 'What makes you unique or better than alternatives?', false, 'textarea')}
            </div>
          </div>
        );

      case 'additional':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                Optional information to enhance your pitch deck
              </p>
            </div>
            
            <div className="space-y-6">
              {renderField('team_background', 'Team Background', 'Brief overview of key team members and their experience', false, 'textarea')}
              {renderField('funding_stage', 'Funding Stage', 'Select your current funding stage', false, 'select', fundingStageOptions)}
              {renderField('traction', 'Traction & Milestones', 'Key achievements, metrics, or progress to date', false, 'textarea')}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Generate</h3>
              <p className="text-sm text-gray-600 mb-6">
                Review your information and select your AI model
              </p>
            </div>

            {/* Model Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">AI Model Selection</h4>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={loading}
              />
            </div>

            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Information Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <span className="ml-2 text-gray-600">{formData.company_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Industry:</span>
                  <span className="ml-2 text-gray-600">{formData.industry || 'Not provided'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Problem:</span>
                  <span className="ml-2 text-gray-600">{formData.problem_statement ? `${formData.problem_statement.substring(0, 100)}...` : 'Not provided'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Solution:</span>
                  <span className="ml-2 text-gray-600">{formData.solution ? `${formData.solution.substring(0, 100)}...` : 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    index <= currentStepIndex ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* API Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>

          {currentStep === 'review' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
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
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};