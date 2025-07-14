import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Search } from 'lucide-react';
import { FlightSearchParams } from '@/hooks/useFlightSearch';
import { DatePicker } from '@/components/DatePicker';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { Airport } from '@/utils/indexedDBService';

interface ModifySearchFormProps {
  onSearch: (params: FlightSearchParams) => void;
  initialState: FlightSearchParams;
  loading: boolean;
}

export const ModifySearchForm: React.FC<ModifySearchFormProps> = ({ onSearch, initialState, loading }) => {
  const [from, setFrom] = useState(initialState.from);
  const [to, setTo] = useState(initialState.to);
  const [fromAirport, setFromAirport] = useState<Airport | null>(null);
  const [toAirport, setToAirport] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState<Date | undefined>();
  const [passengers, setPassengers] = useState(initialState.passengers);

  useEffect(() => {
    setFrom(initialState.from);
    setTo(initialState.to);
    setDepartDate(new Date(initialState.departureDate));
    setPassengers(initialState.passengers);
    // We don't have the full airport objects here, so we'll start with them as null.
    // The search logic will fall back to the initial IATA codes if they are not changed.
  }, [initialState]);

  const handleUpdateSearch = () => {
    if (!departDate || !from || !to) return;

    const searchParams: FlightSearchParams = {
      ...initialState,
      from: fromAirport ? fromAirport.iata_code : initialState.from,
      to: toAirport ? toAirport.iata_code : initialState.to,
      departureDate: departDate.toISOString(),
      passengers,
    };

    onSearch(searchParams);
  };

  return (
    <Card className="sticky top-24 bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Modify Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* From and To */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">From</Label>
          <AutocompleteInput
            value={from}
            onValueChange={setFrom}
            onSelect={(airport) => {
              setFromAirport(airport);
              setFrom(`${airport.city} (${airport.iata_code})`);
            }}
            placeholder="Origin city or airport"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">To</Label>
          <AutocompleteInput
            value={to}
            onValueChange={setTo}
            onSelect={(airport) => {
              setToAirport(airport);
              setTo(`${airport.city} (${airport.iata_code})`);
            }}
            placeholder="Destination city or airport"
          />
        </div>
        {/* Departure Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">Departure Date</Label>
          <DatePicker
            date={departDate}
            onSelect={setDepartDate}
            placeholder="Select departure date"
            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
            className="w-full bg-white/20 border-white/30 text-white"
          />
        </div>

        {/* Passengers */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-200">Passengers</Label>
          <Card className="p-4 bg-black/20 border-white/20">
            <div className="space-y-4">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div className="font-medium text-white">Adults <span className="text-xs text-gray-400">(12+)</span></div>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPassengers(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))} disabled={passengers.adults <= 1} className="bg-transparent border-white/50 text-white hover:bg-white/20"> <Minus className="h-3 w-3" /> </Button>
                  <span className="w-8 text-center font-medium text-white">{passengers.adults}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPassengers(p => ({ ...p, adults: p.adults + 1 }))} className="bg-transparent border-white/50 text-white hover:bg-white/20"> <Plus className="h-3 w-3" /> </Button>
                </div>
              </div>
              {/* Children */}
              <div className="flex items-center justify-between">
                <div className="font-medium text-white">Children <span className="text-xs text-gray-400">(2-11)</span></div>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPassengers(p => ({ ...p, children: Math.max(0, p.children - 1) }))} disabled={passengers.children <= 0} className="bg-transparent border-white/50 text-white hover:bg-white/20"> <Minus className="h-3 w-3" /> </Button>
                  <span className="w-8 text-center font-medium text-white">{passengers.children}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPassengers(p => ({ ...p, children: p.children + 1 }))} className="bg-transparent border-white/50 text-white hover:bg-white/20"> <Plus className="h-3 w-3" /> </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Button */}
        <Button onClick={handleUpdateSearch} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg py-6 transition-all duration-300 shadow-lg">
          {loading ? 'Searching...' : <><Search className="mr-2 h-5 w-5" /> Update Search</>}
        </Button>
      </CardContent>
    </Card>
  );
};
