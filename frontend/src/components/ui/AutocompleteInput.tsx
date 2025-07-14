import { Input } from '@/components/ui/input';
import { useAirportSuggestions } from '@/hooks/useAirportSuggestions';
import { Airport } from '@/utils/indexedDBService';
import { Loader2, Plane } from 'lucide-react';
import React, { useState } from 'react';

interface AutocompleteInputProps {
  value: string;    
  onValueChange: (value: string) => void;
  onSelect: (airport: Airport) => void;
  placeholder?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
  value, 
  onValueChange, 
  onSelect, 
  placeholder 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { suggestions, loading, searchAirports } = useAirportSuggestions();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onValueChange(query);
    searchAirports(query);
  };

  const handleSelectSuggestion = (airport: Airport) => {
    onSelect(airport);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full">
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click on suggestions
        placeholder={placeholder}
        className="peer"
      />
      {isFocused && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-60 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          )}
          {!loading && suggestions.length === 0 && value.length > 2 && (
            <p className="p-4 text-sm text-gray-500">No airports found.</p>
          )}
          {!loading && suggestions.map((airport) => (
            <div
              key={airport.id}
              onMouseDown={() => handleSelectSuggestion(airport)} // Use onMouseDown to prevent blur event firing first
              className="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Plane className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {airport.city}, {airport.country} ({airport.iata_code})
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{airport.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
