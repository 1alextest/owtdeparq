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

interface CustomFormProps {
  onSubmit: (formData: CustomFormData & { preferredModel: AIModel }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const CustomForm: React.FC<CustomFormProps> = ({
  onSubmit,
  loading = false,
  error = null,
  onClearError
}) => {
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    const requiredFields = [
      { key: 'company_name', label: 'Company Name' },
      { key: 'industry', label: 'Industry' },
      { key: 'target_market', label: 'Target Market' },
      { key: 'problem_statement', label: 'Problem Statement' },
      { key: 'solution', label: 'Solution' }
    ];

    requiredFields.forEach(({ key, label }) => {
      const value = formData[key as keyof CustomFormData].trim();
      if (!value) {
        errors[key] = `${label} is required`;
      } else if (value.length > 500) {
        errors[key] = `${label} must be less than 500 characters`;
      }
    });

    // Optional fields length validation
    const optionalFields = [
      'business_model', 'key_features', 'competitive_advantage', 
      'team_background', 'funding_stage', 'traction'
    ];

    optionalFields.forEach(key => {
      const value = formData[key as keyof CustomFormData].trim();
      if (value && value.length > 500) {
        errors[key] = `This field must be less than 500 characters`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    if (onClearError) onClearError();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit({...formData, preferredModel: selectedModel});
    } catch (err) {
      // Error handling is done by parent component
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
        <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            id={field}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Custom Mode Generation
          </h2>
          <p className="text-gray-600">
            Provide detailed information about your business to generate a comprehensive, targeted pitch deck.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model</h3>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={loading}
            />
          </div>
          
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('company_name', 'Company Name', 'e.g., TechFlow', true)}
              {renderField('industry', 'Industry', 'Select your industry', true, 'select', industryOptions)}
            </div>
            <div className="mt-4">
              {renderField('target_market', 'Target Market', 'e.g., Small businesses in the service industry', true, 'textarea')}
            </div>
          </div>

          {/* Problem & Solution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem & Solution</h3>
            <div className="space-y-4">
              {renderField('problem_statement', 'Problem Statement', 'Describe the key problem your target market faces', true, 'textarea')}
              {renderField('solution', 'Your Solution', 'Explain how your product/service solves this problem', true, 'textarea')}
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
            <div className="space-y-4">
              {renderField('business_model', 'Business Model', 'How do you make money? (e.g., SaaS subscription, marketplace fees)', false, 'textarea')}
              {renderField('key_features', 'Key Features', 'What are the main features or capabilities of your product?', false, 'textarea')}
              {renderField('competitive_advantage', 'Competitive Advantage', 'What makes you unique or better than alternatives?', false, 'textarea')}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              {renderField('team_background', 'Team Background', 'Brief overview of key team members and their experience', false, 'textarea')}
              {renderField('funding_stage', 'Funding Stage', 'Select your current funding stage', false, 'select', fundingStageOptions)}
              {renderField('traction', 'Traction & Milestones', 'Key achievements, metrics, or progress to date', false, 'textarea')}
            </div>
          </div>

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
              <li>• Be specific and detailed in your descriptions</li>
              <li>• Include quantifiable metrics where possible</li>
              <li>• Focus on benefits and outcomes, not just features</li>
              <li>• Mention your unique value proposition clearly</li>
              <li>• Optional fields help create more comprehensive content</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
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