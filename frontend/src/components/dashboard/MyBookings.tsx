import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, Loader2, Plane, Ticket, Users } from 'lucide-react';
import { useState } from 'react';
import { getAllBookings, cancelBooking, updateBooking } from '../../services/api/bookings';
import { Booking, BookingDetails, PassengerUpdate } from '../../types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { toast } from '../ui/use-toast';
import BookingModificationModal from './BookingModificationModal';

// --- Helper Functions ---
const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'pending':
      return 'secondary';
    default:
      return 'outline';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// --- Loading Skeleton Component ---
const BookingSkeleton = () => (
  <div className="space-y-6">
    {[...Array(2)].map((_, i) => (
      <Card key={i} className="bg-white/80 backdrop-blur-sm animate-pulse">
        <CardHeader className="flex flex-row justify-between items-center p-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
        <CardFooter className="p-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

// --- Main Component ---
const MyBookings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const queryClient = useQueryClient();

    const { data: bookings = [], isLoading, error } = useQuery<BookingDetails[], Error>({
    queryKey: ['bookings'],
    queryFn: getAllBookings,
  });

  const updateBookingMutation = useMutation<BookingDetails, Error, { bookingId: string; passengerUpdates: PassengerUpdate[] }, { previousBookings: BookingDetails[] | undefined }>({ 
    mutationFn: ({ bookingId, passengerUpdates }) => 
      updateBooking(bookingId, { passengers: passengerUpdates }),
    onMutate: async ({ bookingId, passengerUpdates }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previousBookings = queryClient.getQueryData<BookingDetails[]>(['bookings']);

      queryClient.setQueryData<BookingDetails[]>(['bookings'], (oldData = []) =>
        oldData.map(booking => {
          if (booking.id === bookingId) {
            const updatedPassengers = booking.passengers.map(p => {
              const update = passengerUpdates.find(up => up.id === p.id);
              return update ? { ...p, ...update } : p;
            });
            return { ...booking, passengers: updatedPassengers };
          }
          return booking;
        })
      );

      handleCloseModal();
      return { previousBookings };
    },
    onSuccess: () => {
      toast({ 
        title: 'Success',
        description: 'Your booking has been updated.',
      });
    },
    onError: (err, __, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(['bookings'], context.previousBookings);
      }
      toast({
        title: 'Update Failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleOpenModal = (booking: BookingDetails) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
    setIsModalOpen(false);
  };

    const handleUpdateBooking = (passengerUpdates: PassengerUpdate[]) => {
    if (selectedBooking) {
      updateBookingMutation.mutate({ bookingId: selectedBooking.id, passengerUpdates });
    }
  };

  const cancelBookingMutation = useMutation<Booking, Error, string>({
    mutationFn: cancelBooking,
    onSuccess: (updatedBooking) => {
      toast({ 
        title: 'Success',
        description: 'Your booking has been cancelled.',
      });
      // Optimistically update the query cache
      queryClient.setQueryData<BookingDetails[]>(['bookings'], (oldData) => 
        oldData ? oldData.map(b => b.id === updatedBooking.id ? { ...b, status: updatedBooking.status } : b) : []
      );
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  if (isLoading) {
    return <BookingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message || 'Failed to fetch your bookings.'}</AlertDescription>
      </Alert>
    );
  }

  const validBookings = bookings.filter(b => 
    b.flights && 
    b.flights.length > 0 && 
    b.flights[0].flight
  );

  if (validBookings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Ticket className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
        <p className="mt-1 text-sm text-gray-500">You haven't made any bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {validBookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b p-4">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {booking.flights[0].flight.origin_airport.city} to {booking.flights[0].flight.destination_airport.city}
                    </CardTitle>
                    <p className="text-sm text-gray-500">Booking Ref: {booking.booking_reference}</p>
                </div>
                <Badge 
                    variant={getStatusVariant(booking.status)} 
                    className={`capitalize text-sm`}>
                    {booking.status}
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2 col-span-2">
              <h4 className="font-semibold text-gray-700 flex items-center"><Plane className="w-4 h-4 mr-2 text-blue-500"/>Flight Details</h4>
              {booking.flights.map(({ flight }) => (
                <div key={flight.id} className="text-gray-600 pl-6 border-l-2 border-gray-200 ml-2">
                  <p><strong>{flight.flight_number}</strong>: {flight.origin_airport.iata_code} → {flight.destination_airport.iata_code}</p>
                  <p>Airline: {flight.airline.name}</p>
                  <p>Departure: {formatDate(flight.departure_time)}</p>
                  <p>Arrival: {formatDate(flight.arrival_time)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 flex items-center"><Users className="w-4 h-4 mr-2 text-blue-500"/>Passengers</h4>
              <p className="text-gray-600">{booking.passengers.length} Adult(s)</p>
              
              <h4 className="font-semibold text-gray-700 flex items-center pt-2"><Calendar className="w-4 h-4 mr-2 text-blue-500"/>Booking Info</h4>
              <p className="text-gray-600">Booked on: {formatDate(booking.created_at)}</p>
              <p className="text-gray-600 font-semibold">Total Price: ${booking.total_amount.toLocaleString()}</p>
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-gray-50/50 border-t">
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => handleCancelBooking(booking.id)}
                disabled={booking.status === 'cancelled' || cancelBookingMutation.isPending}
                className="flex items-center gap-2 w-36 justify-center"
              >
                {cancelBookingMutation.isPending && cancelBookingMutation.variables === booking.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
                ) : booking.status === 'cancelled' ? 'Cancelled' : 'Cancel Booking'}
              </Button>
                            <Button 
                variant="outline"
                size="sm"
                onClick={() => handleOpenModal(booking)}
                disabled={booking.status === 'cancelled' || updateBookingMutation.isPending}
                className="flex items-center gap-2 w-36 justify-center"
              >
                Modify Booking
              </Button>
            </CardFooter>
          </Card>
      ))}
            <BookingModificationModal 
        booking={selectedBooking} 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        onUpdate={handleUpdateBooking} 
        isUpdating={updateBookingMutation.isPending}
      />
    </div>
  );
};

export default MyBookings;
