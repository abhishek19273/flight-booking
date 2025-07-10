# Supabase Auth Implementation Guide - Frontend

This guide provides detailed instructions for implementing Supabase Auth in the Sky-Bound Journeys frontend application.

## 1. Project Setup

### Install Required Dependencies

```bash
npm install @supabase/supabase-js
```

### Configure Environment Variables

Create a `.env` file in the root of your frontend project:

```
REACT_APP_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 2. Supabase Client Setup

Create a file `src/services/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 3. Auth Context Implementation

Create a file `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (data: { email: string; password: string; }) => Promise<any>;
  signIn: (data: { email: string; password: string; }) => Promise<any>;
  signOut: () => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    signUp: (data: { email: string; password: string; }) => 
      supabase.auth.signUp(data),
    signIn: (data: { email: string; password: string; }) => 
      supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 4. Update API Client to Include Auth Headers

Update `src/services/api/apiClient.ts`:

```typescript
import axios from 'axios';
import { supabase } from '../supabaseClient';

export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

// Add a request interceptor to attach the JWT to every request
axiosInstance.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});
```

## 5. Update Auth Service

Update `src/services/authService.ts`:

```typescript
import { supabase } from './supabaseClient';

export const authService = {
  // Register a new user
  register: async (userData: { 
    first_name: string; 
    last_name: string; 
    email: string; 
    password: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        }
      }
    });
    
    if (error) throw error;
    return data;
  },
  
  // Log in a user
  login: async (credentials: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (error) throw error;
    return data;
  },
  
  // Log out the current user
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  // Get the current user
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  
  // Request password reset
  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  
  // Update password with reset token
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
  },
  
  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    
    if (error) throw error;
    return data;
  },
};
```

## 6. Create Protected Route Component

Create a file `src/components/ProtectedRoute.tsx`:

```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
```

## 7. Update App Component to Use Auth Provider

Update `src/App.tsx` or `src/main.tsx`:

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import FlightSearchPage from './pages/FlightSearchPage';
import BookingPage from './pages/BookingPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/flights/search" element={<FlightSearchPage />} />
            <Route path="/booking" element={<BookingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

## 8. Example Login Component

Update `src/pages/LoginPage.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Redirect happens automatically after successful OAuth
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div className="social-login">
        <button onClick={handleGoogleSignIn} className="google-button">
          Sign in with Google
        </button>
      </div>
      <p>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
};

export default LoginPage;
```

This implementation guide provides a comprehensive approach to integrating Supabase Auth in your React frontend, following the architecture described in your requirements.
