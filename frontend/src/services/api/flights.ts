import { axiosInstance } from './apiClient';
import { FlightWithDetails, Airport, FlightSearchParams } from '../../types';

/**
 * Search for flights based on search parameters
 * @param params Search parameters - can be either FlightSearchParams or a direct API params object
 * @returns List of flights matching search criteria
 */
export const searchFlights = async (params: any): Promise<FlightWithDetails[]> => {
  try {
    console.log('searchFlights received params:', JSON.stringify(params, null, 2));
    
    // Create a clean object for query parameters that match backend expectations
    const queryParams: Record<string, any> = {};
    
    // REQUIRED PARAMETERS - Backend API expects from_code and to_code
    
    // Origin and destination (required) - check both camelCase and snake_case formats
    const fromValue = params.from || params.from_code;
    if (!fromValue) {
      console.error('Missing origin airport parameter in:', params);
      throw new Error('Missing required parameter: origin airport');
    }
    queryParams.from_code = fromValue;
    console.log('Set from_code to:', queryParams.from_code);
    
    const toValue = params.to || params.to_code;
    if (!toValue) {
      console.error('Missing destination airport parameter in:', params);
      throw new Error('Missing required parameter: destination airport');
    }
    queryParams.to_code = toValue;
    console.log('Set to_code to:', queryParams.to_code);
    
    console.log('Using airport codes:', queryParams.from_code, queryParams.to_code);
    
    // Trip type (required)
    queryParams.trip_type = params.tripType || 'one-way';
    
    // Cabin class (required) - check both camelCase and snake_case formats
    const cabinClassValue = params.cabinClass || params.cabin_class || 'economy';
    queryParams.cabin_class = cabinClassValue;
    console.log('Set cabin_class to:', queryParams.cabin_class);
    
    // Passenger counts (required)
    queryParams.adults = params.passengers?.adults || 1;
    queryParams.children = params.passengers?.children || 0;
    queryParams.infants = params.passengers?.infants || 0;
    
    // Departure date (required) - check both camelCase and snake_case formats
    const departureDateValue = params.departureDate || params.departure_date;
    if (!departureDateValue) {
      console.error('Missing departure date in params:', params);
      throw new Error('Missing required parameter: departure date');
    }
    
    try {
      const departureDate = new Date(departureDateValue);
      if (!isNaN(departureDate.getTime())) {
        queryParams.departure_date = departureDate.toISOString().split('T')[0];
        console.log('Set departure_date to:', queryParams.departure_date);
      } else {
        console.warn('Invalid departure date format:', departureDateValue);
        queryParams.departure_date = new Date().toISOString().split('T')[0];
        console.log('Using fallback departure_date:', queryParams.departure_date);
      }
    } catch (e) {
      console.error('Error parsing departure date:', e);
      queryParams.departure_date = new Date().toISOString().split('T')[0];
      console.log('Error handling departure date, using current date:', queryParams.departure_date);
    }
    
    // Return date (required for round-trip) - check both camelCase and snake_case formats
    if (params.tripType === 'round-trip' || params.trip_type === 'round-trip') {
      const returnDateValue = params.returnDate || params.return_date;
      
      if (!returnDateValue) {
        console.warn('Round-trip selected but no return date provided');
        // Default to departure date + 7 days
        try {
          const fallbackDate = new Date(queryParams.departure_date);
          fallbackDate.setDate(fallbackDate.getDate() + 7);
          queryParams.return_date = fallbackDate.toISOString().split('T')[0];
          console.log('Using fallback return_date (departure + 7 days):', queryParams.return_date);
        } catch (e) {
          console.error('Error creating fallback return date:', e);
          const today = new Date();
          today.setDate(today.getDate() + 7);
          queryParams.return_date = today.toISOString().split('T')[0];
          console.log('Using today + 7 days as return_date:', queryParams.return_date);
        }
      } else {
        try {
          const returnDate = new Date(returnDateValue);
          if (!isNaN(returnDate.getTime())) {
            queryParams.return_date = returnDate.toISOString().split('T')[0];
            console.log('Set return_date to:', queryParams.return_date);
          } else {
            console.warn('Invalid return date format:', returnDateValue);
            // Default to departure date + 7 days
            const fallbackDate = new Date(queryParams.departure_date);
            fallbackDate.setDate(fallbackDate.getDate() + 7);
            queryParams.return_date = fallbackDate.toISOString().split('T')[0];
            console.log('Using fallback return_date (departure + 7 days):', queryParams.return_date);
          }
        } catch (e) {
          console.error('Error with return date, using departure + 7 days:', e);
          const fallbackDate = new Date(queryParams.departure_date);
          fallbackDate.setDate(fallbackDate.getDate() + 7);
          queryParams.return_date = fallbackDate.toISOString().split('T')[0];
          console.log('Error handling return date, using departure + 7 days:', queryParams.return_date);
        }
      }
    }
    
    // Add filtering and sorting parameters if provided
    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.sortOrder) queryParams.sort_order = params.sortOrder;
    if (params.minPrice) queryParams.min_price = params.minPrice;
    if (params.maxPrice) queryParams.max_price = params.maxPrice;
    if (params.airlineCode) queryParams.airline_code = params.airlineCode;
    if (params.maxDuration) queryParams.max_duration = params.maxDuration;

    // Log the final query parameters for debugging
    console.log('Flight search API query parameters:', queryParams);
    console.log('API URL:', `${axiosInstance.defaults.baseURL}/flights/search`);
    
    // Ensure all required parameters are included - backend expects these exact parameter names
    const requiredParams = ['from_code', 'to_code', 'departure_date', 'cabin_class', 'adults'];
    const missingParams = requiredParams.filter(param => queryParams[param] === undefined);
    
    if (missingParams.length > 0) {
      console.error('Missing required parameters:', missingParams);
      console.error('Current query parameters:', queryParams);
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    // Double-check that from_code and to_code are set
    if (!queryParams.from_code) {
      console.error('from_code is missing or empty');
      throw new Error('Missing required parameter: from_code');
    }
    
    if (!queryParams.to_code) {
      console.error('to_code is missing or empty');
      throw new Error('Missing required parameter: to_code');
    }
    
    // Add detailed logging for debugging
    console.log('Final API request parameters:', JSON.stringify(queryParams, null, 2));
    
    // Make the API call
    const response = await axiosInstance.get('/flights/search', { params: queryParams });
    console.log('Flight search successful, found', response.data.length, 'flights');
    return response.data;
  } catch (error: any) {
    // Enhanced error handling for API validation errors (422 status)
    if (error.response && error.response.status === 422) {
      console.error('Flight search validation error:', error.response.data);
      
      // Try to extract validation error details
      const validationErrors = error.response.data.detail || [];
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((err: any) => `${err.loc.join('.')} - ${err.msg}`)
          .join(', ');
        throw new Error(`Flight search validation failed: ${errorMessages}`);
      } else if (typeof error.response.data === 'object') {
        // Handle case where error detail is an object
        const errorMessage = JSON.stringify(error.response.data);
        throw new Error(`Flight search validation failed: ${errorMessage}`);
      }
    } else if (error.response) {
      // Handle other HTTP errors
      console.error(`Flight search failed with status ${error.response.status}:`, error.response.data);
      throw new Error(`Flight search failed: ${error.response.statusText || 'Server error'}`);
    } else if (error.request) {
      // Handle network errors
      console.error('Flight search network error - no response received:', error.request);
      throw new Error('Network error: Could not connect to flight search service');
    }
    
    // Handle other errors
    throw new Error(error.response?.data?.detail || error.message || 'Failed to search flights');
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
