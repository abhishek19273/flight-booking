import { axiosInstance } from "./apiClient";
import {
  Booking,
  BookingDetails,
  BookingUpdate,
  CreateBookingData,
} from "../../types";

/**
 * Create a new booking
 * @param bookingData The data for the new booking
 * @returns The created booking object with details
 */
export const createBooking = async (
  bookingData: CreateBookingData
): Promise<BookingDetails> => {
  try {
    const response = await axiosInstance.post<BookingDetails>(
      "/bookings",
      bookingData
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create booking');
  }
};

/**
 * Get all bookings for the current user
 * @returns An array of booking objects with details
 */
export const getAllBookings = async (): Promise<BookingDetails[]> => {
  try {
    const response = await axiosInstance.get<BookingDetails[]>("/bookings");
    return response.data;
  } catch (error: any) {
    console.error('Error fetching bookings:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch bookings');
  }
};

/**
 * Get a single booking by its ID
 * @param bookingId The ID of the booking to retrieve
 * @returns The booking object with details
 */
export const getBookingById = async (bookingId: string): Promise<BookingDetails> => {
  try {
    const response = await axiosInstance.get<BookingDetails>(`/bookings/${bookingId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch booking');
  }
};

/**
 * Cancel a booking
 * @param bookingId The ID of the booking to cancel
 * @returns The updated booking object
 */
export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  try {
    const response = await axiosInstance.put<Booking>(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error('Error cancelling booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to cancel booking');
  }
};

/**
 * Update a booking
 * @param bookingId The booking ID to update
 * @param bookingData The updated booking data
 * @returns The updated booking object
 */
export const updateBooking = async (
  bookingId: string,
  bookingData: BookingUpdate
): Promise<BookingDetails> => {
  try {
    const response = await axiosInstance.put<BookingDetails>(
      `/bookings/${bookingId}`,
      bookingData
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating booking:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to update booking');
  }
};

/**
 * Generate a unique booking reference
 * @returns A unique booking reference code
 */
export const generateBookingReference = async (): Promise<string> => {
  try {
    const response = await axiosInstance.get<{ booking_reference: string }>(
      "/bookings/reference/generate"
    );
    return response.data.booking_reference;
  } catch (error: any) {
    console.error('Error generating booking reference:', error.response?.data || error.message);
    throw new Error('Failed to generate booking reference');
  }
};
