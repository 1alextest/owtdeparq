import React, { useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onSwitchToRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // TODO: Redirect to dashboard
      console.log('User already authenticated, should redirect to dashboard');
    }
  }, [user]);

  const handleLoginSuccess = () => {
    console.log('Login successful, should redirect to dashboard');
    // TODO: Redirect to dashboard
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Owtdeparq
          </h1>
          <p className="text-gray-600">
            Create professional presentations with AI assistance
          </p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={onSwitchToRegister}
        />
      </div>
    </div>
  );
};