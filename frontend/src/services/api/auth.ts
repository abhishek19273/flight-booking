import axios from 'axios';
import { API_BASE_URL } from './config';

// Configure axios instance for auth endpoints
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests that require authentication
authApi.interceptors.request.use((config) => {
  // Only add token for endpoints that require authentication
  if (config.url !== '/login' && config.url !== '/register' && config.url !== '/refresh') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_at: number;
  refresh_token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  created_at: string;
}

/**
 * Login with email and password
 * @param credentials User login credentials
 * @returns Token data
 */
export const login = async (credentials: LoginCredentials): Promise<TokenResponse> => {
  try {
    const response = await authApi.post('/login', credentials);
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    
    return response.data;
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

/**
 * Register a new user
 * @param userData User registration data
 * @returns User profile data
 */
export const register = async (userData: RegisterData): Promise<UserProfile> => {
  try {
    const response = await authApi.post('/register', userData);
    return response.data;
  } catch (error: any) {
    console.error('Registration error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await authApi.post('/logout', { token });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage, even if the API call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

/**
 * Get the currently authenticated user's profile
 * @returns User profile or null if not authenticated
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    const response = await authApi.get('/me');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        try {
          const retryResponse = await authApi.get('/me');
          return retryResponse.data;
        } catch (retryError) {
          console.error('Error getting user profile after token refresh:', retryError);
          return null;
        }
      }
    }
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Refresh the access token using the refresh token
 * @returns Whether the refresh was successful
 */
export const refreshToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  
  try {
    const response = await authApi.post('/refresh', { refresh_token: refreshToken });
    
    // Update tokens in localStorage
    localStorage.setItem('accessToken', response.data.access_token);
    localStorage.setItem('refreshToken', response.data.refresh_token);
    
    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens if refresh fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
};
