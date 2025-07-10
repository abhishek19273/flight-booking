import axios from 'axios';
import { API_BASE_URL } from './config';
import { supabase } from '../supabaseClient';

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get the current session from Supabase
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the session with Supabase
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) throw refreshError;
        
        if (data?.session?.access_token) {
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
          
          // Retry the original request
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth';
      }
    }
    
    return Promise.reject(error);
  }
);
