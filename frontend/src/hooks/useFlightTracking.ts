import { useState, useEffect } from 'react';

// This type matches the mock data structure sent by the backend
export interface Flight {
  flight_id: string;
  status: string;
  message: string;
  updated_at: string;
}

export const useFlightTracking = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    // Connect to the backend SSE stream.
    // Assumes vite.config.ts has a proxy for /api to the backend.
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const eventSource = new EventSource(`${baseURL}/api/flights/updates/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('Flight tracking stream connected.');
    };

    eventSource.addEventListener('flight_update', (event) => {
      try {
        const update: Flight = JSON.parse(event.data);
        // The backend sends one flight object at a time; we store it in an array
        setFlights([update]); 
        setLastUpdate(new Date().toISOString());
      } catch (parseError) {
        console.error('Error parsing flight_update data:', parseError);
        setError('Failed to parse flight update from server.');
      }
    });

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      setError('Connection to flight update server lost.');
      setIsConnected(false);
      eventSource.close();
    };

    // Clean up the connection when the component unmounts
    return () => {
      eventSource.close();
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return { flights, isConnected, error, lastUpdate };
};
