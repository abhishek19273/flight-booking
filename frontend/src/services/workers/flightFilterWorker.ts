import { FlightWithDetails, CabinClass } from '../../types';

// Types for worker messages
export interface FlightFilterRequest {
  action: 'filter';
  flights: FlightWithDetails[];
  filters: FlightFilters;
}

export interface FlightSortRequest {
  action: 'sort';
  flights: FlightWithDetails[];
  sortBy: SortOption;
  sortDirection: 'asc' | 'desc';
}

export interface FlightWorkerResponse {
  flights: FlightWithDetails[];
  processingTime: number;
}

export interface FlightFilters {
  airlines: string[];
  minPrice?: number;
  maxPrice?: number;
  maxDuration?: number;
  departureStartTime?: string;
  departureEndTime?: string;
  arrivalStartTime?: string;
  arrivalEndTime?: string;
  stops?: number[];
  cabinClass: CabinClass;
}

export type SortOption = 'price' | 'duration' | 'departureTime' | 'arrivalTime';

// Worker context
const ctx: Worker = self as any;

// Event listener for messages from main thread
ctx.addEventListener('message', (event: MessageEvent) => {
  const request = event.data;
  const startTime = performance.now();

  if (request.action === 'filter') {
    const filteredFlights = filterFlights(request.flights, request.filters);
    ctx.postMessage({
      flights: filteredFlights,
      processingTime: performance.now() - startTime
    });
  } else if (request.action === 'sort') {
    const sortedFlights = sortFlights(request.flights, request.sortBy, request.sortDirection);
    ctx.postMessage({
      flights: sortedFlights,
      processingTime: performance.now() - startTime
    });
  }
});

// Filter flights based on criteria
function filterFlights(flights: FlightWithDetails[], filters: FlightFilters): FlightWithDetails[] {
  return flights.filter(flight => {
    // Filter by airline
    if (filters.airlines && filters.airlines.length > 0 && !filters.airlines.includes(flight.airline_id)) {
      return false;
    }

    // Filter by price
    const price = getFlightPrice(flight, filters.cabinClass);
    if (filters.minPrice !== undefined && price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && price > filters.maxPrice) {
      return false;
    }

    // Filter by duration
    if (filters.maxDuration !== undefined && flight.duration_minutes > filters.maxDuration) {
      return false;
    }

    // Filter by departure time
    if (filters.departureStartTime || filters.departureEndTime) {
      const departureHour = new Date(flight.departure_time).getHours();
      const departureStartHour = filters.departureStartTime ? 
        parseInt(filters.departureStartTime.split(':')[0]) : 0;
      const departureEndHour = filters.departureEndTime ? 
        parseInt(filters.departureEndTime.split(':')[0]) : 24;
      
      if (departureHour < departureStartHour || departureHour > departureEndHour) {
        return false;
      }
    }

    // Filter by arrival time
    if (filters.arrivalStartTime || filters.arrivalEndTime) {
      const arrivalHour = new Date(flight.arrival_time).getHours();
      const arrivalStartHour = filters.arrivalStartTime ? 
        parseInt(filters.arrivalStartTime.split(':')[0]) : 0;
      const arrivalEndHour = filters.arrivalEndTime ? 
        parseInt(filters.arrivalEndTime.split(':')[0]) : 24;
      
      if (arrivalHour < arrivalStartHour || arrivalHour > arrivalEndHour) {
        return false;
      }
    }

    // Filter by number of stops
    if (filters.stops && filters.stops.length > 0 && !filters.stops.includes(flight.stops)) {
      return false;
    }

    // Check seat availability
    if (!hasAvailableSeats(flight, filters.cabinClass)) {
      return false;
    }

    return true;
  });
}

// Sort flights based on criteria
function sortFlights(flights: FlightWithDetails[], sortBy: SortOption, sortDirection: 'asc' | 'desc'): FlightWithDetails[] {
  const sortedFlights = [...flights];
  const multiplier = sortDirection === 'asc' ? 1 : -1;

  sortedFlights.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'price':
        comparison = getLowestPrice(a) - getLowestPrice(b);
        break;
      case 'duration':
        comparison = a.duration_minutes - b.duration_minutes;
        break;
      case 'departureTime':
        comparison = new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        break;
      case 'arrivalTime':
        comparison = new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime();
        break;
      default:
        comparison = 0;
    }

    return comparison * multiplier;
  });

  return sortedFlights;
}

// Helper functions
function getFlightPrice(flight: FlightWithDetails, cabinClass: CabinClass): number {
  switch (cabinClass) {
    case 'economy':
      return flight.economy_price;
    case 'premium-economy':
      return flight.premium_economy_price;
    case 'business':
      return flight.business_price;
    case 'first':
      return flight.first_price;
    default:
      return flight.economy_price;
  }
}

function getLowestPrice(flight: FlightWithDetails): number {
  return Math.min(
    flight.economy_price,
    flight.premium_economy_price,
    flight.business_price,
    flight.first_price
  );
}

function hasAvailableSeats(flight: FlightWithDetails, cabinClass: CabinClass): boolean {
  switch (cabinClass) {
    case 'economy':
      return flight.economy_available > 0;
    case 'premium-economy':
      return flight.premium_economy_available > 0;
    case 'business':
      return flight.business_available > 0;
    case 'first':
      return flight.first_available > 0;
    default:
      return false;
  }
}
