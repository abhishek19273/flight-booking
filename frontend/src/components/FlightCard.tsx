import React from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, Plane, Wallet, User, Users, Baby } from 'lucide-react';

interface FlightCardProps {
  flight: FlightWithDetails;
  cabinClass: CabinClass;
  onSelectFlight: (flight: FlightWithDetails) => void;
}

const getPrice = (flight: FlightWithDetails, cabinClass: CabinClass): number => {
  switch (cabinClass) {
    case 'economy': return flight.economy_price;
    case 'premium-economy': return flight.premium_economy_price;
    case 'business': return flight.business_price;
    case 'first': return flight.first_price;
    default: return 0;
  }
};

const formatTime = (date: string) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const FlightCard: React.FC<FlightCardProps> = ({ flight, cabinClass, onSelectFlight }) => {
  const price = getPrice(flight, cabinClass);

  const renderStopInfo = () => {
    // Assuming direct flights for now. This can be expanded later.
    return <span className="text-sm text-green-400 font-medium">Direct</span>;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white mb-4 transition-all duration-300 hover:bg-white/20 hover:shadow-2xl">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-4 lg:gap-x-4 items-center">
          {/* Section 1: Airline Info (Mobile: full width, LG: 3 cols) */}
          <div className="lg:col-span-3 flex flex-row items-center gap-3">
            <img src={flight.airline.logo_url} alt={`${flight.airline.name} logo`} className="h-10 w-10 rounded-full bg-white p-1 object-contain" />
            <div className="flex-grow">
              <p className="font-bold text-base sm:text-lg">{flight.airline.name}</p>
              <p className="text-xs text-gray-300">{flight.flight_number}</p>
            </div>
          </div>

          {/* Section 2: Flight Times & Route (Mobile: full width, LG: 5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-between gap-2">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">{formatTime(flight.departure_time)}</p>
              <p className="text-base sm:text-lg font-semibold text-gray-200">{flight.origin_airport.iata_code}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{formatDate(flight.departure_time)}</p>
            </div>
            <div className="flex flex-col items-center text-center flex-grow mx-2">
              <p className="text-xs text-gray-400 mb-1">{Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m</p>
              <div className="flex items-center w-full">
                <Separator className="flex-grow bg-gray-500" />
                <Plane className="h-5 w-5 text-white mx-2" />
                <Separator className="flex-grow bg-gray-500" />
              </div>
              <div className="mt-1">{renderStopInfo()}</div>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">{formatTime(flight.arrival_time)}</p>
              <p className="text-base sm:text-lg font-semibold text-gray-200">{flight.destination_airport.iata_code}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{formatDate(flight.arrival_time)}</p>
            </div>
          </div>

          {/* Section 3: Price & Booking (Mobile: full width, LG: 4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-4 border-t border-white/10 lg:border-none pt-4 lg:pt-0">
            <div className="text-center sm:text-left lg:text-right">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">${price.toFixed(2)}</p>
              <p className="text-xs text-gray-300 capitalize">per {cabinClass.replace('-', ' ')} seat</p>
            </div>
            <Button 
              onClick={() => onSelectFlight(flight)} 
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors duration-300 shadow-lg px-6 py-3 text-base"
            >
              Select
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
