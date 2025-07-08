import axios from 'axios';
import { API_BASE_URL } from './config';
import { Booking, CreateBookingData, BookingDetail } from '../../types';

// Configure axios instance for bookings endpoints
const bookingsApi = axios.create({
  baseURL: `${API_BASE_URL}/bookings`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
bookingsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Create a new booking
 * @param bookingData The booking data
 * @returns The created booking with details
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<BookingDetail> => {
  try {
    const response = await bookingsApi.post('', bookingData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create booking');
  }
};

/**
 * Get a booking by ID
 * @param bookingId The booking ID
 * @returns The booking with all details
 */
export const getBookingById = async (bookingId: string): Promise<BookingDetail> => {
  try {
    const response = await bookingsApi.get(`/${bookingId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch booking');
  }
};

/**
 * Get all bookings for the current user
 * @returns List of user bookings
 */
const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await bookingsApi.get('/user');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching user bookings:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch bookings');
  }
};

/**
 * Cancel a booking
 * @param bookingId The booking ID to cancel
 * @returns Confirmation message
 */
const cancelBooking = async (bookingId: string): Promise<{message: string}> => {
  try {
    const response = await bookingsApi.post(`/${bookingId}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error('Error cancelling booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to cancel booking');
  }
};

/**
 * Generate a unique booking reference
 * @returns A unique booking reference code
 */
export const generateBookingReference = async (): Promise<string> => {
  try {
    const response = await bookingsApi.get('/reference/generate');
    return response.data.booking_reference;
  } catch (error: any) {
    console.error('Error generating booking reference:', error.response?.data || error.message);
    throw new Error('Failed to generate booking reference');
  }
};
