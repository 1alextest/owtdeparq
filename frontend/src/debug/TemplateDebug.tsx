import React, { useState } from 'react';
import { TemplateLibrary, Template } from '../components/templates/TemplateLibrary';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';

export const TemplateDebug: React.FC = () => {
  const { user } = useAuth();
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleTemplateSelect = async (template: Template) => {
    addLog(`Template selected: ${template.name}`);
    
    if (!user) {
      addLog('ERROR: User not authenticated');
      return;
    }

    try {
      setTemplateLoading(true);
      addLog('Creating project from template...');
      
      // Test the API call directly
      const projectData = {
        name: `${template.name} Project`,
        description: `Created from ${template.name} template`,
      };
      
      addLog(`Calling API with data: ${JSON.stringify(projectData)}`);
      addLog(`API Base URL: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}`);
      
      const newProject = await apiClient.createProject(projectData);
      
      addLog(`Project created successfully: ${JSON.stringify(newProject)}`);
      
      // Close the template library
      setIsTemplateLibraryOpen(false);
      
    } catch (err: any) {
      addLog(`ERROR creating project: ${err.message}`);
      addLog(`Error stack: ${err.stack}`);
      console.error('Full error:', err);
    } finally {
      setTemplateLoading(false);
    }
  };

  const testApiConnection = async () => {
    try {
      addLog('Testing API connection...');
      const response = await apiClient.healthCheck();
      addLog(`API health check successful: ${response}`);
      
      // Test projects endpoint
      addLog('Testing projects endpoint...');
      const projects = await apiClient.getProjects();
      addLog(`Projects endpoint successful, got ${projects.length} projects`);
      
    } catch (err: any) {
      addLog(`API test failed: ${err.message}`);
      console.error('API test error:', err);
    }
  };

  const testAuth = async () => {
    try {
      addLog('Testing authentication...');
      if (!user) {
        addLog('No user found');
        return;
      }
      
      // Get token from Firebase auth directly
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        addLog(`Auth token exists: ${!!token}`);
        if (token) {
          addLog(`Token preview: ${token.substring(0, 20)}...`);
        }
      } else {
        addLog('No current user in Firebase auth');
      }
    } catch (err: any) {
      addLog(`Auth test failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Template Debug Tool</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={() => setIsTemplateLibraryOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Open Template Library
        </button>
        
        <button
          onClick={testApiConnection}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Test API Connection
        </button>
        
        <button
          onClick={testAuth}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Test Authentication
        </button>
        
        <button
          onClick={() => setDebugLog([])}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Clear Log
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">User Status:</h2>
        <p>Authenticated: {user ? 'Yes' : 'No'}</p>
        {user && (
          <>
            <p>User ID: {user.id}</p>
            <p>Email: {user.email}</p>
          </>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Log:</h2>
        <div className="max-h-96 overflow-y-auto">
          {debugLog.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            debugLog.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <TemplateLibrary
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        loading={templateLoading}
      />
    </div>
  );
};