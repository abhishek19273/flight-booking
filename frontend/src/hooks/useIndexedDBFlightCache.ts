import { useState, useEffect, useCallback } from 'react';
import { FlightWithDetails, FlightSearchParams } from '@/hooks/useFlightSearch';
import {
  saveFlightSearchResults,
  getCachedFlightSearchResults,
  clearExpiredCache,
  isOnline
} from '@/utils/indexedDBService';

interface UseIndexedDBFlightCacheResult {
  getCachedResults: (searchParams: FlightSearchParams) => Promise<FlightWithDetails[] | null>;
  saveResults: (searchParams: FlightSearchParams, results: FlightWithDetails[]) => Promise<void>;
  clearExpired: () => Promise<void>;
  isCacheAvailable: boolean;
  isOffline: boolean;
}

export const useIndexedDBFlightCache = (): UseIndexedDBFlightCacheResult => {
  const [isCacheAvailable, setIsCacheAvailable] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!isOnline());

  // Check if IndexedDB is available
  useEffect(() => {
    const checkIndexedDB = async () => {
      try {
        if ('indexedDB' in window) {
          setIsCacheAvailable(true);
        } else {
          setIsCacheAvailable(false);
          console.warn('IndexedDB is not available in this browser');
        }
      } catch (error) {
        setIsCacheAvailable(false);
        console.error('Error checking IndexedDB availability:', error);
      }
    };

    checkIndexedDB();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get cached results for search parameters
  const getCachedResults = useCallback(
    async (searchParams: FlightSearchParams): Promise<FlightWithDetails[] | null> => {
      if (!isCacheAvailable) return null;

      try {
        console.log('Attempting to get cached flight results for:', searchParams);
        // Add a safety check to prevent using invalid dates in cache key generation
        const safeParams = { ...searchParams };
        
        // Validate departure date
        if (safeParams.departureDate) {
          try {
            const date = new Date(safeParams.departureDate);
            if (isNaN(date.getTime())) {
              console.warn('Invalid departure date in cache params, using current date');
              safeParams.departureDate = new Date().toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('Error parsing departure date for cache:', e);
            safeParams.departureDate = new Date().toISOString().split('T')[0];
          }
        }
        
        // Validate return date if present
        if (safeParams.returnDate) {
          try {
            const date = new Date(safeParams.returnDate);
            if (isNaN(date.getTime())) {
              console.warn('Invalid return date in cache params, using departure date + 7 days');
              const departureDate = new Date(safeParams.departureDate);
              departureDate.setDate(departureDate.getDate() + 7);
              safeParams.returnDate = departureDate.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('Error parsing return date for cache:', e);
            const departureDate = new Date(safeParams.departureDate);
            departureDate.setDate(departureDate.getDate() + 7);
            safeParams.returnDate = departureDate.toISOString().split('T')[0];
          }
        }
        
        return await getCachedFlightSearchResults(safeParams);
      } catch (error) {
        console.error('Error getting cached flight results:', error);
        return null;
      }
    },
    [isCacheAvailable]
  );

  // Save results to cache
  const saveResults = useCallback(async (
    searchParams: FlightSearchParams,
    results: FlightWithDetails[]
  ): Promise<void> => {
    if (!isCacheAvailable) return;

    try {
      console.log('Saving flight results to cache:', results.length, 'flights');
      // Add a safety check to prevent using invalid dates in cache key generation
      const safeParams = { ...searchParams };
      
      // Validate departure date
      if (safeParams.departureDate) {
        try {
          const date = new Date(safeParams.departureDate);
          if (isNaN(date.getTime())) {
            console.warn('Invalid departure date in save cache params, using current date');
            safeParams.departureDate = new Date().toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Error parsing departure date for saving cache:', e);
          safeParams.departureDate = new Date().toISOString().split('T')[0];
        }
      }
      
      // Validate return date if present
      if (safeParams.returnDate) {
        try {
          const date = new Date(safeParams.returnDate);
          if (isNaN(date.getTime())) {
            console.warn('Invalid return date in save cache params, using departure date + 7 days');
            const departureDate = new Date(safeParams.departureDate);
            departureDate.setDate(departureDate.getDate() + 7);
            safeParams.returnDate = departureDate.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Error parsing return date for saving cache:', e);
          const departureDate = new Date(safeParams.departureDate);
          departureDate.setDate(departureDate.getDate() + 7);
          safeParams.returnDate = departureDate.toISOString().split('T')[0];
        }
      }
      
      await saveFlightSearchResults(safeParams, results);
    } catch (error) {
      console.error('Error saving flight results to cache:', error);
    }
  }, [isCacheAvailable]);

  // Clear expired cache entries
  const clearExpired = useCallback(async (): Promise<void> => {
    if (!isCacheAvailable) return;

    try {
      await clearExpiredCache();
    } catch (error) {
      console.error('Error clearing expired cache entries:', error);
    }
  }, [isCacheAvailable]);

  return {
    getCachedResults,
    saveResults,
    clearExpired,
    isCacheAvailable,
    isOffline
  };
};
