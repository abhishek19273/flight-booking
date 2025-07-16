import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FlightSearchForm from '@/components/FlightSearchForm';
import { ModifySearchForm } from '@/components/ModifySearchForm';
import FlightCard from '@/components/FlightCard';
import RoundTripFlightCard from '@/components/RoundTripFlightCard';
import { useFlightSearch, FlightSearchParams } from '@/hooks/useFlightSearch';
import { useIndexedDBFlightCache } from '@/hooks/useIndexedDBFlightCache';
import { FlightResultsSkeleton } from '@/components/FlightResultsSkeleton';
import { AlertCircle, Frown, Plane, ArrowLeft, WifiOff, Database } from 'lucide-react';
import { CabinClass, FlightWithDetails } from '@/types';

// FlightList component to display flights
const FlightList: React.FC<{ 
  flights: FlightWithDetails[]; 
  cabinClass: CabinClass; 
  onSelectFlight: (flight: FlightWithDetails) => void;
  onSelectRoundTrip: (outbound: FlightWithDetails, returnFlight: FlightWithDetails) => void;
  isRoundTrip: boolean;
}> = ({ flights, cabinClass, onSelectFlight, onSelectRoundTrip, isRoundTrip }) => {
  if (flights.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-white text-lg">No flights found matching your criteria.</p>
      </div>
    );
  }

  // For round trips, organize flights by outbound and return
  if (isRoundTrip) {
    const outboundFlights = flights.filter(flight => !flight.is_return);
    const returnFlights = flights.filter(flight => flight.is_return);
    
    // If we have both outbound and return flights, display them as pairs
    if (outboundFlights.length > 0 && returnFlights.length > 0) {
      // Create all possible combinations of outbound and return flights
      const combinations: { outbound: FlightWithDetails, return: FlightWithDetails }[] = [];
      
      // Limit to a reasonable number of combinations to avoid performance issues
      const maxCombinations = 20;
      let count = 0;
      
      for (const outbound of outboundFlights) {
        for (const returnFlight of returnFlights) {
          combinations.push({ outbound, return: returnFlight });
          count++;
          if (count >= maxCombinations) break;
        }
        if (count >= maxCombinations) break;
      }
      
      return (
        <div className="space-y-6">
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">Round Trip Options</h3>
            <p className="text-sm text-blue-200">Showing {combinations.length} round trip combinations</p>
          </div>
          
          {combinations.map((combo, index) => (
            <RoundTripFlightCard
              key={`${combo.outbound.id}-${combo.return.id}`}
              outboundFlight={combo.outbound}
              returnFlight={combo.return}
              cabinClass={cabinClass}
              onSelectFlights={(outbound, returnFlight) => onSelectRoundTrip(outbound, returnFlight)}
            />
          ))}
        </div>
      );
    }
  }

  // Default view for one-way trips or if round-trip organization fails
  return (
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
  );
};
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [searched, setSearched] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<FlightSearchParams | null>(null);
  const [usingCachedResults, setUsingCachedResults] = useState(false);

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

  const handleSearch = async (params: FlightSearchParams, updateURL = true) => {
    setSearched(true);
    
    // Validate and ensure all required parameters are present with defaults
    const validatedParams: FlightSearchParams = {
      ...params,
      from: params.from || '',
      to: params.to || '',
      departureDate: params.departureDate || new Date().toISOString(),
      tripType: params.tripType || 'one-way',
      cabinClass: params.cabinClass || 'economy',
      passengers: {
        adults: params.passengers?.adults || 1,
        children: params.passengers?.children || 0,
        infants: params.passengers?.infants || 0
      }
    };
    
    setCurrentSearch(validatedParams);
    
    if (updateURL) {
      // Update URL with search parameters
      const newParams = new URLSearchParams();
      newParams.set('from', validatedParams.from);
      newParams.set('to', validatedParams.to);
      newParams.set('departureDate', validatedParams.departureDate);
      newParams.set('tripType', validatedParams.tripType);
      newParams.set('cabinClass', validatedParams.cabinClass);
      newParams.set('adults', validatedParams.passengers.adults.toString());
      newParams.set('children', validatedParams.passengers.children.toString());
      newParams.set('infants', validatedParams.passengers.infants.toString());
      
      if (validatedParams.tripType === 'round-trip' && validatedParams.returnDate) {
        newParams.set('returnDate', validatedParams.returnDate);
      }
      
      setSearchParams(newParams);
    }
    
    try {
      console.log('Starting flight search with validated params:', validatedParams);
      
      // Clear expired cache entries
      if (isCacheAvailable) {
        await clearExpired();
      }
      setUsingCachedResults(false);

      // First check for cached results if we're offline or if cache is available
      if (isCacheAvailable) {
        const cachedResults = await getCachedResults(validatedParams);
        
        if (isOffline && cachedResults) {
          console.log('Using cached results while offline');
          setResults(cachedResults);
          setUsingCachedResults(true);
          return;
        }
      }
      
      // If we're online, fetch fresh results
      if (!isOffline) {
        try {
          console.log('Fetching fresh results from API with validated params');
          const searchResults = await searchFlights(validatedParams);
          console.log('API search successful, got results:', searchResults.length);
          setResults(searchResults);
          setUsingCachedResults(false);
          
          // Cache the results for future use
          if (isCacheAvailable && searchResults.length > 0) {
            await saveResults(validatedParams, searchResults);
          }
        } catch (apiError) {
          console.error('API search failed:', apiError);
          
          // Try to get from cache as fallback
          if (isCacheAvailable) {
            const cachedResults = await getCachedResults(validatedParams);
            if (cachedResults && cachedResults.length > 0) {
              console.log('Using cached results after API failure');
              setResults(cachedResults);
              setUsingCachedResults(true);
              return;
            }
          }
          
          // No API results and no cache - show error
          setResults([]);
          throw apiError;
        }
      } else if (!isCacheAvailable || !(await getCachedResults(validatedParams))) {
        // We're offline and have no cached results
        console.warn('No internet connection and no cached results available');
        setResults([]);
        throw new Error('No internet connection and no cached results available');
      }
    } catch (err) {
      if (isOffline) {
        toast({
          title: 'Offline Mode',
          description: 'You are currently offline with no cached results for this search.',
          variant: 'destructive',
        });
      }
      setResults([]);
    }
  };

  useEffect(() => {
    if (initialSearchParams) {
      handleSearch(initialSearchParams, false);
    }
    
    // Clear expired cache entries when component mounts
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
      navigate('/login');
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

  const handleSelectRoundTrip = (outboundFlight: FlightWithDetails, returnFlight: FlightWithDetails) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to book a flight.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (currentSearch) {
      const bookingData = {
        outboundFlight: outboundFlight,
        returnFlight: returnFlight,
        searchParams: currentSearch,
      };
      sessionStorage.setItem('selectedRoundTrip', JSON.stringify(bookingData));
      navigate('/booking');
    } else {
      toast({
        title: 'Error',
        description: 'Could not retrieve search parameters. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
            
            {loading && !usingCachedResults && <FlightResultsSkeleton />}
            {error && !loading && !usingCachedResults && (
              <Card className="bg-red-500/20 border-red-500/50 p-8 rounded-lg">
                <div className="flex flex-col items-center justify-center">
                  <AlertCircle className="h-16 w-16 text-red-300 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong.</h3>
                  <p className="text-red-200 text-center">{error}</p>
                </div>
              </Card>
            )}
            {!loading && !error && results.length === 0 && !usingCachedResults && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 rounded-lg">
                <div className="flex flex-col items-center justify-center">
                  <Frown className="h-16 w-16 text-blue-300 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">No flights found</h3>
                  <p className="text-blue-200 text-center">We couldn't find any flights matching your search criteria. <br />Please try adjusting your search.</p>
                </div>
              </Card>
            )}
            {results.length > 0 && (
              <FlightList 
                flights={results} 
                cabinClass={currentSearch?.cabinClass || 'economy'}
                onSelectFlight={handleSelectFlight}
                onSelectRoundTrip={handleSelectRoundTrip}
                isRoundTrip={currentSearch?.tripType === 'round-trip'}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;