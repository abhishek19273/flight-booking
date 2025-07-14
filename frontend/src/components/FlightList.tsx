import React, { useMemo } from 'react';
import { FlightWithDetails, CabinClass } from '@/types';
import FlightCard from './FlightCard';
import RoundTripFlightCard from './RoundTripFlightCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowRightLeft } from 'lucide-react';

interface FlightListProps {
  flights: FlightWithDetails[];
  cabinClass: CabinClass;
  onSelectFlight: (flight: FlightWithDetails) => void;
  tripType?: 'one-way' | 'round-trip';
}

const FlightList: React.FC<FlightListProps> = ({ 
  flights, 
  cabinClass, 
  onSelectFlight,
  tripType = 'one-way'
}) => {
  // Separate outbound and return flights
  const { outboundFlights, returnFlights } = useMemo(() => {
    if (tripType !== 'round-trip') {
      return { outboundFlights: flights, returnFlights: [] };
    }
    
    return {
      outboundFlights: flights.filter(flight => !flight.is_return),
      returnFlights: flights.filter(flight => flight.is_return)
    };
  }, [flights, tripType]);

  // Create flight pairs for round-trip
  const flightPairs = useMemo(() => {
    if (tripType !== 'round-trip' || !returnFlights.length) {
      return [];
    }

    // Create all possible combinations of outbound and return flights
    const pairs = [];
    for (const outbound of outboundFlights) {
      for (const returnFlight of returnFlights) {
        pairs.push({ outbound, returnFlight });
      }
    }

    // Sort pairs by total price
    return pairs.sort((a, b) => {
      const getPriceForFlight = (flight: FlightWithDetails) => {
        switch (cabinClass) {
          case 'economy': return flight.economy_price;
          case 'premium-economy': return flight.premium_economy_price;
          case 'business': return flight.business_price;
          case 'first': return flight.first_price;
          default: return 0;
        }
      };

      const totalPriceA = getPriceForFlight(a.outbound) + getPriceForFlight(a.returnFlight);
      const totalPriceB = getPriceForFlight(b.outbound) + getPriceForFlight(b.returnFlight);
      
      return totalPriceA - totalPriceB;
    });
  }, [outboundFlights, returnFlights, cabinClass, tripType]);

  // Handle selecting a flight pair
  const handleSelectFlightPair = (outbound: FlightWithDetails, returnFlight: FlightWithDetails) => {
    // For now, we'll just select the outbound flight
    // In a real implementation, you'd want to store both flights
    onSelectFlight({
      ...outbound,
      // Add a reference to the return flight
      returnFlightId: returnFlight.id
    });
  };

  if (tripType === 'round-trip' && flightPairs.length > 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-white mb-4">Round-Trip Flights</h2>
        <div className="space-y-6">
          {flightPairs.map((pair, index) => (
            <RoundTripFlightCard
              key={`${pair.outbound.id}-${pair.returnFlight.id}`}
              outboundFlight={pair.outbound}
              returnFlight={pair.returnFlight}
              cabinClass={cabinClass}
              onSelectFlightPair={handleSelectFlightPair}
            />
          ))}
        </div>
      </div>
    );
  }

  // If we have both outbound and return flights but in one-way mode, show tabs
  if (outboundFlights.length > 0 && returnFlights.length > 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-white mb-4">Available Flights</h2>
        <Tabs defaultValue="outbound" className="w-full">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="outbound" className="data-[state=active]:bg-blue-600 text-white">
              <ArrowRight className="mr-2 h-4 w-4" />
              Outbound Flights
            </TabsTrigger>
            <TabsTrigger value="return" className="data-[state=active]:bg-indigo-600 text-white">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Return Flights
            </TabsTrigger>
          </TabsList>
          <TabsContent value="outbound" className="mt-4">
            <div className="space-y-4">
              {outboundFlights.map((flight) => (
                <FlightCard 
                  key={flight.id} 
                  flight={flight} 
                  cabinClass={cabinClass} 
                  onSelectFlight={onSelectFlight} 
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="return" className="mt-4">
            <div className="space-y-4">
              {returnFlights.map((flight) => (
                <FlightCard 
                  key={flight.id} 
                  flight={flight} 
                  cabinClass={cabinClass} 
                  onSelectFlight={onSelectFlight} 
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Default one-way flight list
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
