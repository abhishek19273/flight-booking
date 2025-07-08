import { useState, useCallback } from 'react';
import { searchAirports } from '@/services/api/flights';
import { MockFlightApi, USE_MOCK_API } from '@/services/mockFlightApi';

import type { Airport } from '@/types';

export const useAirportSearch = () => {
  const [loading, setLoading] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);

  const searchAirports = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setAirports([]);
      return;
    }

    setLoading(true);
    try {
      if (USE_MOCK_API) {
        // Use mock API for development
        const results = await MockFlightApi.searchAirports(query);
        setAirports(results);
      } else {
        // Use real API client
        try {
          const results = await searchAirports(query);
          // Ensure we have an array to set
          setAirports(Array.isArray(results) ? results : []);
        } catch (error) {
          console.error('Airport search error:', error);
          setAirports([]);
        }
      }
    } catch (error) {
      console.error('Airport search failed:', error);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    airports,
    loading,
    searchAirports
  };
};