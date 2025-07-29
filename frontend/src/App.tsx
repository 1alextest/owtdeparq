import React, { useState, createContext, useContext } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EnhancedDashboard } from './pages/EnhancedDashboard';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { GenerationPage } from './pages/GenerationPage';
import { DeckEditorPage } from './pages/DeckEditorPage';
import { AppLayout } from './components/layout';
import { TemplateDebug } from './debug/TemplateDebug';

import { useAuth } from './contexts/AuthContext';
import './App.css';

// Simple navigation context
interface NavigationContextType {
  currentRoute: string;
  navigate: (route: string) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

// Main app content that uses auth context
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');
  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [routeHistory, setRouteHistory] = useState<string[]>(['/dashboard']);

  const navigate = (route: string) => {
    setRouteHistory(prev => [...prev, route]);
    setCurrentRoute(route);
  };

  const goBack = () => {
    if (routeHistory.length > 1) {
      const newHistory = routeHistory.slice(0, -1);
      setRouteHistory(newHistory);
      setCurrentRoute(newHistory[newHistory.length - 1]);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the appropriate page based on route
  if (user) {
    const navigationValue = { currentRoute, navigate, goBack };
    
    return (
      <NavigationContext.Provider value={navigationValue}>
        <AppLayout currentRoute={currentRoute}>
          {currentRoute === '/dashboard' && <EnhancedDashboard />}
          {currentRoute === '/debug' && <TemplateDebug />}
          {currentRoute.startsWith('/projects/') && !currentRoute.includes('/generate') && !currentRoute.includes('/decks/') && (
            <ProjectDetailPage projectId={currentRoute.split('/')[2]} />
          )}
          {currentRoute.startsWith('/projects/') && currentRoute.endsWith('/generate') && (
            <GenerationPage projectId={currentRoute.split('/')[2]} />
          )}
          {currentRoute.startsWith('/projects/') && currentRoute.includes('/decks/') && (
            <DeckEditorPage 
              projectId={currentRoute.split('/')[2]} 
              deckId={currentRoute.split('/')[4]} 
            />
          )}
        </AppLayout>
      </NavigationContext.Provider>
    );
  }

  // If not authenticated, show login or register page based on current page state
  if (currentPage === 'register') {
    return <RegisterPage onSwitchToLogin={() => setCurrentPage('login')} />;
  } else {
    return <LoginPage onSwitchToRegister={() => setCurrentPage('register')} />;
  }
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
