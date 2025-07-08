import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAirportSearch } from '@/hooks/useAirportSearch';
import { Plane, MapPin, Loader2 } from 'lucide-react';

interface AirportSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const AirportSearchInput: React.FC<AirportSearchInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const { airports, loading, searchAirports } = useAirportSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        searchAirports(searchQuery);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, searchAirports]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase();
    setSearchQuery(inputValue);
    onChange(inputValue);
  };

  const handleSelectAirport = (airport: any) => {
    onChange(airport.iata_code);
    setSearchQuery(airport.iata_code);
    setIsOpen(false);
  };

  return (
    <div className="relative space-y-2">
      <Label htmlFor={label} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Plane className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={label}
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setIsOpen(true)}
          className={`pl-10 h-12 text-base uppercase transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${className}`}
          maxLength={50}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && airports.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95"
        >
          {airports.map((airport) => (
            <div
              key={airport.id}
              onClick={() => handleSelectAirport(airport)}
              className="p-3 hover:bg-muted cursor-pointer transition-colors duration-150 border-b border-border/50 last:border-b-0 group"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-foreground text-sm">
                      {airport.iata_code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {airport.city}, {airport.country}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {airport.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};