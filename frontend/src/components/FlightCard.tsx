import React from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Plane, Wallet, User, Users, Baby, AlertCircle } from 'lucide-react';

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

const FlightCard: React.FC<FlightCardProps> = ({ flight, cabinClass, onSelectFlight }) => {
  const price = getPrice(flight, cabinClass);
  const availableSeats = getAvailableSeats(flight, cabinClass);
  const seatAvailabilityColor = getSeatAvailabilityColor(availableSeats);
  const duration = calculateDuration(flight.departure_time, flight.arrival_time);

  const renderStopInfo = () => {
    // Assuming direct flights for now. This can be expanded later.
    return <span className="text-sm text-green-400 font-medium">Direct</span>;
  };
  
  const renderSeatAvailability = () => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${seatAvailabilityColor} hover:${seatAvailabilityColor} cursor-help`}>
              {availableSeats} {availableSeats === 1 ? 'seat' : 'seats'} left
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available seats in {cabinClass.replace('-', ' ')} class</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return React.createElement(
    'div', 
    { 
      className: "rounded-lg border border-white/20 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md shadow-lg text-white mb-4 transition-all duration-300 hover:from-white/10 hover:to-white/15 hover:shadow-xl overflow-hidden relative" 
    },
    React.createElement(
      'div',
      { className: "p-0" },
      [
        flight.is_return && React.createElement(
          'div',
          { 
            key: 'return-badge',
            className: "absolute top-0 right-0 bg-indigo-500/90 text-white text-xs font-medium px-3 py-1 rounded-bl-md" 
          },
          'Return Flight'
        ),
        React.createElement(
          'div',
          { 
            key: 'content',
            className: "p-4 md:p-6" 
          },
          React.createElement(
            'div',
            { className: "grid grid-cols-1 lg:grid-cols-12 gap-y-4 lg:gap-x-4 items-center" },
            [
              // Airline Info
              React.createElement(
                'div',
                { 
                  key: 'airline-info',
                  className: "lg:col-span-3 flex flex-row items-center gap-3" 
                },
                [
                  React.createElement(
                    'div',
                    { 
                      key: 'logo-container',
                      className: "h-12 w-12 rounded-full bg-white/90 p-1 flex items-center justify-center shadow-md" 
                    },
                    React.createElement(
                      'img',
                      {
                        src: flight.airline.logo_url || 'https://via.placeholder.com/40',
                        alt: `${flight.airline.name} logo`,
                        className: "h-9 w-9 object-contain"
                      }
                    )
                  ),
                  React.createElement(
                    'div',
                    { 
                      key: 'airline-details',
                      className: "flex-grow" 
                    },
                    [
                      React.createElement(
                        'p',
                        { 
                          key: 'airline-name',
                          className: "font-bold text-base sm:text-lg" 
                        },
                        flight.airline.name
                      ),
                      React.createElement(
                        'div',
                        { 
                          key: 'flight-number-container',
                          className: "flex items-center" 
                        },
                        React.createElement(
                          'p',
                          { 
                            className: "text-xs text-blue-300 font-medium" 
                          },
                          `Flight ${flight.flight_number}`
                        )
                      )
                    ]
                  )
                ]
              ),
              
              // Flight Times & Route
              React.createElement(
                'div',
                { 
                  key: 'flight-times',
                  className: "lg:col-span-5 flex items-center justify-between gap-2" 
                },
                [
                  React.createElement(
                    'div',
                    { 
                      key: 'departure',
                      className: "text-center" 
                    },
                    [
                      React.createElement('p', { key: 'dep-time', className: "text-xl sm:text-2xl font-bold" }, formatTime(flight.departure_time)),
                      React.createElement('p', { key: 'dep-code', className: "text-base sm:text-lg font-semibold text-gray-200" }, flight.origin_airport.iata_code),
                      React.createElement('p', { key: 'dep-city', className: "text-xs text-gray-300 hidden sm:block" }, flight.origin_airport.city),
                      React.createElement('p', { key: 'dep-date', className: "text-xs text-blue-300 hidden sm:block" }, formatDate(flight.departure_time))
                    ]
                  ),
                  React.createElement(
                    'div',
                    { 
                      key: 'duration',
                      className: "flex flex-col items-center text-center flex-grow mx-2" 
                    },
                    [
                      React.createElement('p', { key: 'duration-text', className: "text-xs text-blue-300 font-medium mb-1" }, duration),
                      React.createElement(
                        'div',
                        { 
                          key: 'flight-path',
                          className: "flex items-center w-full" 
                        },
                        [
                          React.createElement('div', { key: 'path-left', className: "h-[2px] flex-grow bg-gradient-to-r from-blue-500/50 to-indigo-500/50" }),
                          React.createElement(Plane, { key: 'plane-icon', className: "h-5 w-5 text-blue-300 mx-2 transform rotate-90" }),
                          React.createElement('div', { key: 'path-right', className: "h-[2px] flex-grow bg-gradient-to-r from-indigo-500/50 to-blue-500/50" })
                        ]
                      ),
                      React.createElement('div', { key: 'stops', className: "mt-1" }, renderStopInfo())
                    ]
                  ),
                  React.createElement(
                    'div',
                    { 
                      key: 'arrival',
                      className: "text-center" 
                    },
                    [
                      React.createElement('p', { key: 'arr-time', className: "text-xl sm:text-2xl font-bold" }, formatTime(flight.arrival_time)),
                      React.createElement('p', { key: 'arr-code', className: "text-base sm:text-lg font-semibold text-gray-200" }, flight.destination_airport.iata_code),
                      React.createElement('p', { key: 'arr-city', className: "text-xs text-gray-300 hidden sm:block" }, flight.destination_airport.city),
                      React.createElement('p', { key: 'arr-date', className: "text-xs text-blue-300 hidden sm:block" }, formatDate(flight.arrival_time))
                    ]
                  )
                ]
              ),
              
              // Price & Booking
              React.createElement(
                'div',
                { 
                  key: 'price-booking',
                  className: "lg:col-span-4 flex flex-col sm:flex-row items-center justify-between lg:justify-end gap-4 border-t border-white/10 lg:border-none pt-4 lg:pt-0" 
                },
                [
                  React.createElement(
                    'div',
                    { 
                      key: 'price-container',
                      className: "text-center sm:text-left lg:text-right" 
                    },
                    React.createElement(
                      'div',
                      { 
                        className: "flex flex-col items-center sm:items-start lg:items-end gap-1" 
                      },
                      [
                        React.createElement(
                          'p',
                          { 
                            key: 'price',
                            className: "text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent" 
                          },
                          `$${price.toFixed(2)}`
                        ),
                        React.createElement(
                          'p',
                          { 
                            key: 'price-label',
                            className: "text-xs text-gray-300 capitalize" 
                          },
                          `per ${cabinClass.replace('-', ' ')} seat`
                        ),
                        renderSeatAvailability()
                      ]
                    )
                  ),
                  React.createElement(
                    Button,
                    {
                      key: 'select-button',
                      onClick: () => onSelectFlight(flight),
                      disabled: availableSeats <= 0,
                      className: "w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition-all duration-300 shadow-lg px-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    },
                    availableSeats > 0 ? 'Select' : 'Sold Out'
                  )
                ]
              )
            ]
          )
        )
      ]
    )
  );
};

export default FlightCard;
