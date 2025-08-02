// Utility functions for current routing system improvements
export interface RouteParams {
  projectId?: string;
  deckId?: string;
}

export interface ParsedRoute {
  path: string;
  params: RouteParams;
  isValid: boolean;
}

export const parseRoute = (route: string): ParsedRoute => {
  const segments = route.split('/').filter(Boolean);
  
  // Dashboard route
  if (route === '/dashboard') {
    return { path: '/dashboard', params: {}, isValid: true };
  }
  
  // Project routes
  if (segments[0] === 'projects' && segments[1]) {
    const projectId = segments[1];
    
    // Project detail: /projects/:id
    if (segments.length === 2) {
      return { 
        path: '/projects/:id', 
        params: { projectId }, 
        isValid: true 
      };
    }
    
    // Generation page: /projects/:id/generate
    if (segments.length === 3 && segments[2] === 'generate') {
      return { 
        path: '/projects/:id/generate', 
        params: { projectId }, 
        isValid: true 
      };
    }
    
    // Deck editor: /projects/:id/decks/:deckId
    if (segments.length === 4 && segments[2] === 'decks' && segments[3]) {
      return { 
        path: '/projects/:id/decks/:deckId', 
        params: { projectId, deckId: segments[3] }, 
        isValid: true 
      };
    }
  }
  
  return { path: route, params: {}, isValid: false };
};

export const buildRoute = (path: string, params: RouteParams): string => {
  let route = path;
  
  if (params.projectId) {
    route = route.replace(':id', params.projectId);
  }
  
  if (params.deckId) {
    route = route.replace(':deckId', params.deckId);
  }
  
  return route;
};

// Route validation
export const isValidRoute = (route: string): boolean => {
  return parseRoute(route).isValid;
};

// Navigation helpers
export const getProjectId = (route: string): string | null => {
  const parsed = parseRoute(route);
  return parsed.params.projectId || null;
};

export const getDeckId = (route: string): string | null => {
  const parsed = parseRoute(route);
  return parsed.params.deckId || null;
};