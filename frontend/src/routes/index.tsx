import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { NotFound } from '../components/common/NotFound';
import { AppLayout } from '../components/layout';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { EnhancedDashboard } from '../pages/EnhancedDashboard';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { GenerationPage } from '../pages/GenerationPage';
import { DeckEditorPage } from '../pages/DeckEditorPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Layout wrapper for protected routes
interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};

// Main Routes Component
export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <EnhancedDashboard />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/projects/:projectId" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <ProjectDetailPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/projects/:projectId/generate" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <GenerationPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/projects/:projectId/decks/:deckId" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <DeckEditorPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};