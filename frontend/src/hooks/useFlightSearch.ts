import { useState } from 'react';
import { 
  FlightSearchParams as SearchParams, 
  FlightWithDetails,
  CabinClass,
  Flight
} from '../types';
import { searchFlights as apiSearchFlights, getFlightById, subscribeToFlightUpdates } from '../services/api/flights';
import IndexedDBService from '../services/indexedDBService';

// Define filter and sorting types
export interface FlightFilters {
  minPrice?: number;
  maxPrice?: number;
  airlineId?: string;
}

export interface FlightSorting {
  sortBy?: 'price' | 'duration' | 'departure_time' | 'arrival_time';
  sortOrder?: 'asc' | 'desc';
}

// Use the imported type with a local alias
export interface FlightSearchParams extends SearchParams {}
export type { FlightWithDetails };

export const useFlightSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (
    params: FlightSearchParams,
    filters?: FlightFilters,
    sorting?: FlightSorting
  ): Promise<FlightWithDetails[]> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get data from API if online
      if (navigator.onLine) {
        const results = await apiSearchFlights(params, filters, sorting);
        
        // Cache results in IndexedDB for offline use
        await IndexedDBService.saveFlights(results);
        
        return results;
      } else {
        // Fall back to cached data if offline
        let cachedFlights = await IndexedDBService.getFlightsByRoute(
          params.from.toUpperCase(),
          params.to.toUpperCase()
        ) as FlightWithDetails[];
        
        if (cachedFlights.length === 0) {
          throw new Error('No cached flight data available while offline');
        }
        
        // Apply filters and sorting to cached results
        cachedFlights = filterCachedFlights(cachedFlights, params, filters);
        cachedFlights = sortCachedFlights(cachedFlights, params, sorting);
        
        return cachedFlights;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching flights';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to filter cached flights
  const filterCachedFlights = (
    flights: FlightWithDetails[],
    params: FlightSearchParams,
    filters?: FlightFilters
  ): FlightWithDetails[] => {
    if (!filters) return flights;
    
    return flights.filter(flight => {
      const price = getPrice(flight, params.cabinClass);
      const availableSeats = getAvailableSeats(flight, params.cabinClass);
      const totalPassengers = params.passengers.adults + params.passengers.children;
      
      // Filter by price range
      if (filters.minPrice !== undefined && price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
      
      // Filter by airline
      if (filters.airlineId && flight.airline_id !== filters.airlineId) return false;
      
      // Filter by seat availability
      if (availableSeats < totalPassengers) return false;
      
      return true;
    });
  };
  
  // Helper function to sort cached flights
  const sortCachedFlights = (
    flights: FlightWithDetails[],
    params: FlightSearchParams,
    sorting?: FlightSorting
  ): FlightWithDetails[] => {
    if (!sorting || !sorting.sortBy) return flights;
    
    return [...flights].sort((a, b) => {
      const multiplier = sorting.sortOrder === 'desc' ? -1 : 1;
      
      switch (sorting.sortBy) {
        case 'price':
          return multiplier * (getPrice(a, params.cabinClass) - getPrice(b, params.cabinClass));
        case 'duration':
          return multiplier * (a.duration_minutes - b.duration_minutes);
        case 'departure_time':
          return multiplier * (new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
        case 'arrival_time':
          return multiplier * (new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime());
        default:
          return 0;
      }
    });
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