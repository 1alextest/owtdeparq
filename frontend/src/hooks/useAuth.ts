import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Re-export the useAuth hook for convenience
export const useAuth = useAuthContext;

// Additional authentication-related hooks

export const useAuthToken = () => {
  const { user } = useAuth();
  
  const getToken = () => {
    return localStorage.getItem('auth_token');
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    token: getToken(),
    getToken,
    getAuthHeaders,
    isAuthenticated: !!user,
  };
};

export const useAuthGuard = () => {
  const { user, loading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
};