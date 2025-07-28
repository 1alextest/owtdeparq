import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
    verifyToken: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { user, loading, error, login, register, logout, clearError } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password')}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
};

describe('AuthContext', () => {
  const { apiService } = require('../../services/api');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test('provides initial state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('handles successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockToken = 'mock-token';
    
    apiService.login.mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
    expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  test('handles login error', async () => {
    apiService.login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  test('handles successful registration', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockToken = 'mock-token';
    
    apiService.register.mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    act(() => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
    expect(apiService.register).toHaveBeenCalledWith('test@example.com', 'password');
  });

  test('handles logout', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    
    // Start with authenticated user
    apiService.login.mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login first
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    // Now logout
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(apiService.logout).toHaveBeenCalled();
  });

  test('clears error', async () => {
    apiService.login.mockRejectedValue(new Error('Test error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Trigger error
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });

    // Clear error
    act(() => {
      screen.getByText('Clear Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('checks existing session on mount', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockToken = 'existing-token';
    
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    apiService.verifyToken.mockResolvedValue({ user: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(apiService.verifyToken).toHaveBeenCalled();
  });
});