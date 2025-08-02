import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavigationBar } from '../navigation/NavigationBar';
import { Breadcrumb, generateBreadcrumbs } from '../navigation/Breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  projectName?: string;
  deckTitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showBreadcrumbs = true,
  projectName,
  deckTitle
}) => {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname, projectName, deckTitle);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <NavigationBar currentRoute={location.pathname} />
      
      {/* Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 1 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};