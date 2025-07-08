import { useState, useEffect, useCallback } from 'react';
import { mockFlightTrackingData, USE_MOCK_API } from '@/services/mockFlightApi';

interface FlightTrackingData {
  id: string;
  flight_number: string;
  airline_name: string;
  status: string;
  departure_time: string;
  arrival_time: string;
  origin_airport: string;
  destination_airport: string;
  updated_at: string;
}

interface FlightTrackingUpdate {
  type: 'connected' | 'flight_updates' | 'error';
  message?: string;
  data?: FlightTrackingData[];
  timestamp?: string;
}

export const useFlightTracking = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [flights, setFlights] = useState<FlightTrackingData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (USE_MOCK_API) {
      // Use mock data for development
      setIsConnected(true);
      setError(null);
      setFlights(mockFlightTrackingData);
      setLastUpdate(new Date().toISOString());
      
      // Simulate real-time updates every 10 seconds
      const interval = setInterval(() => {
        // Randomly update flight status
        const updatedFlights = mockFlightTrackingData.map(flight => ({
          ...flight,
          status: Math.random() > 0.8 ? 
            (flight.status === 'scheduled' ? 'delayed' : flight.status) : 
            flight.status,
          updated_at: new Date().toISOString(),
        }));
        setFlights(updatedFlights);
        setLastUpdate(new Date().toISOString());
      }, 10000);

      return () => {
        clearInterval(interval);
        setIsConnected(false);
      };
    } else {
      // Use real SSE connection
      try {
        const eventSource = new EventSource(
          'https://gkufoavzgikkorogzfze.supabase.co/functions/v1/flight-tracking'
        );

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('Flight tracking connected');
        };

        eventSource.onmessage = (event) => {
          try {
            const update: FlightTrackingUpdate = JSON.parse(event.data);
            
            switch (update.type) {
              case 'connected':
                setIsConnected(true);
                break;
              case 'flight_updates':
                if (update.data) {
                  setFlights(update.data);
                  setLastUpdate(update.timestamp || new Date().toISOString());
                }
                break;
              case 'error':
                setError(update.message || 'Unknown error occurred');
                break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          setError('Connection lost. Attempting to reconnect...');
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (eventSource.readyState === EventSource.CLOSED) {
              connect();
            }
          }, 5000);
        };

        return () => {
          eventSource.close();
          setIsConnected(false);
        };
      } catch (err) {
        setError('Failed to establish connection');
        setIsConnected(false);
      }
    }
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    isConnected,
    flights,
    lastUpdate,
    error,
    reconnect: connect,
  };
};