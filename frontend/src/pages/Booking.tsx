import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createBooking, generateBookingReference } from '@/services/api/bookings';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import type { FlightWithDetails } from '@/types';
import { Plane, Users, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';

interface BookingData {
  flight: FlightWithDetails;
  searchParams: any;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getPrice } = useFlightSearch();
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  useEffect(() => {
    // Get selected flight from sessionStorage
    const storedData = sessionStorage.getItem('selectedFlight');
    if (storedData) {
      const data: BookingData = JSON.parse(storedData);
      setBookingData(data);
      
      // Initialize passenger forms
      const totalPassengers = data.searchParams.passengers.adults + 
                             data.searchParams.passengers.children + 
                             data.searchParams.passengers.infants;
      
      const initialPassengers = Array.from({ length: totalPassengers }, (_, index) => ({
        type: index < data.searchParams.passengers.adults ? 'adult' : 
              index < data.searchParams.passengers.adults + data.searchParams.passengers.children ? 'child' : 'infant',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        passport_number: '',
        nationality: ''
      }));
      
      setPassengers(initialPassengers);
    } else {
      navigate('/search');
    }
  }, [navigate]);

  const handlePassengerChange = (index: number, field: string, value: string) => {
    setPassengers(prev => prev.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    ));
  };

  const handleBooking = async () => {
    if (!bookingData || !user) return;

    setLoading(true);
    try {
      // Calculate total amount
      const totalAmount = getPrice(bookingData.flight, bookingData.searchParams.cabinClass) * passengers.length;
      
      // Prepare booking data for API
      const bookingRequestData = {
        trip_type: bookingData.searchParams.tripType,
        total_amount: totalAmount,
        flights: [
          {
            flight_id: bookingData.flight.id,
            is_return_flight: false
          }
        ],
        passengers: passengers.map(passenger => ({
          type: passenger.type,
          first_name: passenger.first_name,
          last_name: passenger.last_name,
          date_of_birth: passenger.date_of_birth || null,
          passport_number: passenger.passport_number || null,
          nationality: passenger.nationality || null,
          cabin_class: bookingData.searchParams.cabinClass
        }))
      };
      
      // Create booking using API client
      const bookingDetails = await createBooking(bookingRequestData);

      // Clear session storage
      sessionStorage.removeItem('selectedFlight');

      toast({
        title: 'Booking Successful',
        description: `Your booking reference is ${bookingDetails.booking_reference}`,
        variant: 'default',
      });

      // Navigate to confirmation page
      navigate(`/booking-confirmation/${bookingDetails.id}`);

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const totalAmount = getPrice(bookingData.flight, bookingData.searchParams.cabinClass) * passengers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/search')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Search</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Plane className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">SkyBound</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-lg text-gray-600">Please provide passenger details and payment information</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Summary */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <span>Flight Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={bookingData.flight.airline.logo_url || '/placeholder.svg'}
                      alt={bookingData.flight.airline.name}
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <p className="font-semibold">{bookingData.flight.airline.name}</p>
                      <p className="text-sm text-gray-600">{bookingData.flight.flight_number}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {bookingData.searchParams.cabinClass.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="font-semibold">{bookingData.flight.origin_airport.iata_code}</p>
                    <p className="text-sm">{bookingData.flight.origin_airport.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">To</p>
                    <p className="font-semibold">{bookingData.flight.destination_airport.iata_code}</p>
                    <p className="text-sm">{bookingData.flight.destination_airport.city}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Details */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Passenger Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Passenger {index + 1}</h3>
                      <Badge variant="secondary" className="capitalize">{passenger.type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`first_name_${index}`}>First Name</Label>
                        <Input
                          id={`first_name_${index}`}
                          value={passenger.first_name}
                          onChange={(e) => handlePassengerChange(index, 'first_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`last_name_${index}`}>Last Name</Label>
                        <Input
                          id={`last_name_${index}`}
                          value={passenger.last_name}
                          onChange={(e) => handlePassengerChange(index, 'last_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`date_of_birth_${index}`}>Date of Birth</Label>
                        <Input
                          id={`date_of_birth_${index}`}
                          type="date"
                          value={passenger.date_of_birth}
                          onChange={(e) => handlePassengerChange(index, 'date_of_birth', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`passport_${index}`}>Passport Number</Label>
                        <Input
                          id={`passport_${index}`}
                          value={passenger.passport_number}
                          onChange={(e) => handlePassengerChange(index, 'passport_number', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="card_name">Cardholder Name</Label>
                  <Input
                    id="card_name"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="card_number">Card Number</Label>
                  <Input
                    id="card_number"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card_expiry">Expiry Date</Label>
                    <Input
                      id="card_expiry"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card_cvc">CVC</Label>
                    <Input
                      id="card_cvc"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cvc: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Flight Price</span>
                    <span>${getPrice(bookingData.flight, bookingData.searchParams.cabinClass)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Passengers</span>
                    <span>{passengers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxes & Fees</span>
                    <span>$0</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${totalAmount}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleBooking}
                  disabled={loading || passengers.some(p => !p.first_name || !p.last_name)}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirm Booking</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;