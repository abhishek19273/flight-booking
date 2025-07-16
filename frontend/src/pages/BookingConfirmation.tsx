import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getBookingById } from '@/services/api/bookings';
import { BookingDetails, BookedFlight, Passenger } from '@/types';
import { 
  CheckCircle, 
  Plane, 
  Calendar, 
  Users, 
  CreditCard, 
  Download,
  ArrowLeft,
  MapPin,
  Clock
} from 'lucide-react';

// Using imported types from @/types

const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !user) return;

      try {
        // Fetch booking with related data using API client
        const bookingData = await getBookingById(bookingId);
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, user, navigate]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
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
                <span>Home</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Plane className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">SkyBound</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Your {booking.trip_type === 'round-trip' ? 'round-trip' : 'one-way'} flight has been successfully booked. Here are your booking details:
          </p>
        </div>

        {/* Booking Reference */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Booking Reference</div>
              <div className="text-3xl font-bold text-blue-600 tracking-wider">
                {booking.booking_reference}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Booked on {formatDate(booking.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flight Details */}
        <div className="space-y-6">
          {booking.trip_type === 'round-trip' ? (
            // Round-trip display
            <>
              {/* Outbound Flight */}
              {booking.flights
                .filter(bf => !bf.is_return_flight)
                .map(bookedFlight => (
                  <Card key={bookedFlight.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-blue-50 rounded-t-lg">
                      <CardTitle className="flex items-center space-x-2">
                        <Plane className="h-5 w-5 text-blue-600" />
                        <span>Outbound Flight</span>
                        <Badge variant="default" className="ml-auto">
                          {booking.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Flight Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={bookedFlight.flight.airline.logo_url || '/placeholder.svg'}
                              alt={bookedFlight.flight.airline.name}
                              className="w-8 h-8 object-contain"
                            />
                            <div>
                              <p className="font-semibold">{bookedFlight.flight.airline.name}</p>
                              <p className="text-sm text-gray-600">{bookedFlight.flight.flight_number}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-semibold">{bookedFlight.flight.origin_airport.iata_code}</p>
                                <p className="text-sm text-gray-600">{bookedFlight.flight.origin_airport.city}</p>
                              </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="w-8 h-px bg-gray-300"></div>
                              <Plane className="h-4 w-4 text-blue-600 mx-2" />
                              <div className="w-8 h-px bg-gray-300"></div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-semibold">{bookedFlight.flight.destination_airport.iata_code}</p>
                                <p className="text-sm text-gray-600">{bookedFlight.flight.destination_airport.city}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-600">Departure</div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold">{formatTime(bookedFlight.flight.departure_time)}</span>
                              <span className="text-sm text-gray-600">
                                {formatDate(bookedFlight.flight.departure_time)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Arrival</div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold">{formatTime(bookedFlight.flight.arrival_time)}</span>
                              <span className="text-sm text-gray-600">
                                {formatDate(bookedFlight.flight.arrival_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* Return Flight */}
              {booking.flights
                .filter(bf => bf.is_return_flight)
                .map(bookedFlight => (
                  <Card key={bookedFlight.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-indigo-50 rounded-t-lg">
                      <CardTitle className="flex items-center space-x-2">
                        <Plane className="h-5 w-5 text-indigo-600" />
                        <span>Return Flight</span>
                        <Badge variant="default" className="ml-auto">
                          {booking.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Flight Info */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={bookedFlight.flight.airline.logo_url || '/placeholder.svg'}
                              alt={bookedFlight.flight.airline.name}
                              className="w-8 h-8 object-contain"
                            />
                            <div>
                              <p className="font-semibold">{bookedFlight.flight.airline.name}</p>
                              <p className="text-sm text-gray-600">{bookedFlight.flight.flight_number}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-semibold">{bookedFlight.flight.origin_airport.iata_code}</p>
                                <p className="text-sm text-gray-600">{bookedFlight.flight.origin_airport.city}</p>
                              </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="w-8 h-px bg-gray-300"></div>
                              <Plane className="h-4 w-4 text-indigo-600 mx-2" />
                              <div className="w-8 h-px bg-gray-300"></div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-semibold">{bookedFlight.flight.destination_airport.iata_code}</p>
                                <p className="text-sm text-gray-600">{bookedFlight.flight.destination_airport.city}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm text-gray-600">Departure</div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold">{formatTime(bookedFlight.flight.departure_time)}</span>
                              <span className="text-sm text-gray-600">
                                {formatDate(bookedFlight.flight.departure_time)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Arrival</div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold">{formatTime(bookedFlight.flight.arrival_time)}</span>
                              <span className="text-sm text-gray-600">
                                {formatDate(bookedFlight.flight.arrival_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          ) : (
            // One-way display
            booking.flights.map(bookedFlight => (
              <Card key={bookedFlight.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plane className="h-5 w-5 text-blue-600" />
                    <span>Flight</span>
                    <Badge variant="default" className="ml-auto">
                      {booking.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Flight Info */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={bookedFlight.flight.airline.logo_url || '/placeholder.svg'}
                          alt={bookedFlight.flight.airline.name}
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <p className="font-semibold">{bookedFlight.flight.airline.name}</p>
                          <p className="text-sm text-gray-600">{bookedFlight.flight.flight_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-semibold">{bookedFlight.flight.origin_airport.iata_code}</p>
                            <p className="text-sm text-gray-600">{bookedFlight.flight.origin_airport.city}</p>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="w-8 h-px bg-gray-300"></div>
                          <Plane className="h-4 w-4 text-blue-600 mx-2" />
                          <div className="w-8 h-px bg-gray-300"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-semibold">{bookedFlight.flight.destination_airport.iata_code}</p>
                            <p className="text-sm text-gray-600">{bookedFlight.flight.destination_airport.city}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600">Departure</div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{formatTime(bookedFlight.flight.departure_time)}</span>
                          <span className="text-sm text-gray-600">
                            {formatDate(bookedFlight.flight.departure_time)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Arrival</div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{formatTime(bookedFlight.flight.arrival_time)}</span>
                          <span className="text-sm text-gray-600">
                            {formatDate(bookedFlight.flight.arrival_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Passengers */}
        <Card className="mt-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Passengers ({booking.passengers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {booking.passengers.map((passenger, index) => (
                <div key={passenger.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">
                      {passenger.first_name} {passenger.last_name}
                    </h4>
                    <Badge variant="secondary" className="capitalize">
                      {passenger.type}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Cabin: {passenger.cabin_class.replace('-', ' ')}</p>
                    {passenger.date_of_birth && (
                      <p>DOB: {formatDate(passenger.date_of_birth)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="mt-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Payment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount Paid</span>
              <span className="text-green-600">${booking.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4" />
            <span>Download Receipt</span>
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/tracking')}
          >
            <Plane className="h-4 w-4 mr-2" />
            Track Your Flight
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;