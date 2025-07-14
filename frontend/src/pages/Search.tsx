import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FlightSearchForm from '@/components/FlightSearchForm';
import { ModifySearchForm } from '@/components/ModifySearchForm';
import FlightList from '@/components/FlightList';
import FlightFilters from '@/components/FlightFilters';
import { 
  useFlightSearch, 
  FlightSearchParams, 
  FlightWithDetails,
  FlightFilters as FilterOptions,
  FlightSorting 
} from '@/hooks/useFlightSearch';
import { useIndexedDBFlightCache } from '@/hooks/useIndexedDBFlightCache';
import { FlightResultsSkeleton } from '@/components/FlightResultsSkeleton';
import { AlertCircle, Frown, Plane, ArrowLeft, WifiOff, Database, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchFlights, loading, error } = useFlightSearch();
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    getCachedResults, 
    saveResults, 
    clearExpired, 
    isCacheAvailable, 
    isOffline 
  } = useIndexedDBFlightCache();

  const [results, setResults] = useState<FlightWithDetails[]>([]);
  const [filteredResults, setFilteredResults] = useState<FlightWithDetails[]>([]);
  const [searched, setSearched] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<FlightSearchParams | null>(null);
  const [usingCachedResults, setUsingCachedResults] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const [currentSorting, setCurrentSorting] = useState<FlightSorting>({ sortBy: 'price', sortOrder: 'asc' });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const initialSearchParams = useMemo(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const departureDate = searchParams.get('departureDate');
    if (from && to && departureDate) {
      return {
        from,
        to,
        departureDate,
        returnDate: searchParams.get('returnDate') || undefined,
        passengers: {
          adults: parseInt(searchParams.get('adults') || '1'),
          children: parseInt(searchParams.get('children') || '0'),
          infants: parseInt(searchParams.get('infants') || '0'),
        },
        cabinClass: (searchParams.get('cabinClass') as FlightSearchParams['cabinClass']) || 'economy',
        tripType: (searchParams.get('tripType') as FlightSearchParams['tripType']) || 'one-way',
      };
    }
    return null;
  }, [searchParams]);

  const handleSearch = async (params: FlightSearchParams, updateUrl = true) => {
    if (updateUrl) {
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('from', params.from);
      newSearchParams.set('to', params.to);
      newSearchParams.set('departureDate', params.departureDate);
      if (params.returnDate) newSearchParams.set('returnDate', params.returnDate);
      newSearchParams.set('adults', params.passengers.adults.toString());
      newSearchParams.set('children', params.passengers.children.toString());
      newSearchParams.set('infants', params.passengers.infants.toString());
      newSearchParams.set('cabinClass', params.cabinClass);
      newSearchParams.set('tripType', params.tripType);
      setSearchParams(newSearchParams);
    }

    setCurrentSearch(params);
    setSearched(true);
    setUsingCachedResults(false);
    setCurrentFilters({});
    setCurrentSorting({ sortBy: 'price', sortOrder: 'asc' });

    try {
      if (isCacheAvailable) {
        const cachedResults = await getCachedResults(params);
        
        if (isOffline && cachedResults) {
          setResults(cachedResults);
          setFilteredResults(cachedResults);
          setUsingCachedResults(true);
          return;
        }
        
        if (cachedResults) {
          setResults(cachedResults);
          setFilteredResults(cachedResults);
          setUsingCachedResults(true);
        }
      }
      
      if (!isOffline) {
        const searchResults = await searchFlights(params, currentFilters, currentSorting);
        setResults(searchResults);
        setFilteredResults(searchResults);
        setUsingCachedResults(false);
        
        if (isCacheAvailable) {
          await saveResults(searchResults);
        }
      }
    } catch (err) {
      toast({
        title: "Error searching flights",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = async (filters: FilterOptions) => {
    setCurrentFilters(filters);
    
    if (currentSearch) {
      try {
        if (isOffline) {
          const filteredResults = await searchFlights(currentSearch, filters, currentSorting);
          setFilteredResults(filteredResults);
        } else {
          const searchResults = await searchFlights(currentSearch, filters, currentSorting);
          setFilteredResults(searchResults);
        }
      } catch (err) {
        toast({
          title: "Error applying filters",
          description: err instanceof Error ? err.message : "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const handleSortChange = async (sorting: FlightSorting) => {
    setCurrentSorting(sorting);
    
    if (currentSearch) {
      try {
        if (isOffline) {
          const sortedResults = await searchFlights(currentSearch, currentFilters, sorting);
          setFilteredResults(sortedResults);
        } else {
          const searchResults = await searchFlights(currentSearch, currentFilters, sorting);
          setFilteredResults(searchResults);
        }
      } catch (err) {
        toast({
          title: "Error applying sorting",
          description: err instanceof Error ? err.message : "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  };

  const handleResetFilters = async () => {
    setCurrentFilters({});
    setCurrentSorting({ sortBy: 'price', sortOrder: 'asc' });
    
    if (currentSearch && results.length > 0) {
      setFilteredResults(results);
    }
  };

  useEffect(() => {
    if (initialSearchParams) {
      handleSearch(initialSearchParams, false);
    }
    
    if (isCacheAvailable) {
      clearExpired();
    }
  }, [initialSearchParams, isCacheAvailable, clearExpired]);

  const handleSelectFlight = (flight: FlightWithDetails) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to book a flight.',
        variant: 'destructive',
      });
      navigate('/auth/login');
      return;
    }

    if (currentSearch) {
      const bookingData = {
        flight: flight,
        searchParams: currentSearch,
      };
      sessionStorage.setItem('selectedFlight', JSON.stringify(bookingData));
      navigate('/booking');
    } else {
      toast({
        title: 'Error',
        description: 'Could not retrieve search parameters. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate unique airlines for filtering options
  const airlines = useMemo(() => {
    if (!results.length) return [];
    
    const uniqueAirlines = new Map();
    results.forEach(flight => {
      if (!uniqueAirlines.has(flight.airline.id)) {
        uniqueAirlines.set(flight.airline.id, flight.airline);
      }
    });
    
    return Array.from(uniqueAirlines.values());
  }, [results]);

  // Calculate price range for filtering options
  const priceRange = useMemo(() => {
    if (!results.length || !currentSearch) return { min: 0, max: 1000 };
    
    const cabinClass = currentSearch.cabinClass;
    const priceField = `${cabinClass.replace('-', '_')}_price` as keyof FlightWithDetails;
    
    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;
    
    results.forEach(flight => {
      const price = flight[priceField] as number;
      if (price < min) min = price;
      if (price > max) max = price;
    });
    
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [results, currentSearch]);
  
  if (!searched) {
    return (
      <div className="relative w-full h-screen">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img
          src="https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1920&q=80"
          alt="Woman on a swing overlooking a beautiful landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex items-center justify-center h-full p-4">
          <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-8 shadow-2xl">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                <span className="block">Find Your Perfect Flight</span>
                <span className="block text-blue-300 mt-1">Book Your Next Adventure</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-sm text-blue-100 sm:text-base md:mt-5 md:text-lg md:max-w-3xl">
                Enter your travel details below to find the best flights for your journey.
              </p>
            </div>
            <FlightSearchForm onSearch={handleSearch} initialState={initialSearchParams || undefined} />
          </div>
        </div>
      </div>
    );
  }

  const renderResults = () => {
    if (loading) {
      return <FlightResultsSkeleton />
    }

    if (error) {
      return (
        <Alert variant="destructive" className="bg-red-900/50 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (filteredResults.length === 0 && searched) {
      return (
        <div className="text-center py-12">
          <Frown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No flights found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your search criteria or filters</p>
          <Button onClick={() => navigate('/')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> New Search
          </Button>
        </div>
      );
    }

    if (filteredResults.length > 0) {
      return (
        <div className="space-y-4">
          {usingCachedResults && (
            <Alert className="bg-blue-900/50 border-blue-800">
              <Database className="h-4 w-4" />
              <AlertTitle>Using cached results</AlertTitle>
              <AlertDescription>
                {isOffline ? 
                  "You're offline. Showing previously cached results." : 
                  "Showing cached results while fetching the latest data."}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {filteredResults.length} {filteredResults.length === 1 ? 'flight' : 'flights'} found
            </h2>
            
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="md:hidden border-white/20 text-white hover:bg-white/10"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-gray-900 text-white border-white/20">
                <FlightFilters
                  minPrice={priceRange.min}
                  maxPrice={priceRange.max}
                  airlines={airlines}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  onReset={handleResetFilters}
                  className="border-none shadow-none bg-transparent"
                />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="hidden md:block md:w-1/4 lg:w-1/5">
              <FlightFilters
                minPrice={priceRange.min}
                maxPrice={priceRange.max}
                airlines={airlines}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onReset={handleResetFilters}
              />
            </div>
            
            <div className="md:w-3/4 lg:w-4/5">
              <FlightList 
                flights={filteredResults} 
                cabinClass={currentSearch?.cabinClass || 'economy'} 
                onSelectFlight={handleSelectFlight}
                tripType={currentSearch?.tripType || 'one-way'}
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
       <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-white" />
              <span className="text-xl font-bold">Sky-Bound Journeys</span>
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            {currentSearch && (
              <ModifySearchForm 
                onSearch={handleSearch} 
                initialState={currentSearch} 
                loading={loading} 
              />
            )}
          </aside>

          <main className="lg:col-span-3">
            {isOffline && (
              <Alert className="mb-4 bg-amber-500/20 border-amber-500/50">
                <WifiOff className="h-4 w-4 text-amber-300" />
                <AlertTitle className="text-amber-200">Offline Mode</AlertTitle>
                <AlertDescription className="text-amber-100">
                  You are currently offline. {usingCachedResults ? 'Showing cached results.' : 'No cached results available for this search.'}
                </AlertDescription>
              </Alert>
            )}
            
            {usingCachedResults && !isOffline && (
              <Alert className="mb-4 bg-blue-500/20 border-blue-500/50">
                <Database className="h-4 w-4 text-blue-300" />
                <AlertTitle className="text-blue-200">Using Cached Results</AlertTitle>
                <AlertDescription className="text-blue-100">
                  Showing cached results while fetching the latest data...
                </AlertDescription>
              </Alert>
            )}
            
            {renderResults()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;