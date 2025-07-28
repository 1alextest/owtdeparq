import React, { useEffect } from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register, loading, error, user, clearError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // TODO: Redirect to dashboard
      console.log('User already authenticated, should redirect to dashboard');
    }
  }, [user]);

  const handleRegister = async (email: string, password: string, confirmPassword: string) => {
    clearError();
    await register(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Owtdeparq
          </h1>
          <p className="text-gray-600">
            Create professional pitch decks with AI assistance
          </p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm 
          onSubmit={handleRegister}
          loading={loading}
          error={error || undefined}
          onSwitchToLogin={onSwitchToLogin}
        />
      </div>
    </div>
  );
};