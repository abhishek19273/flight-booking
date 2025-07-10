import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { BookingDetails, PassengerUpdate } from '../../types';
import { Loader2 } from 'lucide-react';

interface BookingModificationModalProps {
  open: boolean;
  onClose: () => void;
  booking: BookingDetails | null;
  onUpdate: (passengerUpdates: PassengerUpdate[]) => void;
  isUpdating: boolean;
}

const BookingModificationModal: React.FC<BookingModificationModalProps> = ({ open, onClose, booking, onUpdate, isUpdating }) => {
  const [passengers, setPassengers] = useState<PassengerUpdate[]>([]);
  const [initialPassengers, setInitialPassengers] = useState<PassengerUpdate[]>([]);

  useEffect(() => {
    if (booking) {
      const passengerData = booking.passengers.map(p => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        passport_number: p.passport_number,
      }));
      setPassengers(passengerData);
      setInitialPassengers(JSON.parse(JSON.stringify(passengerData))); // Deep copy
    }
  }, [booking]);

  const handleInputChange = (passengerId: string, field: keyof PassengerUpdate, value: string) => {
    setPassengers(prev =>
      prev.map(p => (p.id === passengerId ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveChanges = () => {
    if (!booking) return;

    const updatedPassengers = passengers.filter(p => {
      const originalPassenger = initialPassengers.find(ip => ip.id === p.id);
      return originalPassenger && JSON.stringify(p) !== JSON.stringify(originalPassenger);
    });

    if (updatedPassengers.length > 0) {
      onUpdate(updatedPassengers);
    } else {
      onClose(); // Close modal if no changes were made
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modify Booking</DialogTitle>
          <DialogDescription>
            Update passenger details for booking reference: {booking?.booking_reference}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {passengers.map((passenger, index) => (
            <div key={passenger.id} className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold">Passenger {index + 1}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`first_name_${passenger.id}`}>First Name</Label>
                  <Input
                    id={`first_name_${passenger.id}`}
                    value={passenger.first_name || ''}
                    onChange={(e) => handleInputChange(passenger.id, 'first_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`last_name_${passenger.id}`}>Last Name</Label>
                  <Input
                    id={`last_name_${passenger.id}`}
                    value={passenger.last_name || ''}
                    onChange={(e) => handleInputChange(passenger.id, 'last_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`dob_${passenger.id}`}>Date of Birth</Label>
                  <Input
                    id={`dob_${passenger.id}`}
                    type="date"
                    value={passenger.date_of_birth ? new Date(passenger.date_of_birth).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange(passenger.id, 'date_of_birth', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`passport_${passenger.id}`}>Passport Number</Label>
                  <Input
                    id={`passport_${passenger.id}`}
                    value={passenger.passport_number || ''}
                    onChange={(e) => handleInputChange(passenger.id, 'passport_number', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModificationModal;
