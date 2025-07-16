import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { createBooking } from '@/services/api/bookings';
import type { FlightWithDetails } from '@/types';
import { ArrowLeft, CreditCard, Plane, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

interface OneWayBookingData {
  flight: FlightWithDetails;
  searchParams: any;
}

interface RoundTripBookingData {
  outboundFlight: FlightWithDetails;
  returnFlight: FlightWithDetails;
  searchParams: any;
}

type BookingData = OneWayBookingData | RoundTripBookingData;

// Form Type Definitions
export interface PassengerForm {
  type: 'adult' | 'child' | 'infant';
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number: string;
  nationality: string;
}

export interface PaymentForm {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export interface BookingFormValues {
  passengers: PassengerForm[];
  payment: PaymentForm;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getPrice } = useFlightSearch();
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<BookingFormValues>({
    mode: 'onTouched',
    defaultValues: {
      passengers: Array.from({ length: 0 }, (_, i) => ({
        type: i === 0 ? 'adult' : 'child', // Simplified logic
        first_name: '',
        last_name: '',
        date_of_birth: '',
        passport_number: '',
        nationality: '',
      })),
      payment: {
        number: '',
        expiry: '',
        cvc: '',
        name: '',
      },
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'passengers',
  });

  useEffect(() => {
    // Check for one-way flight booking
    const storedOneWayData = sessionStorage.getItem('selectedFlight');
    // Check for round-trip flight booking
    const storedRoundTripData = sessionStorage.getItem('selectedRoundTrip');
    
    if (storedOneWayData) {
      const data = JSON.parse(storedOneWayData) as OneWayBookingData;
      setBookingData(data);
      
      // Initialize passenger forms
      const totalPassengers = data.searchParams.passengers.adults + 
                             data.searchParams.passengers.children + 
                             data.searchParams.passengers.infants;
      
      const initialPassengers: PassengerForm[] = Array.from({ length: totalPassengers }, (_, index) => ({
        type: index < data.searchParams.passengers.adults ? 'adult' : 
              index < data.searchParams.passengers.adults + data.searchParams.passengers.children ? 'child' : 'infant',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        passport_number: '',
        nationality: ''
      }));
      
      replace(initialPassengers);
    } else if (storedRoundTripData) {
      const data = JSON.parse(storedRoundTripData) as RoundTripBookingData;
      setBookingData(data);
      
      const totalPassengers = data.searchParams.passengers.adults + 
                             data.searchParams.passengers.children + 
                             data.searchParams.passengers.infants;
      
      const initialPassengers: PassengerForm[] = Array.from({ length: totalPassengers }, (_, index) => ({
        type: index < data.searchParams.passengers.adults ? 'adult' : 
              index < data.searchParams.passengers.adults + data.searchParams.passengers.children ? 'child' : 'infant',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        passport_number: '',
        nationality: ''
      }));
      
      replace(initialPassengers);
    } else {
      navigate('/search');
    }
  }, [navigate, replace]);

  const handleBooking = async (data: any) => {
    if (!bookingData || !user) return;

    setLoading(true);
    try {
      // Calculate total amount based on booking type
      let totalAmount = 0;
      let flights = [];
      const numPassengers = data.passengers.length;

      if ('flight' in bookingData) {
        totalAmount = getPrice(bookingData.flight, bookingData.searchParams.cabinClass) * numPassengers;
        flights.push({ flight_id: bookingData.flight.id, is_return_flight: false });
      } else {
        totalAmount = (getPrice(bookingData.outboundFlight, bookingData.searchParams.cabinClass) + getPrice(bookingData.returnFlight, bookingData.searchParams.cabinClass)) * numPassengers;
        flights.push({ flight_id: bookingData.outboundFlight.id, is_return_flight: false });
        flights.push({ flight_id: bookingData.returnFlight.id, is_return_flight: true });
      }

      const bookingRequestData = {
        trip_type: 'flight' in bookingData ? 'one-way' : 'round-trip',
        total_amount: totalAmount,
        flights: flights,
        passengers: data.passengers.map((p: any) => ({ ...p, cabin_class: bookingData.searchParams.cabinClass }))
      };
      
      // Create booking using API client
      const bookingDetails = await createBooking(bookingRequestData);

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

  const numPassengers = fields.length > 0 ? fields.length : (bookingData.searchParams.passengers.adults + bookingData.searchParams.passengers.children + bookingData.searchParams.passengers.infants);
  const totalAmount = 'flight' in bookingData
    ? getPrice(bookingData.flight, bookingData.searchParams.cabinClass) * numPassengers
    : (getPrice(bookingData.outboundFlight, bookingData.searchParams.cabinClass) + 
       (bookingData.returnFlight ? getPrice(bookingData.returnFlight, bookingData.searchParams.cabinClass) : 0)) * numPassengers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
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
          <form onSubmit={handleSubmit(handleBooking)} className="lg:col-span-2 space-y-6">
            {/* Flight Details Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <span>Flight Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* ONE-WAY FLIGHT DISPLAY */}
                {'flight' in bookingData && (
                  <>
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
                  </>
                )}
                
                {/* ROUND-TRIP FLIGHT DISPLAY */}
                {'outboundFlight' in bookingData && (
                  <>
                    {/* Outbound Flight */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-700">Outbound Flight</h3>
                        <Badge variant="outline" className="capitalize">
                          {bookingData.searchParams.cabinClass.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={bookingData.outboundFlight.airline.logo_url || '/placeholder.svg'}
                          alt={bookingData.outboundFlight.airline.name}
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <p className="font-semibold">{bookingData.outboundFlight.airline.name}</p>
                          <p className="text-sm text-gray-600">{bookingData.outboundFlight.flight_number}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">From</p>
                          <p className="font-semibold">{bookingData.outboundFlight.origin_airport.iata_code}</p>
                          <p className="text-sm">{bookingData.outboundFlight.origin_airport.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">To</p>
                          <p className="font-semibold">{bookingData.outboundFlight.destination_airport.iata_code}</p>
                          <p className="text-sm">{bookingData.outboundFlight.destination_airport.city}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Return Flight */}
                    <div className="mt-6 pt-6 border-t">
                       <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-indigo-700">Return Flight</h3>
                      </div>
                       <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={bookingData.returnFlight.airline.logo_url || '/placeholder.svg'}
                          alt={bookingData.returnFlight.airline.name}
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <p className="font-semibold">{bookingData.returnFlight.airline.name}</p>
                          <p className="text-sm text-gray-600">{bookingData.returnFlight.flight_number}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">From</p>
                          <p className="font-semibold">{bookingData.returnFlight.origin_airport.iata_code}</p>
                          <p className="text-sm">{bookingData.returnFlight.origin_airport.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">To</p>
                          <p className="font-semibold">{bookingData.returnFlight.destination_airport.iata_code}</p>
                          <p className="text-sm">{bookingData.returnFlight.destination_airport.city}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Passenger Details Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Passenger Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Passenger {index + 1}</h3>
                      <Badge variant="secondary" className="capitalize">{field.type}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`first_name_${index}`}>First Name *</Label>
                        <Input
                          id={`first_name_${index}`}
                          {...register(`passengers.${index}.first_name`, { required: 'First name is required' })}
                          placeholder="e.g., John"
                        />
                        {errors.passengers?.[index]?.first_name && <p className="text-red-500 text-sm mt-1">{errors.passengers?.[index]?.first_name?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`last_name_${index}`}>Last Name *</Label>
                        <Input
                          id={`last_name_${index}`}
                          {...register(`passengers.${index}.last_name`, { required: 'Last name is required' })}
                          placeholder="e.g., Doe"
                        />
                        {errors.passengers?.[index]?.last_name && <p className="text-red-500 text-sm mt-1">{errors.passengers?.[index]?.last_name?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`date_of_birth_${index}`}>Date of Birth *</Label>
                        <Input
                          id={`date_of_birth_${index}`}
                          type="date"
                          {...register(`passengers.${index}.date_of_birth`, { required: 'Date of birth is required' })}
                          placeholder="YYYY-MM-DD"
                        />
                        {errors.passengers?.[index]?.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.passengers?.[index]?.date_of_birth?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`passport_${index}`}>Passport Number *</Label>
                        <Input
                          id={`passport_${index}`}
                          {...register(`passengers.${index}.passport_number`, { required: 'Passport number is required' })}
                          placeholder="e.g., A12345678"
                        />
                        {errors.passengers?.[index]?.passport_number && <p className="text-red-500 text-sm mt-1">{errors.passengers?.[index]?.passport_number?.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor={`nationality_${index}`}>Nationality *</Label>
                        <Input
                          id={`nationality_${index}`}
                          {...register(`passengers.${index}.nationality`, { required: 'Nationality is required' })}
                          placeholder="e.g., United States"
                        />
                        {errors.passengers?.[index]?.nationality && <p className="text-red-500 text-sm mt-1">{errors.passengers?.[index]?.nationality?.message}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Details Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="card_name">Name on Card *</Label>
                  <Input id="card_name" {...register('payment.name', { required: 'Name on card is required' })} placeholder="e.g., John Doe" />
                  {errors.payment?.name && <p className="text-red-500 text-sm mt-1">{errors.payment.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="card_number">Card Number *</Label>
                  <Input id="card_number" {...register('payment.number', { required: 'Card number is required', pattern: { value: /^\d{16}$/, message: 'Invalid card number' } })} placeholder="0000000000000000" />
                  {errors.payment?.number && <p className="text-red-500 text-sm mt-1">{errors.payment.number.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card_expiry">Expiry Date (MM/YY) *</Label>
                    <Input id="card_expiry" {...register('payment.expiry', { required: 'Expiry date is required', pattern: { value: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'Invalid expiry date format (MM/YY)' } })} placeholder="MM/YY" />
                    {errors.payment?.expiry && <p className="text-red-500 text-sm mt-1">{errors.payment.expiry.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="card_cvc">CVC *</Label>
                    <Input id="card_cvc" {...register('payment.cvc', { required: 'CVC is required', pattern: { value: /^\d{3,4}$/, message: 'Invalid CVC' } })} placeholder="e.g., 123" />
                    {errors.payment?.cvc && <p className="text-red-500 text-sm mt-1">{errors.payment.cvc.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={!isValid || loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                {loading ? 'Processing...' : `Book Now - $${totalAmount.toFixed(2)}`}
              </Button>
            </div>
          </form>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Passengers</span>
                  <span>{numPassengers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cabin Class</span>
                  <span className="capitalize">{bookingData.searchParams.cabinClass.replace('-', ' ')}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;