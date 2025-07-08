import { FlightSearchParams, FlightWithDetails } from '@/hooks/useFlightSearch';

// Mock flight data for testing
const mockFlights: FlightWithDetails[] = [
  {
    id: 'mock-1',
    flight_number: 'AA101',
    airline_id: 'aa',
    origin_airport_id: 'jfk',
    destination_airport_id: 'lax',
    departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    arrival_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
    duration_minutes: 360,
    status: 'scheduled' as const,
    aircraft_type: 'Boeing 737',
    economy_price: 299,
    economy_available: 42,
    economy_seats: 150,
    premium_economy_price: 499,
    premium_economy_available: 12,
    premium_economy_seats: 24,
    business_price: 899,
    business_available: 8,
    business_seats: 16,
    first_price: 1299,
    first_available: 4,
    first_seats: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    airline: {
      id: 'aa',
      name: 'American Airlines',
      code: 'AA',
      logo_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=50&h=50&fit=crop&crop=center',
      created_at: new Date().toISOString(),
    },
    origin_airport: {
      id: 'jfk',
      iata_code: 'JFK',
      icao_code: 'KJFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      timezone: 'America/New_York',
      created_at: new Date().toISOString(),
    },
    destination_airport: {
      id: 'lax',
      iata_code: 'LAX',
      icao_code: 'KLAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      timezone: 'America/Los_Angeles',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-2',
    flight_number: 'DL202',
    airline_id: 'dl',
    origin_airport_id: 'jfk',
    destination_airport_id: 'lax',
    departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    arrival_time: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 360,
    status: 'scheduled' as const,
    aircraft_type: 'Airbus A320',
    economy_price: 259,
    economy_available: 28,
    economy_seats: 140,
    premium_economy_price: 459,
    premium_economy_available: 6,
    premium_economy_seats: 20,
    business_price: 799,
    business_available: 12,
    business_seats: 20,
    first_price: 1199,
    first_available: 2,
    first_seats: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    airline: {
      id: 'dl',
      name: 'Delta Air Lines',
      code: 'DL',
      logo_url: 'https://images.unsplash.com/photo-1483450388369-9ed95738483c?w=50&h=50&fit=crop&crop=center',
      created_at: new Date().toISOString(),
    },
    origin_airport: {
      id: 'jfk',
      iata_code: 'JFK',
      icao_code: 'KJFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      timezone: 'America/New_York',
      created_at: new Date().toISOString(),
    },
    destination_airport: {
      id: 'lax',
      iata_code: 'LAX',
      icao_code: 'KLAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      timezone: 'America/Los_Angeles',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-3',
    flight_number: 'UA303',
    airline_id: 'ua',
    origin_airport_id: 'jfk',
    destination_airport_id: 'lax',
    departure_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    arrival_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 360,
    status: 'scheduled' as const,
    aircraft_type: 'Boeing 777',
    economy_price: 319,
    economy_available: 38,
    economy_seats: 180,
    premium_economy_price: 529,
    premium_economy_available: 18,
    premium_economy_seats: 32,
    business_price: 999,
    business_available: 14,
    business_seats: 28,
    first_price: 1499,
    first_available: 6,
    first_seats: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    airline: {
      id: 'ua',
      name: 'United Airlines',
      code: 'UA',
      logo_url: 'https://images.unsplash.com/photo-1511128222633-53a30859395f?w=50&h=50&fit=crop&crop=center',
      created_at: new Date().toISOString(),
    },
    origin_airport: {
      id: 'jfk',
      iata_code: 'JFK',
      icao_code: 'KJFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      timezone: 'America/New_York',
      created_at: new Date().toISOString(),
    },
    destination_airport: {
      id: 'lax',
      iata_code: 'LAX',
      icao_code: 'KLAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      timezone: 'America/Los_Angeles',
      created_at: new Date().toISOString(),
    },
  },
];

// Mock airport data for autocomplete
const mockAirports = [
  { id: 'jfk', iata_code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', search_rank: 1 },
  { id: 'lax', iata_code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', search_rank: 1 },
  { id: 'ord', iata_code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', search_rank: 1 },
  { id: 'lhr', iata_code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', search_rank: 1 },
  { id: 'cdg', iata_code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', search_rank: 1 },
  { id: 'nrt', iata_code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', search_rank: 1 },
  { id: 'sfo', iata_code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', search_rank: 1 },
  { id: 'mia', iata_code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', search_rank: 1 },
  { id: 'den', iata_code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', search_rank: 1 },
  { id: 'sea', iata_code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', search_rank: 1 },
];

// Mock flight tracking data
export const mockFlightTrackingData = [
  {
    id: 'track-1',
    flight_number: 'AA101',
    airline_name: 'American Airlines',
    status: 'departed' as const,
    departure_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    arrival_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    origin_airport: 'JFK',
    destination_airport: 'LAX',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'track-2',
    flight_number: 'DL202',
    airline_name: 'Delta Air Lines',
    status: 'delayed' as const,
    departure_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
    arrival_time: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // 7 hours from now
    origin_airport: 'ORD',
    destination_airport: 'LHR',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'track-3',
    flight_number: 'UA303',
    airline_name: 'United Airlines',
    status: 'scheduled' as const,
    departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    arrival_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
    origin_airport: 'SFO',
    destination_airport: 'NRT',
    updated_at: new Date().toISOString(),
  },
];

export class MockFlightApi {
  static async searchFlights(params: FlightSearchParams): Promise<FlightWithDetails[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Filter flights based on search params
    return mockFlights.filter(flight => {
      const matchesRoute = 
        flight.origin_airport.iata_code === params.from.toUpperCase() &&
        flight.destination_airport.iata_code === params.to.toUpperCase();
      
      const totalPassengers = params.passengers.adults + params.passengers.children + params.passengers.infants;
      const hasAvailableSeats = this.getAvailableSeats(flight, params.cabinClass) >= totalPassengers;
      
      return matchesRoute && hasAvailableSeats;
    });
  }

  static async searchAirports(query: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!query || query.length < 2) return [];
    
    return mockAirports.filter(airport => 
      airport.iata_code.toLowerCase().includes(query.toLowerCase()) ||
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase())
    );
  }

  private static getAvailableSeats(flight: FlightWithDetails, cabinClass: string): number {
    switch (cabinClass) {
      case 'economy':
        return flight.economy_available || 0;
      case 'premium-economy':
        return flight.premium_economy_available || 0;
      case 'business':
        return flight.business_available || 0;
      case 'first':
        return flight.first_available || 0;
      default:
        return 0;
    }
  }
}

// Environment variable to switch between mock and real API
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || true; // Default to true for now