import React from 'react';

interface EmptyStateProps {
  onCreateProject: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateProject }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h6a1 1 0 011 1v2M7 7h10" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No projects yet
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Get started by creating your first project. Organize your pitch decks and collaborate with your team.
      </p>
      
      <button
        onClick={onCreateProject}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create Your First Project
      </button>
      
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 text-blue-500 mb-2">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-900">Organize Decks</h4>
          <p className="text-xs text-gray-500 mt-1">
            Keep your pitch decks organized in projects
          </p>
        </div>
        
        <div className="text-center">
          <div className="mx-auto h-8 w-8 text-blue-500 mb-2">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-900">AI-Powered</h4>
          <p className="text-xs text-gray-500 mt-1">
            Generate professional content with AI
          </p>
        </div>
        
        <div className="text-center">
          <div className="mx-auto h-8 w-8 text-blue-500 mb-2">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-900">Export Ready</h4>
          <p className="text-xs text-gray-500 mt-1">
            Download as PDF or PowerPoint
          </p>
        </div>
      </div>
    </div>
  );
};