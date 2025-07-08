import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Clock, Users } from 'lucide-react';
import { FlightWithDetails, useFlightSearch } from '@/hooks/useFlightSearch';

interface FlightResultsProps {
  flights: FlightWithDetails[];
  cabinClass: string;
  onSelectFlight: (flight: FlightWithDetails) => void;
  loading: boolean;
}

const FlightResults: React.FC<FlightResultsProps> = ({ 
  flights, 
  cabinClass, 
  onSelectFlight,
  loading 
}) => {
  const { getPrice } = useFlightSearch();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <Card className="text-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Plane className="h-16 w-16 text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No flights found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Available Flights ({flights.length})
        </h2>
        <Badge variant="secondary" className="capitalize">
          {cabinClass.replace('-', ' ')}
        </Badge>
      </div>

      {flights.map((flight) => (
        <Card key={flight.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <img
                      src={flight.airline.logo_url || '/placeholder.svg'}
                      alt={flight.airline.name}
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{flight.airline.name}</p>
                      <p className="text-sm text-gray-600">{flight.flight_number}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {flight.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatTime(flight.departure_time)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {flight.origin_airport.iata_code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {flight.origin_airport.city}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <Plane className="h-4 w-4 text-blue-600" />
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(flight.duration_minutes)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Direct</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatTime(flight.arrival_time)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {flight.destination_airport.iata_code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {flight.destination_airport.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {cabinClass === 'economy' && flight.economy_available} 
                        {cabinClass === 'premium-economy' && flight.premium_economy_available}
                        {cabinClass === 'business' && flight.business_available}
                        {cabinClass === 'first' && flight.first_available}
                        {' '}seats left
                      </span>
                    </div>
                    {flight.aircraft_type && (
                      <span>{flight.aircraft_type}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(getPrice(flight, cabinClass))}
                    </p>
                    <p className="text-sm text-gray-600">per person</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => onSelectFlight(flight)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Select Flight
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FlightResults;