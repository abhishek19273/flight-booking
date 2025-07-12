import { axiosInstance } from './apiClient';

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
        const response = await axiosInstance.post('/auth/login', credentials);
    
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
        const response = await axiosInstance.post('/auth/register', userData);
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
            await axiosInstance.post('/auth/logout', { token });
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
        const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        try {
                  const retryResponse = await axiosInstance.get('/auth/me');
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
        const response = await axiosInstance.post('/auth/refresh', { refresh_token: refreshToken });
    
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
