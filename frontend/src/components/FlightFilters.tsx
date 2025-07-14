import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FlightFilters as FilterOptions, FlightSorting } from '@/hooks/useFlightSearch';
import { Airline } from '@/types';

interface FlightFiltersProps {
  minPrice: number;
  maxPrice: number;
  airlines: Airline[];
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sorting: FlightSorting) => void;
  onReset: () => void;
  className?: string;
}

const FlightFilters: React.FC<FlightFiltersProps> = ({
  minPrice,
  maxPrice,
  airlines,
  onFilterChange,
  onSortChange,
  onReset,
  className = '',
}) => {
  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('price');
  const [sortOrder, setSortOrder] = useState<string>('asc');

  // Handle price range change
  const handlePriceRangeChange = (values: number[]) => {
    const [min, max] = values as [number, number];
    setPriceRange([min, max]);
    applyFilters({ minPrice: min, maxPrice: max, airlineId: selectedAirline || undefined });
  };

  // Handle airline selection
  const handleAirlineChange = (airlineId: string) => {
    setSelectedAirline(airlineId === 'all' ? null : airlineId);
    applyFilters({ 
      minPrice: priceRange[0], 
      maxPrice: priceRange[1], 
      airlineId: airlineId === 'all' ? undefined : airlineId 
    });
  };

  // Apply filters
  const applyFilters = (filters: FilterOptions) => {
    onFilterChange(filters);
  };

  // Handle sort change
  const handleSortChange = (field: string, value: string) => {
    if (field === 'sortBy') {
      setSortBy(value);
      onSortChange({ sortBy: value as FlightSorting['sortBy'], sortOrder: sortOrder as FlightSorting['sortOrder'] });
    } else {
      setSortOrder(value);
      onSortChange({ sortBy: sortBy as FlightSorting['sortBy'], sortOrder: value as FlightSorting['sortOrder'] });
    }
  };

  // Reset all filters and sorting
  const handleReset = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedAirline(null);
    setSortBy('price');
    setSortOrder('asc');
    onReset();
  };

  return (
    <Card className={`bg-white/10 backdrop-blur-md border-white/20 shadow-lg text-white ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Filter & Sort</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="text-sm text-blue-300 hover:text-blue-100 hover:bg-blue-800/30"
          >
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible defaultValue="price" className="w-full">
          {/* Price Range Filter */}
          <AccordionItem value="price" className="border-white/20">
            <AccordionTrigger className="text-white hover:text-white/90 py-2">Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between">
                  <span>${priceRange[0].toFixed(0)}</span>
                  <span>${priceRange[1].toFixed(0)}</span>
                </div>
                <Slider
                  min={minPrice}
                  max={maxPrice}
                  step={10}
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  className="my-4"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Airline Filter */}
          <AccordionItem value="airline" className="border-white/20">
            <AccordionTrigger className="text-white hover:text-white/90 py-2">Airline</AccordionTrigger>
            <AccordionContent>
              <Select 
                value={selectedAirline || 'all'} 
                onValueChange={handleAirlineChange}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="All Airlines" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-white/20">
                  <SelectItem value="all">All Airlines</SelectItem>
                  {airlines.map((airline) => (
                    <SelectItem key={airline.id} value={airline.id} className="flex items-center gap-2">
                      {airline.logo_url && (
                        <img 
                          src={airline.logo_url} 
                          alt={airline.name} 
                          className="h-4 w-4 rounded-full bg-white p-0.5 object-contain inline mr-2" 
                        />
                      )}
                      {airline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* Sorting Options */}
          <AccordionItem value="sorting" className="border-white/20">
            <AccordionTrigger className="text-white hover:text-white/90 py-2">Sort By</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Sort Criteria</Label>
                  <Select 
                    value={sortBy} 
                    onValueChange={(value) => handleSortChange('sortBy', value)}
                  >
                    <SelectTrigger id="sortBy" className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-white/20">
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                      <SelectItem value="departure_time">Departure Time</SelectItem>
                      <SelectItem value="arrival_time">Arrival Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Order</Label>
                  <Select 
                    value={sortOrder} 
                    onValueChange={(value) => handleSortChange('sortOrder', value)}
                  >
                    <SelectTrigger id="sortOrder" className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-white/20">
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FlightFilters;
