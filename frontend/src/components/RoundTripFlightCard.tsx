import React from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Plane, Wallet, User, Users, Baby, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface RoundTripFlightCardProps {
  outboundFlight: FlightWithDetails;
  returnFlight: FlightWithDetails;
  cabinClass: CabinClass;
  onSelectFlights: (outboundFlight: FlightWithDetails, returnFlight: FlightWithDetails) => void;
}

interface FlightSegmentProps {
  flight: FlightWithDetails;
  cabinClass: CabinClass;
  isReturn?: boolean;
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

const getSeatAvailabilityColor = (available: number): string => {
  if (available <= 0) return 'bg-red-500';
  if (available < 5) return 'bg-amber-500';
  if (available < 10) return 'bg-yellow-500';
  return 'bg-green-500';
};

const formatTime = (date: string) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const calculateDuration = (departure: string, arrival: string): string => {
  const departureTime = new Date(departure).getTime();
  const arrivalTime = new Date(arrival).getTime();
  const durationMs = arrivalTime - departureTime;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const FlightSegment: React.FC<FlightSegmentProps> = ({ flight, cabinClass, isReturn = false }) => {
  const duration = calculateDuration(flight.departure_time, flight.arrival_time);
  
  return React.createElement(
    'div',
    {
      className: "p-4 border border-white/10 rounded-lg bg-gradient-to-r from-white/5 to-white/10"
    },
    [
      // Header with flight type and airline
      React.createElement(
        'div',
        {
          key: 'header',
          className: "flex justify-between items-center mb-3"
        },
        [
          React.createElement(
            'div',
            {
              key: 'flight-type',
              className: "flex items-center gap-2"
            },
            [
              isReturn 
                ? React.createElement(ArrowLeft, { key: 'icon', className: "h-4 w-4 text-indigo-300" })
                : React.createElement(ArrowRight, { key: 'icon', className: "h-4 w-4 text-blue-300" }),
              React.createElement(
                'span',
                {
                  className: "font-medium text-sm"
                },
                isReturn ? 'Return Flight' : 'Outbound Flight'
              )
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'airline',
              className: "flex items-center gap-2"
            },
            [
              React.createElement(
                'span',
                {
                  className: "text-sm"
                },
                flight.airline.name
              ),
              React.createElement(
                'div',
                {
                  className: "h-6 w-6 rounded-full bg-white/90 p-0.5 flex items-center justify-center"
                },
                React.createElement(
                  'img',
                  {
                    src: flight.airline.logo_url || 'https://via.placeholder.com/20',
                    alt: `${flight.airline.name} logo`,
                    className: "h-5 w-5 object-contain"
                  }
                )
              )
            ]
          )
        ]
      ),
      
      // Flight details
      React.createElement(
        'div',
        {
          key: 'details',
          className: "flex items-center justify-between"
        },
        [
          React.createElement(
            'div',
            {
              key: 'departure',
              className: "text-center"
            },
            [
              React.createElement('p', { key: 'time', className: "text-lg font-bold" }, formatTime(flight.departure_time)),
              React.createElement('p', { key: 'code', className: "text-base font-semibold" }, flight.origin_airport.iata_code),
              React.createElement('p', { key: 'city', className: "text-xs text-gray-300" }, flight.origin_airport.city)
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'flight-path',
              className: "flex flex-col items-center flex-grow mx-4"
            },
            [
              React.createElement('p', { key: 'duration', className: "text-xs mb-1" }, duration),
              React.createElement(
                'div',
                {
                  className: "flex items-center w-full"
                },
                [
                  React.createElement('div', { key: 'line-left', className: "h-[1px] flex-grow bg-white/20" }),
                  React.createElement(Plane, { key: 'plane', className: "h-3 w-3 mx-1 text-white/60 transform rotate-90" }),
                  React.createElement('div', { key: 'line-right', className: "h-[1px] flex-grow bg-white/20" })
                ]
              ),
              React.createElement('p', { key: 'flight-number', className: "text-xs mt-1 text-gray-400" }, `Flight ${flight.flight_number}`)
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'arrival',
              className: "text-center"
            },
            [
              React.createElement('p', { key: 'time', className: "text-lg font-bold" }, formatTime(flight.arrival_time)),
              React.createElement('p', { key: 'code', className: "text-base font-semibold" }, flight.destination_airport.iata_code),
              React.createElement('p', { key: 'city', className: "text-xs text-gray-300" }, flight.destination_airport.city)
            ]
          )
        ]
      )
    ]
  );
};

const RoundTripFlightCard: React.FC<RoundTripFlightCardProps> = ({ 
  outboundFlight, 
  returnFlight, 
  cabinClass, 
  onSelectFlights 
}) => {
  const outboundPrice = getPrice(outboundFlight, cabinClass);
  const returnPrice = getPrice(returnFlight, cabinClass);
  const totalPrice = outboundPrice + returnPrice;
  
  const outboundSeats = getAvailableSeats(outboundFlight, cabinClass);
  const returnSeats = getAvailableSeats(returnFlight, cabinClass);
  
  const hasAvailableSeats = outboundSeats > 0 && returnSeats > 0;

  return React.createElement(
    'div',
    {
      className: "rounded-lg border border-white/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md shadow-lg text-white mb-4 transition-all duration-300 hover:from-white/10 hover:to-white/15 hover:shadow-xl overflow-hidden relative"
    },
    React.createElement(
      'div',
      {
        className: "p-4"
      },
      React.createElement(
        'div',
        {
          className: "space-y-4"
        },
        [
          React.createElement(
            FlightSegment,
            {
              key: 'outbound',
              flight: outboundFlight,
              cabinClass: cabinClass,
              isReturn: false
            }
          ),
          React.createElement(
            FlightSegment,
            {
              key: 'return',
              flight: returnFlight,
              cabinClass: cabinClass,
              isReturn: true
            }
          ),
          React.createElement(
            'div',
            {
              key: 'footer',
              className: "flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-white/10"
            },
            [
              React.createElement(
                'div',
                {
                  key: 'price',
                  className: "mb-3 sm:mb-0"
                },
                [
                  React.createElement(
                    'p',
                    {
                      className: "text-2xl font-extrabold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent"
                    },
                    `$${totalPrice.toFixed(2)}`
                  ),
                  React.createElement(
                    'p',
                    {
                      className: "text-xs text-gray-300"
                    },
                    `Total for round-trip (${cabinClass.replace('-', ' ')})`
                  )
                ]
              ),
              React.createElement(
                Button,
                {
                  onClick: () => onSelectFlights(outboundFlight, returnFlight),
                  disabled: !hasAvailableSeats,
                  className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold"
                },
                hasAvailableSeats ? 'Select Round-Trip' : 'Sold Out'
              )
            ]
          )
        ]
      )
    )
  );
};

export default RoundTripFlightCard;
