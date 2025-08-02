import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatbotProvider } from './contexts/ChatbotContext';
import { AppRoutes } from './routes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatbotProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </ChatbotProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
