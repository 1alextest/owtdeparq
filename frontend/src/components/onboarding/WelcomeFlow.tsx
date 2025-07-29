import React, { useState } from 'react';
import { useNavigation } from '../../App';
import { apiClient } from '../../services/apiClient';

interface WelcomeFlowProps {
  onComplete: () => void;
}

export const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ onComplete }) => {
  const { navigate } = useNavigation();
  const [step, setStep] = useState<'welcome' | 'intent' | 'quick-start'>('welcome');
  const [intent, setIntent] = useState<'quick' | 'detailed' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickStart = async (prompt: string) => {
    setLoading(true);
    try {
      // Create project and generate deck in one flow
      const project = await apiClient.createProject({
        name: `Quick Pitch - ${new Date().toLocaleDateString()}`,
        description: 'Generated from quick start'
      });

      const response = await apiClient.generateFreeDeck(prompt, project.id, 'groq-llama-8b');
      
      // Navigate directly to the generated deck
      navigate(`/projects/${project.id}/decks/${response.deck_id}`);
      onComplete();
    } catch (error) {
      console.error('Quick start failed:', error);
      setLoading(false);
    }
  };

  const handleDetailedStart = () => {
    onComplete();
    // User will go through normal project creation flow
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to AI Pitch Deck Generator
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Create professional investor presentations in minutes with AI assistance
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">AI-Powered</h3>
                <p className="text-sm text-gray-600">Generate content with advanced AI</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Easy Editing</h3>
                <p className="text-sm text-gray-600">Customize and refine your deck</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Export Ready</h3>
                <p className="text-sm text-gray-600">Download as PDF or PowerPoint</p>
              </div>
            </div>

            <button
              onClick={() => setStep('intent')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
            
            <button
              onClick={onComplete}
              className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Skip introduction
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'intent') {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              How would you like to start?
            </h2>
            <p className="text-gray-600">
              Choose the approach that works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Start Option */}
            <div
              className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
              onClick={() => setStep('quick-start')}
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Start</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Describe your business in a few sentences and get a complete pitch deck instantly
                </p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    2-3 minutes
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Single text input
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Immediate results
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Setup Option */}
            <div
              className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
              onClick={handleDetailedStart}
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Setup</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create projects, organize your work, and use structured forms for comprehensive decks
                </p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Project organization
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Structured forms
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    More control
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={onComplete}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip and go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'quick-start') {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-8">
          <QuickStartForm onSubmit={handleQuickStart} loading={loading} />
        </div>
      </div>
    );
  }

  return null;
};

interface QuickStartFormProps {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

const QuickStartForm: React.FC<QuickStartFormProps> = ({ onSubmit, loading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 10) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Describe Your Business
        </h2>
        <p className="text-gray-600">
          Tell us about your business idea in 2-3 sentences
        </p>
      </div>

      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Example: My startup TechFlow is a SaaS platform that helps small businesses automate their workflow processes. We target SMBs in the service industry who struggle with manual processes and want to improve efficiency..."
          disabled={loading}
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {prompt.length}/500 characters
          </p>
          <p className="text-xs text-gray-500">
            Minimum 10 characters required
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Quick tips:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Include your company name and what it does</li>
          <li>• Mention the problem you're solving</li>
          <li>• Describe your target customers</li>
        </ul>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || prompt.trim().length < 10}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Your Deck...
            </>
          ) : (
            'Create My Pitch Deck'
          )}
        </button>
      </div>
    </form>
  );
};