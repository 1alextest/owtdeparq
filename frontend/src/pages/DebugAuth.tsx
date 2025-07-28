import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugAuth: React.FC = () => {
  const { register, login, loading, error, user, clearError } = useAuth();
  const [email, setEmail] = useState('debug@example.com');
  const [password, setPassword] = useState('password123');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const testRegister = async () => {
    addLog('Starting registration test...');
    clearError();
    
    try {
      addLog(`Attempting to register: ${email}`);
      await register(email, password);
      addLog('Registration completed successfully!');
    } catch (err) {
      addLog(`Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const testLogin = async () => {
    addLog('Starting login test...');
    clearError();
    
    try {
      addLog(`Attempting to login: ${email}`);
      await login(email, password);
      addLog('Login completed successfully!');
    } catch (err) {
      addLog(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-bold text-center mb-6">Authentication Debug</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={testRegister}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Register'}
              </button>
              
              <button
                onClick={testLogin}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Login'}
              </button>
            </div>
            
            <button
              onClick={clearLogs}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
          
          {/* Current State */}
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
          </div>
        </div>
        
        {/* Debug Logs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p>No logs yet. Try registering or logging in.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};