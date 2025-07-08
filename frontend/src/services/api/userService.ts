import { axiosInstance } from './apiClient';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  zip_code?: string;
  preferences?: any;
  created_at: string;
  updated_at?: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  zip_code?: string;
  preferences?: any;
}

const UserService = {
  /**
   * Get the current user's profile
   */
  getCurrentUserProfile: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },
  
  /**
   * Update the current user's profile
   */
  updateProfile: async (profileData: UserProfileUpdate): Promise<UserProfile> => {
    const response = await axiosInstance.put('/users/me', profileData);
    return response.data;
  },
  
  /**
   * Get bookings for the current user
   */
  getUserBookings: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/users/me/bookings');
    return response.data;
  }
};

export default UserService;
