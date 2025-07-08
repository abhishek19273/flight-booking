import { axiosInstance } from './apiClient';
import { 
  Flight, 
  Airport, 
  FlightSearchParams, 
  FlightWithDetails,
  FlightAvailability,
  CabinClass
} from '../../types';

const FlightService = {
  /**
   * Search for flights based on search parameters
   */
  searchFlights: async (params: FlightSearchParams): Promise<FlightWithDetails[]> => {
    const response = await axiosInstance.post('/flights/search', {
      from_code: params.from,
      to_code: params.to,
      departure_date: params.departureDate,
      return_date: params.returnDate,
      cabin_class: params.cabinClass,
      passengers: params.passengers
    });
    
    return response.data;
  },
  
  /**
   * Get detailed information about a specific flight
   */
  getFlightDetails: async (flightId: string): Promise<FlightWithDetails> => {
    const response = await axiosInstance.get(`/flights/${flightId}`);
    return response.data;
  },
  
  /**
   * Get seat availability for a specific flight
   */
  getFlightAvailability: async (flightId: string, cabinClass?: CabinClass): Promise<FlightAvailability> => {
    const url = cabinClass 
      ? `/flights/${flightId}/availability?cabin_class=${cabinClass}`
      : `/flights/${flightId}/availability`;
      
    const response = await axiosInstance.get(url);
    return response.data;
  },
  
  /**
   * Search for airports by query string
   */
  searchAirports: async (query: string, limit = 10): Promise<Airport[]> => {
    const response = await axiosInstance.get(`/airports?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },
  
  /**
   * Get all airports for caching
   */
  getAllAirports: async (): Promise<Airport[]> => {
    const response = await axiosInstance.get('/airports/cache');
    return response.data;
  },
  
  /**
   * Setup SSE connection for real-time flight status updates
   */
  subscribeToFlightStatus: (flightId: string, onStatusUpdate: (data: any) => void): () => void => {
    const eventSource = new EventSource(`${axiosInstance.defaults.baseURL}/flights/${flightId}/status`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onStatusUpdate(data);
    };
    
    eventSource.onerror = (error) => {
      console.error('Flight status SSE error:', error);
      eventSource.close();
    };
    
    // Return a function to close the connection
    return () => {
      eventSource.close();
    };
  }
};

export default FlightService;
