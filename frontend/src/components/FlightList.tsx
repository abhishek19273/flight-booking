import React from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import FlightCard from './FlightCard';

interface FlightListProps {
  flights: FlightWithDetails[];
  cabinClass: CabinClass;
  onSelectFlight: (flight: FlightWithDetails) => void;
}

const FlightList: React.FC<FlightListProps> = ({ flights, cabinClass, onSelectFlight }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-4">Available Flights</h2>
      <div className="space-y-4">
        {flights.map((flight) => (
          <FlightCard 
            key={flight.id} 
            flight={flight} 
            cabinClass={cabinClass} 
            onSelectFlight={onSelectFlight} 
          />
        ))}
      </div>
    </div>
  );
};

export default FlightList;
