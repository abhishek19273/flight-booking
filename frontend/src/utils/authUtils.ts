import { supabase } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';

/**
 * Utility functions for Supabase Auth
 */

/**
 * Check if the current session is valid
 * @returns boolean indicating if session is valid
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!data.session;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * Get user metadata in a structured format
 * @param user Supabase User object
 * @returns Formatted user metadata
 */
export const getUserMetadata = (user: User | null) => {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    firstName: user.user_metadata?.first_name || '',
    lastName: user.user_metadata?.last_name || '',
    phoneNumber: user.user_metadata?.phone_number || '',
    role: user.user_metadata?.role || 'user',
    isEmailVerified: user.email_confirmed_at ? true : false,
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at,
  };
};

/**
 * Format JWT token expiration time
 * @param expiresAt Expiration timestamp
 * @returns Formatted time string
 */
export const formatTokenExpiration = (expiresAt: number | null): string => {
  if (!expiresAt) return 'Unknown';
  
  const expirationDate = new Date(expiresAt * 1000);
  const now = new Date();
  
  // Calculate time difference in minutes
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 0) return 'Expired';
  if (diffMins < 60) return `${diffMins} minutes`;
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  return `${hours}h ${mins}m`;
};

/**
 * Check if a user has a specific role
 * @param user Supabase User object
 * @param requiredRole Role to check for
 * @returns boolean indicating if user has the required role
 */
export const hasRole = (user: User | null, requiredRole: string): boolean => {
  if (!user) return false;
  
  const userRole = user.user_metadata?.role || 'user';
  
  // Admin has access to everything
  if (userRole === 'admin') return true;
  
  // Check for specific role
  return userRole === requiredRole;
};

/**
 * Debug helper to log current auth state
 */
export const debugAuthState = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();
    
    console.group('🔐 Auth Debug Info');
    console.log('User:', userData?.user ? getUserMetadata(userData.user) : 'Not signed in');
    console.log('Session:', sessionData?.session ? {
      accessToken: `${sessionData.session.access_token.substring(0, 10)}...`,
      refreshToken: sessionData.session.refresh_token ? `${sessionData.session.refresh_token.substring(0, 5)}...` : 'None',
      expiresIn: formatTokenExpiration(sessionData.session.expires_at)
    } : 'No active session');
    console.groupEnd();
    
    return {
      user: userData?.user,
      session: sessionData?.session
    };
  } catch (error) {
    console.error('Auth debug error:', error);
    return { user: null, session: null };
  }
};
