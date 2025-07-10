import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

// Define mock user and session for tests
const mockUser = { 
  id: 'user-id', 
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  role: 'authenticated',
  identities: []
};

const mockSession = { 
  user: mockUser, 
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  expires_at: 9999999999
};

// Mock the Supabase client
vi.mock('../../services/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signInWithOAuth: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => {
          return {
            data: {
              subscription: {
                unsubscribe: vi.fn()
              }
            }
          };
        })
      }
    }
  };
});

// Test component that uses the auth context
const TestComponent = () => {
  const { 
    user, 
    loading, 
    signIn, 
    signUp, 
    signOut, 
    signInWithGoogle, 
    resetPassword, 
    confirmPasswordReset 
  } = useAuth();

  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user-state">{user ? `User: ${user.email}` : 'No User'}</div>
      <button data-testid="sign-in" onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button data-testid="sign-up" onClick={() => signUp('test@example.com', 'password', 'Test', 'User')}>Sign Up</button>
      <button data-testid="sign-out" onClick={() => signOut()}>Sign Out</button>
      <button data-testid="sign-in-google" onClick={() => signInWithGoogle()}>Sign In with Google</button>
      <button data-testid="reset-password" onClick={() => resetPassword('test@example.com')}>Reset Password</button>
      <button data-testid="confirm-reset" onClick={() => confirmPasswordReset('newpassword')}>Confirm Reset</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    // Mock getSession to delay response
    vi.mocked(supabase.auth.getSession).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { session: null }, error: null }), 100))
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading-state').textContent).toBe('Loading');
  });

  it('should set user when session exists', async () => {
    // Use the mock session data defined at the top level
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the auth state to update
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not Loading');
    });
    
    expect(screen.getByTestId('user-state').textContent).toBe(`User: ${mockUser.email}`);
  });

  it('should call signIn method correctly', async () => {
    // Mock successful sign in
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ 
      data: { 
        user: mockUser, 
        session: mockSession 
      }, 
      error: null 
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click the sign in button
    await userEvent.click(screen.getByTestId('sign-in'));

    // Verify the signIn method was called with correct parameters
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });

  it('should call signUp method correctly', async () => {
    // Mock successful sign up
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ 
      data: { 
        user: mockUser, 
        session: mockSession 
      }, 
      error: null 
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click the sign up button
    await userEvent.click(screen.getByTestId('sign-up'));

    // Verify the signUp method was called with correct parameters
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          phone_number: undefined
        }
      }
    });
  });

  it('should call signOut method correctly', async () => {
    // Mock successful sign out
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click the sign out button
    await userEvent.click(screen.getByTestId('sign-out'));

    // Verify the signOut method was called
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should call resetPassword method correctly', async () => {
    // Mock successful password reset
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click the reset password button
    await userEvent.click(screen.getByTestId('reset-password'));

    // Verify the resetPassword method was called with correct parameters
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/reset-password')
      })
    );
  });

  it('should call confirmPasswordReset method correctly', async () => {
    // Mock successful password update
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: { user: mockUser }, error: null });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click the confirm reset button
    await userEvent.click(screen.getByTestId('confirm-reset'));

    // Verify the updateUser method was called with correct parameters
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: 'newpassword'
    });
  });
});
