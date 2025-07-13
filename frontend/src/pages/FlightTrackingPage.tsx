import React from 'react';
import { useFlightTracking, Flight } from '@/hooks/useFlightTracking';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

const StatusIndicator: React.FC<{ isConnected: boolean; error: string | null }> = ({ isConnected, error }) => {
  if (error) {
    return (
      <div className="flex items-center text-red-500">
        <WifiOff className="h-5 w-5 mr-2" />
        <span className="font-semibold">Connection Lost</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center text-green-500">
        <Wifi className="h-5 w-5 mr-2" />
        <span className="font-semibold">Live Connection</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-gray-500">
      <WifiOff className="h-5 w-5 mr-2" />
      <span className="font-semibold">Connecting...</span>
    </div>
  );
};

const FlightCard: React.FC<{ flight: Flight }> = ({ flight }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold text-gray-800">{flight.flight_id}</h3>
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${flight.status === 'On Time' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {flight.status}
      </span>
    </div>
    <p className="text-gray-600 mb-4">{flight.message}</p>
    <div className="text-xs text-gray-500 flex items-center">
      <Clock className="h-3 w-3 mr-1.5" />
      <span>Last Updated: {new Date(flight.updated_at).toLocaleTimeString()}</span>
    </div>
  </div>
);

const FlightTrackerPage: React.FC = () => {
  const { flights, isConnected, error, lastUpdate } = useFlightTracking();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Live Flight Tracker</h1>
          <StatusIndicator isConnected={isConnected} error={error} />
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {flights.length > 0 ? (
              flights.map((flight) => <FlightCard key={flight.flight_id} flight={flight} />)
            ) : (
              <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Waiting for flight data...</h3>
                <p className="mt-1 text-sm text-gray-500">Updates will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FlightTrackerPage;
