import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock the auth context
vi.mock('../../contexts/AuthContext', () => {
  const actual = vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn()
  };
});

// Mock protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  if (!user) {
    return <div data-testid="unauthorized">Unauthorized</div>;
  }
  
  return <>{children}</>;
};

// Test component
const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should show loading state when auth is loading', () => {
    // Mock loading state
    vi.mocked(useAuth).mockReturnValue({
      loading: true,
      user: null
    } as any);
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  it('should show unauthorized when user is not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: null
    } as any);
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  it('should render protected content when user is authenticated', () => {
    // Mock authenticated state
    vi.mocked(useAuth).mockReturnValue({
      loading: false,
      user: { id: 'user-id', email: 'test@example.com' }
    } as any);
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <ProtectedComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument();
  });
});
