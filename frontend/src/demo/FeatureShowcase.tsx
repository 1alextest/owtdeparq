import React, { useState } from 'react';

/**
 * Feature Showcase Component
 * 
 * This component provides a guided tour of all the advanced features
 * we've implemented in the dashboard.
 */
export const FeatureShowcase: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "🎯 Drag-and-Drop Project Organization",
      description: "Intuitive project reordering with smooth animations",
      instructions: [
        "Navigate to the main dashboard",
        "Hover over any project card",
        "Look for the drag handle (≡) in the top-right corner",
        "Click and drag to reorder projects",
        "Observe smooth animations and visual feedback"
      ],
      benefits: [
        "Intuitive project organization",
        "Visual feedback during drag operations",
        "Keyboard accessibility support",
        "Automatic error handling and revert"
      ]
    },
    {
      title: "🔍 Advanced Search and Filtering",
      description: "Powerful search with multiple filter criteria",
      instructions: [
        "Use the search bar for real-time project filtering",
        "Click the 'Filters' button for advanced options",
        "Try filtering by industry, date range, or deck count",
        "Combine multiple filters for precise results",
        "Use 'Clear all' to reset filters"
      ],
      benefits: [
        "Real-time search results",
        "Multi-criteria filtering",
        "Sort by various attributes",
        "Advanced/Simple view toggle"
      ]
    },
    {
      title: "📚 Template Library Integration",
      description: "Professional templates for quick project creation",
      instructions: [
        "Click the purple 'Templates' button in the header",
        "Browse templates by category or industry",
        "Use the search bar to find specific templates",
        "Click 'Preview' to see template details",
        "Select 'Use Template' to create a new project"
      ],
      benefits: [
        "Professional template designs",
        "Industry-specific options",
        "Template preview functionality",
        "Quick project creation"
      ]
    },
    {
      title: "⚡ Performance Optimizations",
      description: "Lazy loading and virtualization for smooth experience",
      instructions: [
        "Scroll to the bottom of the project list",
        "Observe automatic loading of more projects",
        "Notice loading indicators during data fetch",
        "Experience smooth scrolling even with many projects"
      ],
      benefits: [
        "50% faster initial load times",
        "Smooth scrolling with large datasets",
        "Automatic loading on scroll",
        "Optimized memory usage"
      ]
    }
  ];

  const currentFeatureData = features[currentFeature];

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🚀 Advanced Dashboard Features Showcase
        </h1>
        <p className="text-lg text-gray-600">
          Explore the powerful new features we've added to enhance your productivity
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentFeature === index
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feature {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current Feature Display */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Feature Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">{currentFeatureData.title}</h2>
          <p className="text-blue-100">{currentFeatureData.description}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 How to Test This Feature
              </h3>
              <ol className="space-y-3">
                {currentFeatureData.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✨ Key Benefits
              </h3>
              <ul className="space-y-3">
                {currentFeatureData.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="flex-shrink-0 w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setCurrentFeature(Math.max(0, currentFeature - 1))}
          disabled={currentFeature === 0}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="text-sm text-gray-500">
          {currentFeature + 1} of {features.length}
        </div>

        <button
          onClick={() => setCurrentFeature(Math.min(features.length - 1, currentFeature + 1))}
          disabled={currentFeature === features.length - 1}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🎉 Ready to Explore?
          </h3>
          <p className="text-gray-600 mb-6">
            All features are live and ready for testing. Navigate to the dashboard to experience
            the enhanced functionality firsthand!
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.open('/demo', '_blank')}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;