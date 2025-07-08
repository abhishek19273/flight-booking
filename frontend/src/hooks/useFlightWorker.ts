import { useEffect, useRef, useState } from 'react';
import type { FlightWithDetails } from '../types';

// Define filter/sort criteria types
export interface FlightFilterCriteria {
  minPrice?: number;
  maxPrice?: number;
  airlines?: string[];
  departureTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  maxDuration?: number;
  maxStops?: number;
}

export interface FlightSortCriteria {
  sortBy: 'price' | 'duration' | 'departure' | 'arrival' | 'airline';
  sortOrder: 'asc' | 'desc';
}

const useFlightWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create worker on initial render
  useEffect(() => {
    // Create the worker only in client-side
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/flightFilterWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Clean up
      return () => {
        workerRef.current?.terminate();
      };
    }
  }, []);

  // Filter flights using the Web Worker
  const filterFlights = (
    flights: FlightWithDetails[],
    criteria: FlightFilterCriteria
  ): Promise<FlightWithDetails[]> => {
    if (!workerRef.current) {
      return Promise.reject(new Error('Web Worker not initialized'));
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const worker = workerRef.current!;

      // Listen for the response from the worker
      const handleMessage = (event: MessageEvent) => {
        setIsLoading(false);
        
        if (event.data.error) {
          setError(event.data.error);
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.flights);
        }
        
        worker.removeEventListener('message', handleMessage);
      };

      worker.addEventListener('message', handleMessage);

      // Send message to worker
      worker.postMessage({
        action: 'filter',
        flights,
        criteria
      });
    });
  };

  // Sort flights using the Web Worker
  const sortFlights = (
    flights: FlightWithDetails[],
    criteria: FlightSortCriteria
  ): Promise<FlightWithDetails[]> => {
    if (!workerRef.current) {
      return Promise.reject(new Error('Web Worker not initialized'));
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const worker = workerRef.current!;

      // Listen for the response from the worker
      const handleMessage = (event: MessageEvent) => {
        setIsLoading(false);
        
        if (event.data.error) {
          setError(event.data.error);
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.flights);
        }
        
        worker.removeEventListener('message', handleMessage);
      };

      worker.addEventListener('message', handleMessage);

      // Send message to worker
      worker.postMessage({
        action: 'sort',
        flights,
        criteria
      });
    });
  };

  return {
    filterFlights,
    sortFlights,
    isLoading,
    error
  };
};

export default useFlightWorker;
