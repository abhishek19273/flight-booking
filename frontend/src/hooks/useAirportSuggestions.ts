import { useDebounce } from '@/hooks/useDebounce';
import { axiosInstance as apiClient } from '@/services/api/apiClient';
import { Airport, isAirportCachePopulated, saveAirportsToCache, searchAirportsInCache } from '@/utils/indexedDBService';
import { useCallback, useEffect, useState } from 'react';

export const useAirportSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCacheReady, setIsCacheReady] = useState(false);

  // Effect to populate airport cache from the API if it's empty
  useEffect(() => {
    const populateCache = async () => {
      try {
        const isPopulated = await isAirportCachePopulated();
        if (!isPopulated) {
          console.log('Populating airport cache from API...');
          const response = await apiClient.get<Airport[]>('/airports/cache');
          await saveAirportsToCache(response.data);
          console.log('Airport cache populated.');
        }
        setIsCacheReady(true);
      } catch (error) {
        console.error('Error populating airport cache:', error);
      }
    };

    populateCache();
  }, []);

  // Function to search for airport suggestions
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const search = async () => {
      if (isCacheReady && debouncedSearchTerm.length >= 2) {
        setLoading(true);
        try {
          // First, try to get suggestions from the local cache
          const cachedSuggestions = await searchAirportsInCache(debouncedSearchTerm);
          if (cachedSuggestions.length > 0) {
            setSuggestions(cachedSuggestions);
          } else {
            // If not in cache, fetch from the API
            const response = await apiClient.get<Airport[]>(`/airports?query=${debouncedSearchTerm}`);
            setSuggestions(response.data);
          }
        } catch (error) {
          console.error('Error fetching airport suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    search();
  }, [debouncedSearchTerm, isCacheReady]);

  return { 
    suggestions, 
    loading, 
    isCacheReady, 
    searchAirports: setSearchTerm 
  };
};
