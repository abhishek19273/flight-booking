import React from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Plane, Wallet, User, Users, Baby, AlertCircle, Check, ArrowRight } from 'lucide-react';
import FlightCard from './FlightCard';

interface RoundTripFlightCardProps {
  outboundFlight: FlightWithDetails;
  returnFlight: FlightWithDetails;
  cabinClass: CabinClass;
  onSelectFlights: (outbound: FlightWithDetails, returnFlight: FlightWithDetails) => void;
  isSelected?: boolean;
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
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const RoundTripFlightCard: React.FC<RoundTripFlightCardProps> = ({ 
  outboundFlight, 
  returnFlight, 
  cabinClass, 
  onSelectFlights,
  isSelected = false
}) => {
  const outboundPrice = getPrice(outboundFlight, cabinClass);
  const returnPrice = getPrice(returnFlight, cabinClass);
  const totalPrice = outboundPrice + returnPrice;
  
  const outboundSeats = getAvailableSeats(outboundFlight, cabinClass);
  const returnSeats = getAvailableSeats(returnFlight, cabinClass);
  const isAvailable = outboundSeats > 0 && returnSeats > 0;

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${
      isSelected 
        ? 'border-2 border-blue-400 shadow-lg shadow-blue-400/20' 
        : 'border border-white/20 hover:border-white/40'
    }`}>
      <CardContent className="p-0">
        {/* Header with total price */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg">Round-Trip Flight</h3>
            <p className="text-white/80 text-sm">
              {outboundFlight.origin_airport.city} to {outboundFlight.destination_airport.city} and back
            </p>
          </div>
          <div className="text-right">
            <p className="text-white text-2xl font-bold">${totalPrice.toFixed(2)}</p>
            <p className="text-white/80 text-xs">Total for round-trip</p>
          </div>
        </div>

        {/* Outbound Flight */}
        <div className="bg-gradient-to-r from-blue-600/10 to-blue-600/5 p-4 border-b border-white/10">
          <div className="flex items-center mb-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500">
              Outbound
            </Badge>
            <p className="ml-2 text-sm text-gray-300">
              {formatDate(outboundFlight.departure_time)}
            </p>
          </div>
          
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Airline */}
            <div className="col-span-3 flex items-center gap-2">
              <img 
                src={outboundFlight.airline.logo_url} 
                alt={outboundFlight.airline.name} 
                className="h-8 w-8 rounded-full bg-white p-1 object-contain" 
              />
              <div>
                <p className="font-semibold text-sm">{outboundFlight.airline.name}</p>
                <p className="text-xs text-gray-400">{outboundFlight.flight_number}</p>
              </div>
            </div>
            
            {/* Flight times */}
            <div className="col-span-7 flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-bold">{formatTime(outboundFlight.departure_time)}</p>
                <p className="text-sm">{outboundFlight.origin_airport.iata_code}</p>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <p className="text-xs text-gray-400 mb-1">{formatDuration(outboundFlight.duration_minutes)}</p>
                <div className="relative w-24 md:w-32">
                  <div className="border-t border-dashed border-gray-400 w-full absolute top-1/2"></div>
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Direct</p>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold">{formatTime(outboundFlight.arrival_time)}</p>
                <p className="text-sm">{outboundFlight.destination_airport.iata_code}</p>
              </div>
            </div>
            
            {/* Seats */}
            <div className="col-span-2 text-right">
              {outboundSeats > 20 ? (
                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500">
                  <Check className="h-3 w-3 mr-1" /> {outboundSeats} seats
                </Badge>
              ) : outboundSeats > 0 ? (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500">
                  <AlertCircle className="h-3 w-3 mr-1" /> {outboundSeats} left
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" /> Sold out
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Return Flight */}
        <div className="bg-gradient-to-r from-indigo-600/10 to-indigo-600/5 p-4">
          <div className="flex items-center mb-2">
            <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500">
              Return
            </Badge>
            <p className="ml-2 text-sm text-gray-300">
              {formatDate(returnFlight.departure_time)}
            </p>
          </div>
          
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Airline */}
            <div className="col-span-3 flex items-center gap-2">
              <img 
                src={returnFlight.airline.logo_url} 
                alt={returnFlight.airline.name} 
                className="h-8 w-8 rounded-full bg-white p-1 object-contain" 
              />
              <div>
                <p className="font-semibold text-sm">{returnFlight.airline.name}</p>
                <p className="text-xs text-gray-400">{returnFlight.flight_number}</p>
              </div>
            </div>
            
            {/* Flight times */}
            <div className="col-span-7 flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-bold">{formatTime(returnFlight.departure_time)}</p>
                <p className="text-sm">{returnFlight.origin_airport.iata_code}</p>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <p className="text-xs text-gray-400 mb-1">{formatDuration(returnFlight.duration_minutes)}</p>
                <div className="relative w-24 md:w-32">
                  <div className="border-t border-dashed border-gray-400 w-full absolute top-1/2"></div>
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Direct</p>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-bold">{formatTime(returnFlight.arrival_time)}</p>
                <p className="text-sm">{returnFlight.destination_airport.iata_code}</p>
              </div>
            </div>
            
            {/* Seats */}
            <div className="col-span-2 text-right">
              {returnSeats > 20 ? (
                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500">
                  <Check className="h-3 w-3 mr-1" /> {returnSeats} seats
                </Badge>
              ) : returnSeats > 0 ? (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500">
                  <AlertCircle className="h-3 w-3 mr-1" /> {returnSeats} left
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" /> Sold out
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer with action button */}
        <div className="p-4 bg-gray-900/50 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-300">
              <span className="font-medium">{cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}</span> class
            </p>
            <p className="text-xs text-gray-400">
              {outboundSeats < returnSeats ? outboundSeats : returnSeats} seats available
            </p>
          </div>
          <Button 
            onClick={() => onSelectFlights(outboundFlight, returnFlight)}
            disabled={!isAvailable}
            className={`bg-gradient-to-r ${
              isSelected 
                ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isSelected ? 'Selected' : 'Select Flights'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoundTripFlightCard;
