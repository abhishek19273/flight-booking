import { axiosInstance } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_at: number;
  refresh_token: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  created_at: string;
}

const AuthService = {
  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<User> => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },
  
  /**
   * Login a user
   */
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    const data = response.data;
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  },
  
  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await axiosInstance.post('/auth/logout', { token });
      } catch (error) {
        console.error('Logout error', error);
      }
    }
    
    // Always clear local storage on logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  /**
   * Check if the user is logged in
   */
  isLoggedIn: (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },
  
  /**
   * Refresh the access token using the refresh token
   */
  refreshToken: async (): Promise<TokenResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axiosInstance.post('/auth/refresh', { refresh_token: refreshToken });
    const data = response.data;
    
    // Store new tokens
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data;
  }
};

export default AuthService;
