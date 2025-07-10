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
      <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Airline Info */}
        <div className="col-span-1 flex items-center gap-3">
          <img src={flight.airline.logo_url} alt={`${flight.airline.name} logo`} className="h-10 w-10 rounded-full bg-white p-1 object-contain" />
          <div>
            <p className="font-bold text-lg">{flight.airline.name}</p>
            <p className="text-xs text-gray-300">{flight.flight_number}</p>
          </div>
        </div>

        {/* Flight Times & Route */}
        <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{formatTime(flight.departure_time)}</p>
            <p className="text-lg font-semibold text-gray-200">{flight.origin_airport.iata_code}</p>
            <p className="text-xs text-gray-400">{formatDate(flight.departure_time)}</p>
          </div>
          <div className="flex flex-col items-center text-center flex-grow mx-2">
            <div className="flex items-center w-full">
              <Separator className="flex-grow bg-gray-500" />
              <Plane className="h-5 w-5 text-white mx-2" />
              <Separator className="flex-grow bg-gray-500" />
            </div>
            <p className="text-xs text-gray-400 mt-1">{Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatTime(flight.arrival_time)}</p>
            <p className="text-lg font-semibold text-gray-200">{flight.destination_airport.iata_code}</p>
            <p className="text-xs text-gray-400">{formatDate(flight.arrival_time)}</p>
          </div>
        </div>

        {/* Stops Info */}
        <div className="col-span-1 hidden md:flex flex-col items-center justify-center">
          {renderStopInfo()}
        </div>

        {/* Price & Booking */}
        <div className="col-span-1 md:col-span-1 flex flex-col items-center md:items-end justify-center text-center md:text-right">
          <p className="text-3xl font-extrabold text-white">${price.toFixed(2)}</p>
          <p className="text-xs text-gray-300 capitalize mb-3">per {cabinClass} seat</p>
          <Button 
            onClick={() => onSelectFlight(flight)} 
            className="w-full md:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors duration-300 shadow-lg"
          >
            Select Flight
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
