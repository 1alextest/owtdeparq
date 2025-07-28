import React, { useState } from 'react';

interface SlideContent {
  title: string;
  content: string;
  speaker_notes: string;
}

interface SlideRegenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (content: SlideContent) => void;
  onReject: () => void;
  originalContent: SlideContent;
  regeneratedContent: SlideContent | null;
  loading: boolean;
  error: string | null;
}

export const SlideRegenerationModal: React.FC<SlideRegenerationModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  originalContent,
  regeneratedContent,
  loading,
  error
}) => {
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'regenerated'>('regenerated');

  if (!isOpen) return null;

  const handleApprove = () => {
    if (regeneratedContent && selectedVersion === 'regenerated') {
      onApprove(regeneratedContent);
    } else {
      onApprove(originalContent);
    }
  };

  const renderContentComparison = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is regenerating your slide content...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Regeneration Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!regeneratedContent) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No regenerated content available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Version Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedVersion('original')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedVersion === 'original'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Original Version
          </button>
          <button
            onClick={() => setSelectedVersion('regenerated')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedVersion === 'regenerated'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Regenerated
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              New
            </span>
          </button>
        </div>

        {/* Content Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Content */}
          <div className={`border rounded-lg p-4 ${selectedVersion === 'original' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Original Version
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Title</h4>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                  {originalContent.title}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Content</h4>
                <div className="text-sm text-gray-900 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  {originalContent.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Regenerated Content */}
          <div className={`border rounded-lg p-4 ${selectedVersion === 'regenerated' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              AI Regenerated
              <svg className="w-4 h-4 ml-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Title</h4>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                  {regeneratedContent.title}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Content</h4>
                <div className="text-sm text-gray-900 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  {regeneratedContent.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Improvements Summary */}
        {regeneratedContent && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">✨ AI Improvements</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Enhanced clarity and readability</li>
              <li>• Improved professional tone</li>
              <li>• Better structure and flow</li>
              <li>• Optimized for investor appeal</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                AI Slide Regeneration
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve the AI-generated improvements to your slide
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            {renderContentComparison()}
          </div>

          {/* Actions */}
          {!loading && !error && regeneratedContent && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={onReject}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Keep Original
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {selectedVersion === 'regenerated' ? 'Use AI Version' : 'Keep Original'}
              </button>
            </div>
          )}

          {/* Error Actions */}
          {error && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}

          {/* Loading Actions */}
          {loading && (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};