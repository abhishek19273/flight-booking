import { useState } from 'react';
import { 
  FlightSearchParams as SearchParams, 
  FlightWithDetails,
  CabinClass,
  Flight
} from '../types';
import { searchFlights as apiSearchFlights, getFlightById, subscribeToFlightUpdates } from '../services/api/flights';
import IndexedDBService from '../services/indexedDBService';

// Use the imported type with a local alias
export interface FlightSearchParams extends SearchParams {}
export type { FlightWithDetails };

export const useFlightSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (params: FlightSearchParams): Promise<FlightWithDetails[]> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get data from API if online
      if (navigator.onLine) {
        console.log('Searching flights online with params:', params);
        
        // Prepare API search parameters with filtering and sorting options
        // Backend API expects from_code and to_code parameters
        const apiParams: any = {
          // Only use the parameter names expected by the backend API
          from_code: params.from,
          to_code: params.to,
          cabin_class: params.cabinClass,
          adults: params.passengers.adults,
          children: params.passengers.children || 0,
          infants: params.passengers.infants || 0,
          trip_type: params.tripType || 'one-way',
        };
        
        // Log the parameters for debugging
        console.log('API params prepared for backend:', apiParams);

        // Always include departure_date as it's required
        try {
          if (params.departureDate) {
            const departureDate = new Date(params.departureDate);
            if (!isNaN(departureDate.getTime())) {
              apiParams.departure_date = departureDate.toISOString().split('T')[0];
              console.log('Set departure_date to:', apiParams.departure_date);
            } else {
              console.warn('Invalid departure date format:', params.departureDate);
              // Use current date as fallback
              apiParams.departure_date = new Date().toISOString().split('T')[0];
              console.log('Using fallback departure_date:', apiParams.departure_date);
            }
          } else {
            // If no departure date provided, use current date
            apiParams.departure_date = new Date().toISOString().split('T')[0];
            console.log('No departure date provided, using current date:', apiParams.departure_date);
          }
        } catch (e) {
          console.error('Error parsing departure date:', e);
          apiParams.departure_date = new Date().toISOString().split('T')[0];
          console.log('Error handling departure date, using current date:', apiParams.departure_date);
        }
        
        // Add return date for round trips
        if (params.tripType === 'round-trip') {
          try {
            if (params.returnDate) {
              const returnDate = new Date(params.returnDate);
              if (!isNaN(returnDate.getTime())) {
                apiParams.return_date = returnDate.toISOString().split('T')[0];
              } else {
                console.warn('Invalid return date format:', params.returnDate);
                // For invalid return dates, use departure date + 7 days as fallback
                const fallbackDate = new Date(apiParams.departure_date);
                fallbackDate.setDate(fallbackDate.getDate() + 7);
                apiParams.return_date = fallbackDate.toISOString().split('T')[0];
              }
            } else {
              // If no return date provided for round-trip, use departure date + 7 days
              console.warn('Round-trip with no return date, using departure + 7 days');
              const fallbackDate = new Date(apiParams.departure_date);
              fallbackDate.setDate(fallbackDate.getDate() + 7);
              apiParams.return_date = fallbackDate.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error with return date, using departure + 7 days:', e);
            // Use departure date + 7 days as fallback
            const fallbackDate = new Date(apiParams.departure_date);
            fallbackDate.setDate(fallbackDate.getDate() + 7);
            apiParams.return_date = fallbackDate.toISOString().split('T')[0];
          }
        }

        // Add filtering and sorting parameters if provided
        if (params.sortBy) apiParams.sort_by = params.sortBy;
        if (params.sortOrder) apiParams.sort_order = params.sortOrder;
        if (params.minPrice) apiParams.min_price = params.minPrice;
        if (params.maxPrice) apiParams.max_price = params.maxPrice;
        if (params.airlineCode) apiParams.airline_code = params.airlineCode;
        if (params.maxDuration) apiParams.max_duration = params.maxDuration;

        console.log('Sending API request with params:', apiParams);
        console.log('API URL:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/flights/search`);
        
        try {
          // Make sure all required parameters are set in apiParams
          if (!apiParams.departure_date) {
            console.error('departure_date is missing in apiParams');
          }
          
          console.log('Calling API searchFlights with apiParams:', apiParams);
          // Pass apiParams directly to the API function instead of the original params
          const results = await apiSearchFlights(apiParams);
          console.log('API search successful, got results:', results.length);
          
          // Cache results in IndexedDB for offline use if we have results
          if (results && results.length > 0) {
            await IndexedDBService.saveFlights(results);
            console.log('Successfully cached', results.length, 'flights in IndexedDB');
          }
          
          return results;
        } catch (apiError) {
          console.error('API search failed:', apiError);
          console.error('API request failed with params:', JSON.stringify(apiParams));
          
          // Try to get from cache as fallback even when online if API fails
          console.log('Attempting to retrieve flights from IndexedDB cache...');
          const cachedFlights = await IndexedDBService.getFlightsByRoute(
            params.from.toUpperCase(),
            params.to.toUpperCase()
          );
          
          if (cachedFlights && cachedFlights.length > 0) {
            console.log('Using cached flights as fallback after API failure');
            // Ensure we're returning the expected FlightWithDetails[] type
            // This is a type assertion since we know the cached flights should have the required fields
            return cachedFlights as unknown as FlightWithDetails[];
          }
          
          // Re-throw the error if no cached data available
          throw apiError;
        }
      } else {
        // Fall back to cached data if offline
        const cachedFlights = await IndexedDBService.getFlightsByRoute(
          params.from.toUpperCase(),
          params.to.toUpperCase()
        );
        
        if (!cachedFlights || cachedFlights.length === 0) {
          throw new Error('No cached flight data available while offline');
        }
        
        console.log('Using cached flights while offline:', cachedFlights.length);
        // Ensure we're returning the expected FlightWithDetails[] type
        const flights = cachedFlights as unknown as FlightWithDetails[];
        
        // Apply basic filtering for offline mode
        let filteredFlights = flights;
        
        if (params.minPrice) {
          filteredFlights = filteredFlights.filter(flight => {
            const price = getPrice(flight, params.cabinClass);
            return price >= (params.minPrice || 0);
          });
        }
        
        if (params.maxPrice) {
          filteredFlights = filteredFlights.filter(flight => {
            const price = getPrice(flight, params.cabinClass);
            return price <= (params.maxPrice || Infinity);
          });
        }
        
        if (params.airlineCode) {
          filteredFlights = filteredFlights.filter(flight => 
            flight.airline.iata_code === params.airlineCode
          );
        }
        
        // Ensure we're returning the correct type
        return filteredFlights;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching flights';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSeats = (flight: Flight, cabinClass: CabinClass): number => {
    switch (cabinClass) {
      case 'economy':
        return flight.economy_available || 0;
      case 'premium-economy':
        return flight.premium_economy_available || 0;
      case 'business':
        return flight.business_available || 0;
      case 'first':
        return flight.first_available || 0;
      default:
        return 0;
    }
  };

  const getPrice = (flight: Flight, cabinClass: CabinClass): number => {
    switch (cabinClass) {
      case 'economy':
        return flight.economy_price || 0;
      case 'premium-economy':
        return flight.premium_economy_price || 0;
      case 'business':
        return flight.business_price || 0;
      case 'first':
        return flight.first_price || 0;
      default:
        return 0;
    }
  };

  // Get flight availability
  const getFlightAvailability = async (flightId: string, cabinClass?: CabinClass) => {
    setLoading(true);
    setError(null);
    
    try {
      if (navigator.onLine) {
        // Use getFlightById to get availability since we don't have a dedicated availability endpoint yet
        const flightDetails = await getFlightById(flightId);
        return {
          flight_id: flightDetails.id,
          economy_available: flightDetails.economy_available,
          premium_economy_available: flightDetails.premium_economy_available,
          business_available: flightDetails.business_available,
          first_available: flightDetails.first_available,
          updated_at: flightDetails.updated_at
        };
      } else {
        // Fall back to cached flight data
        const cachedFlights = await IndexedDBService.getFlightsByRoute('', ''); // Get all cached flights
        const flight = cachedFlights.find(f => f.id === flightId);
        
        if (!flight) {
          throw new Error('Flight not found in offline cache');
        }
        
        return {
          flight_id: flight.id,
          economy_available: flight.economy_available,
          premium_economy_available: flight.premium_economy_available,
          business_available: flight.business_available,
          first_available: flight.first_available,
          updated_at: flight.updated_at
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while checking availability';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time flight status updates using SSE
  const subscribeToFlightStatus = (flightId: string, onStatusUpdate: (data: any) => void) => {
    if (navigator.onLine) {
      // Subscribe to all flight updates and filter by flightId in the callback
      return subscribeToFlightUpdates((data) => {
        // Only process updates for the specific flight we're interested in
        if (data && data.flight_id === flightId) {
          onStatusUpdate(data);
        }
      });
    }
    return () => {}; // Return empty unsubscribe function if offline
  };

  return {
    searchFlights,
    getFlightAvailability,
    subscribeToFlightStatus,
    getPrice,
    loading,
    error
  };
};