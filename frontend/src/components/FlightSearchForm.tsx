import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeftRight, Plus, Minus, Search } from 'lucide-react';
import { FlightSearchParams } from '@/hooks/useFlightSearch';
import { AirportSearchInput } from '@/components/AirportSearchInput';
import { DatePicker } from '@/components/DatePicker';

interface FlightSearchFormProps {
  onSearch: (params: FlightSearchParams) => void;
  initialState?: FlightSearchParams;
}

const FlightSearchForm: React.FC<FlightSearchFormProps> = ({ onSearch, initialState }) => {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [cabinClass, setCabinClass] = useState('economy');
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });

  useEffect(() => {
    if (initialState) {
      setTripType(initialState.tripType);
      setFrom(initialState.from);
      setTo(initialState.to);
      setDepartDate(new Date(initialState.departureDate));
      setReturnDate(initialState.returnDate ? new Date(initialState.returnDate) : undefined);
      setCabinClass(initialState.cabinClass);
      setPassengers(initialState.passengers);
    }
  }, [initialState]);

  const swapDestinations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = () => {
    if (!from || !to || !departDate) return;

    const searchParams: FlightSearchParams = {
      from,
      to,
      departureDate: departDate.toISOString(),
      returnDate: tripType === 'round-trip' && returnDate ? returnDate.toISOString() : undefined,
      passengers,
      cabinClass: cabinClass as 'economy' | 'premium-economy' | 'business' | 'first',
      tripType: tripType as 'one-way' | 'round-trip',
    };

    onSearch(searchParams);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-md shadow-2xl border-0">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Trip Type Selection */}
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-4 block">Trip Type</Label>
            <RadioGroup 
              value={tripType} 
              onValueChange={(value) => setTripType(value as 'one-way' | 'round-trip')}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="round-trip" id="round-trip" />
                <Label htmlFor="round-trip" className="cursor-pointer">Round Trip</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-way" id="one-way" />
                <Label htmlFor="one-way" className="cursor-pointer">One Way</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <AirportSearchInput
              label="From"
              placeholder="Search airports, cities, or codes..."
              value={from}
              onChange={setFrom}
            />
            <AirportSearchInput
              label="To"
              placeholder="Search airports, cities, or codes..."
              value={to}
              onChange={setTo}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={swapDestinations}
              className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50 shadow-lg hidden md:block"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={swapDestinations}
              className="w-full md:hidden mt-2 flex items-center justify-center space-x-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Swap</span>
            </Button>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Departure Date</Label>
              <DatePicker
                date={departDate}
                onSelect={setDepartDate}
                placeholder="Select departure date"
                disabled={(date) => date < new Date()}
                className="w-full"
              />
            </div>
            {tripType === 'round-trip' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Return Date</Label>
                <DatePicker
                  date={returnDate}
                  onSelect={setReturnDate}
                  placeholder="Select return date"
                  disabled={(date) => date < new Date() || (departDate && date < departDate)}
                  minDate={departDate || new Date()}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Passengers and Cabin Class */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Passengers</Label>
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Adults</div>
                      <div className="text-sm text-gray-500">12+ years</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                        disabled={passengers.adults <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{passengers.adults}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({ ...prev, adults: Math.min(9, prev.adults + 1) }))}
                        disabled={passengers.adults >= 9}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Children</div>
                      <div className="text-sm text-gray-500">2-11 years</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                        disabled={passengers.children <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{passengers.children}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({ ...prev, children: Math.min(9, prev.children + 1) }))}
                        disabled={passengers.children >= 9}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Infants</div>
                      <div className="text-sm text-gray-500">Under 2 years</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({ ...prev, infants: Math.max(0, prev.infants - 1) }))}
                        disabled={passengers.infants <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{passengers.infants}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengers(prev => ({ ...prev, infants: Math.min(passengers.adults, prev.infants + 1) }))}
                        disabled={passengers.infants >= passengers.adults}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cabinClass" className="text-sm font-medium text-gray-700">Cabin Class</Label>
              <Select value={cabinClass} onValueChange={setCabinClass}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium-economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              onClick={handleSearch}
              disabled={!from || !to || !departDate}
            >
              <Search className="mr-2 h-5 w-5" />
              Search Flights
            </Button>
          </div>

          {/* Passenger Summary */}
          <div className="text-center text-sm text-gray-600">
            <span>
              {passengers.adults + passengers.children + passengers.infants} passenger{passengers.adults + passengers.children + passengers.infants > 1 ? 's' : ''} • {cabinClass.replace('-', ' ')} class
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightSearchForm;