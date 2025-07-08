import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FlightSearchForm from '@/components/FlightSearchForm';
import FlightResults from '@/components/FlightResults';
import { useFlightSearch, FlightSearchParams, FlightWithDetails } from '@/hooks/useFlightSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plane, ArrowLeft } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchFlights, loading, error } = useFlightSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchResults, setSearchResults] = useState<FlightWithDetails[]>([]);
  const [currentSearch, setCurrentSearch] = useState<FlightSearchParams | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Parse URL parameters and auto-search when component loads
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const departDate = searchParams.get('departDate');
    const returnDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults');
    const children = searchParams.get('children');
    const infants = searchParams.get('infants');
    const cabinClass = searchParams.get('cabinClass');
    const tripType = searchParams.get('tripType');

    if (from && to && departDate) {
      const searchData: FlightSearchParams = {
        from,
        to,
        departDate,
        returnDate: returnDate || undefined,
        passengers: {
          adults: parseInt(adults || '1'),
          children: parseInt(children || '0'),
          infants: parseInt(infants || '0'),
        },
        cabinClass: (cabinClass as 'economy' | 'premium-economy' | 'business' | 'first') || 'economy',
        tripType: (tripType as 'one-way' | 'round-trip') || 'round-trip',
      };
      
      handleSearch(searchData);
    }
  }, [searchParams]);

  const handleSearch = async (searchParams: FlightSearchParams) => {
    try {
      setCurrentSearch(searchParams);
      const results = await searchFlights(searchParams);
      setSearchResults(results);
      setShowResults(true);
      
      if (results.length === 0) {
        toast({
          title: "No flights found",
          description: "Try adjusting your search criteria",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleSelectFlight = (flight: FlightWithDetails) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a flight",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Store selected flight in sessionStorage for booking process
    sessionStorage.setItem('selectedFlight', JSON.stringify({
      flight,
      searchParams: currentSearch
    }));
    
    navigate('/booking');
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setSearchResults([]);
    setCurrentSearch(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Plane className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">SkyBound</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user.user_metadata?.first_name || user.email}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/profile')}
                  >
                    Profile
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Search Flights
              </h1>
              <p className="text-lg text-gray-600">
                Find the perfect flight for your journey
              </p>
            </div>
            
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <FlightSearchForm onSearch={handleSearch} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Search Form Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Card className="sticky top-24 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Search</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewSearch}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      New Search
                    </Button>
                  </div>
                  {currentSearch && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Route:</span> {currentSearch.from} → {currentSearch.to}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(currentSearch.departDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Passengers:</span> {currentSearch.passengers.adults + currentSearch.passengers.children + currentSearch.passengers.infants}
                      </div>
                      <div>
                        <span className="font-medium">Class:</span> {currentSearch.cabinClass.replace('-', ' ')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              {error ? (
                <Card className="text-center p-8">
                  <div className="text-red-600 mb-4">
                    <p className="font-semibold">Search Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button onClick={handleNewSearch}>
                    Try Again
                  </Button>
                </Card>
              ) : (
                <FlightResults
                  flights={searchResults}
                  cabinClass={currentSearch?.cabinClass || 'economy'}
                  onSelectFlight={handleSelectFlight}
                  loading={loading}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;