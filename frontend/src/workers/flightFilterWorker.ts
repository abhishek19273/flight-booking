/**
 * Web Worker for flight filtering and sorting
 * This file will be loaded in a separate thread to handle CPU-intensive operations
 */

// Define the message structure between the main thread and worker
interface WorkerMessage {
  action: 'filter' | 'sort';
  flights: any[];
  criteria: any;
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { action, flights, criteria } = event.data;
  
  if (!flights || !Array.isArray(flights)) {
    self.postMessage({ error: 'Invalid flight data', flights: [] });
    return;
  }
  
  try {
    let result;
    
    if (action === 'filter') {
      result = filterFlights(flights, criteria);
    } else if (action === 'sort') {
      result = sortFlights(flights, criteria);
    } else {
      throw new Error('Unknown action');
    }
    
    self.postMessage({ flights: result });
  } catch (error) {
    self.postMessage({ 
      error: error instanceof Error ? error.message : 'Unknown error', 
      flights: [] 
    });
  }
});

/**
 * Filter flights based on various criteria
 */
function filterFlights(flights: any[], criteria: any): any[] {
  return flights.filter(flight => {
    // Filter by price range
    if (criteria.minPrice && flight.price < criteria.minPrice) {
      return false;
    }
    if (criteria.maxPrice && flight.price > criteria.maxPrice) {
      return false;
    }
    
    // Filter by airline
    if (criteria.airlines && criteria.airlines.length > 0) {
      if (!criteria.airlines.includes(flight.airline.iata_code)) {
        return false;
      }
    }
    
    // Filter by departure time
    if (criteria.departureTime) {
      const departureHour = new Date(flight.departure_time).getHours();
      
      if (criteria.departureTime === 'morning' && (departureHour < 5 || departureHour >= 12)) {
        return false;
      } else if (criteria.departureTime === 'afternoon' && (departureHour < 12 || departureHour >= 18)) {
        return false;
      } else if (criteria.departureTime === 'evening' && (departureHour < 18 || departureHour >= 21)) {
        return false;
      } else if (criteria.departureTime === 'night' && (departureHour >= 5 && departureHour < 21)) {
        return false;
      }
    }
    
    // Filter by duration
    if (criteria.maxDuration) {
      const durationMinutes = flight.duration_minutes;
      if (durationMinutes > criteria.maxDuration) {
        return false;
      }
    }
    
    // Filter by stops
    if (criteria.maxStops !== undefined) {
      if (flight.stops > criteria.maxStops) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort flights based on given criteria
 */
function sortFlights(flights: any[], criteria: any): any[] {
  const { sortBy, sortOrder } = criteria;
  const direction = sortOrder === 'desc' ? -1 : 1;
  
  return [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return direction * (a.price - b.price);
        
      case 'duration':
        return direction * (a.duration_minutes - b.duration_minutes);
        
      case 'departure':
        return direction * (new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
        
      case 'arrival':
        return direction * (new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime());
        
      case 'airline':
        return direction * a.airline.name.localeCompare(b.airline.name);
        
      default:
        return 0;
    }
  });
}

// Export an empty type to satisfy TypeScript
export {};
