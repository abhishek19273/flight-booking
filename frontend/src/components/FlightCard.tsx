import React from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Plane, Wallet, User, Users, Baby, AlertCircle, Check } from 'lucide-react';

interface FlightCardProps {
  flight: FlightWithDetails;
  cabinClass: CabinClass;
  onSelectFlight: (flight: FlightWithDetails) => void;
  isReturn?: boolean;
  pairedWithFlight?: FlightWithDetails;
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

const getAvailableSeats = (flight: FlightWithDetails, cabinClass: CabinClass): number => {
  switch (cabinClass) {
    case 'economy': return flight.economy_available;
    case 'premium-economy': return flight.premium_economy_available;
    case 'business': return flight.business_available;
    case 'first': return flight.first_available;
    default: return 0;
  }
};

const formatTime = (date: string) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const FlightCard: React.FC<FlightCardProps> = ({ flight, cabinClass, onSelectFlight, isReturn = false, pairedWithFlight }) => {
  const price = getPrice(flight, cabinClass);
  const availableSeats = getAvailableSeats(flight, cabinClass);
  const isAvailable = availableSeats > 0;

  const renderStopInfo = () => {
    // Assuming direct flights for now. This can be expanded later.
    return <span className="text-sm text-green-400 font-medium">Direct</span>;
  };
  
  const renderSeatAvailability = () => {
    if (availableSeats > 20) {
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500">
          <Check className="h-3 w-3 mr-1" /> {availableSeats} seats available
        </Badge>
      );
    } else if (availableSeats > 0) {
      return (
        <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500">
          <AlertCircle className="h-3 w-3 mr-1" /> Only {availableSeats} seats left
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500">
          <AlertCircle className="h-3 w-3 mr-1" /> Sold out
        </Badge>
      );
    }
  };

  return (
    <Card className={`bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white mb-4 transition-all duration-300 hover:bg-white/20 hover:shadow-2xl ${isReturn ? 'border-l-4 border-l-blue-400' : ''}`}>
      <CardContent className="p-4 md:p-6">
        {isReturn && (
          <div className="mb-3">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500">
              Return Flight
            </Badge>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-4 lg:gap-x-4 items-center">
          {/* Section 1: Airline Info (Mobile: full width, LG: 3 cols) */}
          <div className="lg:col-span-3 flex flex-row items-center gap-3">
            <img src={flight.airline.logo_url} alt={`${flight.airline.name} logo`} className="h-10 w-10 rounded-full bg-white p-1 object-contain" />
            <div className="flex-grow">
              <p className="font-bold text-base sm:text-lg">{flight.airline.name}</p>
              <p className="text-xs text-gray-300">{flight.flight_number}</p>
              <div className="mt-1">
                {renderSeatAvailability()}
              </div>
            </div>
          </div>

          {/* Section 2: Flight Times & Route (Mobile: full width, LG: 5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-between gap-2">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold">{formatTime(flight.departure_time)}</p>
              <p className="text-base sm:text-lg font-semibold text-gray-200">{flight.origin_airport.iata_code}</p>
              <p className="text-xs text-gray-400 hidden sm:block">{formatDate(flight.departure_time)}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-blue-300 cursor-help mt-1">{flight.origin_airport.name}</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{flight.origin_airport.city}, {flight.origin_airport.country}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-blue-300 cursor-help mt-1">{flight.destination_airport.name}</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{flight.destination_airport.city}, {flight.destination_airport.country}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Section 3: Price & Booking (Mobile: full width, LG: 4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-4 border-t border-white/10 lg:border-none pt-4 lg:pt-0">
            <div className="text-center sm:text-left lg:text-right">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">${price.toFixed(2)}</p>
              <p className="text-xs text-gray-300 capitalize">per {cabinClass.replace('-', ' ')} seat</p>
              {pairedWithFlight && (
                <p className="text-xs text-green-300 mt-1">
                  ${(price + getPrice(pairedWithFlight, cabinClass)).toFixed(2)} round trip
                </p>
              )}
            </div>
            <Button 
              onClick={() => onSelectFlight(flight)} 
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors duration-300 shadow-lg px-6 py-3 text-base"
              disabled={!isAvailable}
            >
              {isAvailable ? 'Select' : 'Sold Out'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Create a component for round-trip flight cards that shows both outbound and return flights
export const RoundTripFlightCard: React.FC<{
  outboundFlight: FlightWithDetails;
  returnFlight: FlightWithDetails;
  cabinClass: CabinClass;
  onSelectFlights: (outbound: FlightWithDetails, returnFlight: FlightWithDetails) => void;
}> = ({ outboundFlight, returnFlight, cabinClass, onSelectFlights }) => {
  const outboundPrice = getPrice(outboundFlight, cabinClass);
  const returnPrice = getPrice(returnFlight, cabinClass);
  const totalPrice = outboundPrice + returnPrice;
  
  const outboundSeats = getAvailableSeats(outboundFlight, cabinClass);
  const returnSeats = getAvailableSeats(returnFlight, cabinClass);
  const isAvailable = outboundSeats > 0 && returnSeats > 0;
  
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white mb-4 transition-all duration-300 hover:bg-white/20 hover:shadow-2xl border-2 border-blue-500/30">
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Round Trip Flight</h3>
            <p className="text-sm text-gray-300">{outboundFlight.origin_airport.city} ↔ {outboundFlight.destination_airport.city}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-white">${totalPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-300">round trip per person</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <FlightCard 
            flight={outboundFlight} 
            cabinClass={cabinClass} 
            onSelectFlight={() => {}} 
            pairedWithFlight={returnFlight}
          />
          
          <FlightCard 
            flight={returnFlight} 
            cabinClass={cabinClass} 
            onSelectFlight={() => {}} 
            isReturn={true}
            pairedWithFlight={outboundFlight}
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={() => onSelectFlights(outboundFlight, returnFlight)} 
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors duration-300 shadow-lg px-6 py-3 text-base"
            disabled={!isAvailable}
          >
            {isAvailable ? 'Select Round Trip' : 'Sold Out'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
