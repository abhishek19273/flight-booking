import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Supabase client
vi.mock('../services/supabaseClient', () => ({
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
      onAuthStateChange: vi.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      }),
    },
  },
}));

// Create MSW server for API mocking
export const server = setupServer(
  // Define handlers for API endpoints
  http.get('/api/users/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Mock successful response for valid token
    if (authHeader === 'Bearer valid.token.here') {
      return HttpResponse.json({
        id: 'test-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      });
    }
    
    // Mock unauthorized response for invalid token
    return HttpResponse.json(
      { detail: 'Invalid authentication token' },
      { status: 401 }
    );
  }),
  
  http.get('/api/admin/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Mock successful response for admin token
    if (authHeader === 'Bearer valid.admin.token') {
      return HttpResponse.json([
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' }
      ]);
    }
    
    // Mock forbidden response for non-admin token
    return HttpResponse.json(
      { detail: 'Not authorized to access this resource' },
      { status: 403 }
    );
  })
);

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
