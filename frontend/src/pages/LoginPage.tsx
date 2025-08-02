import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
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
        />
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};