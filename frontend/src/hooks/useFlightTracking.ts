import { useState, useEffect, useCallback, useRef } from 'react';

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
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
      return;
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const eventSource = new EventSource(`${baseURL}/flights/updates/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('Flight tracking stream connected.');
    };

    eventSource.addEventListener('flight_update', (event) => {
      try {
        const update: Flight = JSON.parse(event.data);
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
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('Flight tracking stream disconnected.');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000); // Add a small delay before reconnecting
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { flights, isConnected, error, lastUpdate, reconnect };
};
