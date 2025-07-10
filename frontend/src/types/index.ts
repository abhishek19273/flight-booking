// Airport types
export interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// Airline types
export interface Airline {
  id: string;
  iata_code: string;
  name: string;
  logo_url?: string;
}

// Flight types
export interface Flight {
  id: string;
  flight_number: string;
  airline_id: string;
  origin_airport_id: string;
  destination_airport_id: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'in_air' | 'landed' | 'diverted';
  economy_price: number;
  premium_economy_price: number;
  business_price: number;
  first_price: number;
  economy_available: number;
  premium_economy_available: number;
  business_available: number;
  first_available: number;
  stops: number;
  aircraft_type?: string;
  created_at: string;
  updated_at: string;
}

export interface FlightWithDetails extends Flight {
  airline: Airline;
  origin_airport: Airport;
  destination_airport: Airport;
}

// Flight search types
export type CabinClass = 'economy' | 'premium-economy' | 'business' | 'first';

export interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearchParams {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  passengers: PassengerCount;
  cabinClass: CabinClass;
  tripType: 'one-way' | 'round-trip';
}

interface FlightAvailability {
  flight_id: string;
  economy_available?: number;
  premium_economy_available?: number;
  business_available?: number;
  first_available?: number;
  updated_at: string;
}

// Booking types
export interface Passenger {
  id?: string;
  type: 'adult' | 'child' | 'infant';
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number?: string;
  nationality?: string;
  cabin_class: CabinClass;
}

export interface BookingFlightItem {
  flight_id: string;
  is_return_flight: boolean;
}

export interface BookingCreate {
  trip_type: 'one-way' | 'round-trip';
  flights: BookingFlightItem[];
  passengers: Passenger[];
  total_amount: number;
}

export interface BookingUpdate {
  status?: 'confirmed' | 'cancelled' | 'pending';
}

export interface Booking {
  id: string;
  user_id: string;
  booking_reference: string;
  trip_type: 'one-way' | 'round-trip';
  status: 'confirmed' | 'cancelled' | 'pending';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BookedFlight {
  id: string;
  booking_id: string;
  flight_id: string;
  is_return_flight: boolean;
  flight: FlightWithDetails;
}

export interface PassengerUpdate {
  id: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  passport_number?: string;
}

export interface BookingUpdate {
  status?: 'confirmed' | 'cancelled' | 'pending';
  passengers?: PassengerUpdate[];
}

export interface BookingDetails extends Booking {
  flights: BookedFlight[];
  passengers: Passenger[];
  total_amount: number;
}
