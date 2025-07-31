import React from 'react';
import { useNavigation } from '../../App';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const { navigate } = useNavigation();

  const handleClick = (item: BreadcrumbItem) => {
    if (item.path && !item.isActive) {
      navigate(item.path);
    }
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            
            {item.isActive ? (
              <span className="text-sm font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : item.path ? (
              <button
                onClick={() => handleClick(item)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-500">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Helper function to generate breadcrumbs based on current route
export const generateBreadcrumbs = (currentRoute: string, projectName?: string, deckTitle?: string): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Projects', path: '/dashboard' }
  ];

  if (currentRoute === '/dashboard') {
    breadcrumbs[0].isActive = true;
    return breadcrumbs;
  }

  // Project detail page
  if (currentRoute.match(/^\/projects\/[^/]+$/) && !currentRoute.includes('/generate') && !currentRoute.includes('/decks/')) {
    breadcrumbs.push({
      label: projectName || 'Project Details',
      isActive: true
    });
    return breadcrumbs;
  }

  // Generation page
  if (currentRoute.includes('/generate')) {
    breadcrumbs.push({
      label: projectName || 'Project',
      path: currentRoute.replace('/generate', '')
    });
    breadcrumbs.push({
      label: 'Generate Deck',
      isActive: true
    });
    return breadcrumbs;
  }

  // Deck editor page
  if (currentRoute.includes('/decks/')) {
    const projectId = currentRoute.split('/')[2];
    breadcrumbs.push({
      label: projectName || 'Project',
      path: `/projects/${projectId}`
    });
    breadcrumbs.push({
      label: deckTitle || 'Deck Editor',
      isActive: true
    });
    return breadcrumbs;
  }

  return breadcrumbs;
};