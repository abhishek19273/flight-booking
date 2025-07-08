import { axiosInstance } from './apiClient';
import { Booking, BookingCreate, BookingUpdate, BookingDetails } from '../../types';

const BookingService = {
  /**
   * Create a new booking
   */
  createBooking: async (bookingData: BookingCreate): Promise<Booking> => {
    const response = await axiosInstance.post('/bookings', bookingData);
    return response.data;
  },
  
  /**
   * Get detailed information about a specific booking
   */
  getBookingDetails: async (bookingId: string): Promise<BookingDetails> => {
    const response = await axiosInstance.get(`/bookings/${bookingId}`);
    return response.data;
  },
  
  /**
   * Update a booking (e.g., cancel it)
   */
  updateBooking: async (bookingId: string, updateData: BookingUpdate): Promise<Booking> => {
    const response = await axiosInstance.put(`/bookings/${bookingId}`, updateData);
    return response.data;
  },
  
  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string): Promise<{message: string}> => {
    const response = await axiosInstance.delete(`/bookings/${bookingId}`);
    return response.data;
  },
  
  /**
   * Process payment for a booking
   */
  processPayment: async (bookingId: string, paymentData: any): Promise<any> => {
    const response = await axiosInstance.post('/payments', {
      booking_id: bookingId,
      ...paymentData
    });
    return response.data;
  },
  
  /**
   * Get payment details
   */
  getPaymentDetails: async (paymentId: string): Promise<any> => {
    const response = await axiosInstance.get(`/payments/${paymentId}`);
    return response.data;
  }
};

export default BookingService;
