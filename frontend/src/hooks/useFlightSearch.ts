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

export const useFlightSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = async (params: FlightSearchParams): Promise<FlightWithDetails[]> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get data from API if online
      if (navigator.onLine) {
        const results = await apiSearchFlights(params);
        
        // Cache results in IndexedDB for offline use
        await IndexedDBService.saveFlights(results);
        
        return results;
      } else {
        // Fall back to cached data if offline
        const cachedFlights = await IndexedDBService.getFlightsByRoute(
          params.from.toUpperCase(),
          params.to.toUpperCase()
        );
        
        if (cachedFlights.length === 0) {
          throw new Error('No cached flight data available while offline');
        }
        
        // Ensure we're returning the correct type
        return cachedFlights as FlightWithDetails[];
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