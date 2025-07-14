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

  // Get cached results
  const getCachedResults = useCallback(async (
    searchParams: FlightSearchParams
  ): Promise<FlightWithDetails[] | null> => {
    if (!isCacheAvailable) return null;

    try {
      // Use a 30-minute cache validity period
      return await getCachedFlightSearchResults(searchParams, 30 * 60 * 1000);
    } catch (error) {
      console.error('Error retrieving cached flight results:', error);
      return null;
    }
  }, [isCacheAvailable]);

  // Save results to cache
  const saveResults = useCallback(async (
    searchParams: FlightSearchParams,
    results: FlightWithDetails[]
  ): Promise<void> => {
    if (!isCacheAvailable) return;

    try {
      await saveFlightSearchResults(searchParams, results);
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
