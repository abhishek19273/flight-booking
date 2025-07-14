import { axiosInstance } from './apiClient';
import { FlightWithDetails, Airport, FlightSearchParams } from '../../types';

/**
 * Search for flights based on search parameters
 * @param params Search parameters
 * @param filters Optional filtering parameters
 * @param sorting Optional sorting parameters
 * @returns List of flights matching search criteria
 */
export const searchFlights = async (
  params: FlightSearchParams,
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    airlineId?: string;
  },
  sorting?: {
    sortBy?: 'price' | 'duration' | 'departure_time' | 'arrival_time';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<FlightWithDetails[]> => {
  try {
    // Manually construct query params to match backend expectations (snake_case, flat structure)
    const queryParams = {
      from_code: params.from,
      to_code: params.to,
      departure_date: new Date(params.departureDate).toISOString().split('T')[0],
      cabin_class: params.cabinClass,
      adults: params.passengers.adults,
      children: params.passengers.children,
      infants: params.passengers.infants,
      trip_type: params.tripType,
      // Add return date if it exists
      ...(params.returnDate && { return_date: new Date(params.returnDate).toISOString().split('T')[0] }),
      // Add filters if they exist
      ...(filters?.minPrice !== undefined && { min_price: filters.minPrice }),
      ...(filters?.maxPrice !== undefined && { max_price: filters.maxPrice }),
      ...(filters?.airlineId && { airline_id: filters.airlineId }),
      // Add sorting if it exists
      ...(sorting?.sortBy && { sort_by: sorting.sortBy }),
      ...(sorting?.sortOrder && { sort_order: sorting.sortOrder }),
    };

    const response = await axiosInstance.get('/flights/search', { params: queryParams });
    return response.data;
  } catch (error: any) {
    console.error('Error searching flights:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to search flights');
  }
};

/**
 * Get a flight by ID with all details
 * @param flightId The flight ID
 * @returns The flight with all details
 */
export const getFlightById = async (flightId: string): Promise<FlightWithDetails> => {
  try {
        const response = await axiosInstance.get(`/flights/${flightId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching flight:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch flight');
  }
};

/**
 * Search for airports based on search term
 * @param searchTerm Search term for airport name, city, or IATA code
 * @returns List of airports matching the search term
 */
export const searchAirports = async (searchTerm: string): Promise<Airport[]> => {
  try {
        const response = await axiosInstance.get('/flights/airports/search', { 
      params: { 
        term: searchTerm 
      } 
    });
    return response.data;
  } catch (error: any) {
    console.error('Error searching airports:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to search airports');
  }
};

/**
 * Get live flight status updates
 * @param flightId The flight ID
 * @returns The current flight status
 */
const getFlightStatus = async (flightId: string): Promise<any> => {
  try {
        const response = await axiosInstance.get(`/flights/${flightId}/status`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching flight status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch flight status');
  }
};

/**
 * Subscribe to real-time flight updates using SSE
 * @param callback Function to call when updates are received
 * @returns Cleanup function to close the SSE connection
 */
export const subscribeToFlightUpdates = (callback: (data: any) => void): () => void => {
    const eventSource = new EventSource(`${axiosInstance.defaults.baseURL}/flights/updates/stream`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (error) {
      console.error('Error parsing flight update:', error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('Error with flight updates stream:', error);
    eventSource.close();
  };
  
  // Return cleanup function
  return () => {
    eventSource.close();
  };
};
