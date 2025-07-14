import { openDB, IDBPDatabase } from 'idb';
import { Airport, Flight, Booking } from '../types';

// Database name and version
const DB_NAME = 'skybound-journeys-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  AIRPORTS: 'airports',
  FLIGHTS: 'flights',
  BOOKINGS: 'bookings',
  USER_PROFILE: 'userProfile',
};

// Database connection
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
const initDB = async (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.AIRPORTS)) {
          const airportStore = db.createObjectStore(STORES.AIRPORTS, { keyPath: 'id' });
          airportStore.createIndex('iata', 'iata_code', { unique: true });
          airportStore.createIndex('city', 'city', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.FLIGHTS)) {
          const flightStore = db.createObjectStore(STORES.FLIGHTS, { keyPath: 'id' });
          flightStore.createIndex('origin_destination', ['origin_airport.iata_code', 'destination_airport.iata_code'], { unique: false });
          flightStore.createIndex('departure_date', 'departure_time', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.BOOKINGS)) {
          const bookingStore = db.createObjectStore(STORES.BOOKINGS, { keyPath: 'id' });
          bookingStore.createIndex('reference', 'booking_reference', { unique: true });
        }
        
        if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
          db.createObjectStore(STORES.USER_PROFILE, { keyPath: 'id' });
        }
      },
    });
  }
  
  return dbPromise;
};

/**
 * IndexedDB service for offline data persistence
 */
const IndexedDBService = {
  /**
   * Save airports to IndexedDB for offline access
   */
  saveAirports: async (airports: Airport[]): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORES.AIRPORTS, 'readwrite');
    const store = tx.objectStore(STORES.AIRPORTS);
    
    // Add each airport to the store
    for (const airport of airports) {
      await store.put(airport);
    }
    
    await tx.done;
  },
  
  /**
   * Get all cached airports
   */
  getAirports: async (): Promise<Airport[]> => {
    const db = await initDB();
    return db.getAll(STORES.AIRPORTS);
  },
  
  /**
   * Search airports in the cache
   */
  searchAirports: async (query: string): Promise<Airport[]> => {
    const db = await initDB();
    const airports = await db.getAll(STORES.AIRPORTS);
    
    // Filter airports based on the query
    const lowerQuery = query.toLowerCase();
    return airports.filter(airport => 
      airport.name.toLowerCase().includes(lowerQuery) ||
      airport.city.toLowerCase().includes(lowerQuery) ||
      airport.iata_code.toLowerCase().includes(lowerQuery)
    );
  },
  
  /**
   * Save flight search results to the cache
   */
  saveFlights: async (flights: Flight[]): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORES.FLIGHTS, 'readwrite');
    const store = tx.objectStore(STORES.FLIGHTS);
    
    // Add each flight to the store
    for (const flight of flights) {
      await store.put(flight);
    }
    
    await tx.done;
  },
  
  /**
   * Get flights from cache by origin and destination
   */
  getFlightsByRoute: async (originCode: string, destinationCode: string): Promise<Flight[]> => {
    const db = await initDB();
    const tx = db.transaction(STORES.FLIGHTS, 'readonly');
    const index = tx.objectStore(STORES.FLIGHTS).index('origin_destination');
    
    return index.getAll([originCode, destinationCode]);
  },
  
  /**
   * Get flights from cache by origin and destination with filtering and sorting
   * @param originCode Origin airport IATA code
   * @param destinationCode Destination airport IATA code
   * @param filters Optional filters to apply
   * @param sorting Optional sorting parameters
   * @param cabinClass Cabin class for price and availability filtering
   */
  getFilteredFlights: async (
    originCode: string, 
    destinationCode: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      airlineId?: string;
      minAvailableSeats?: number;
    },
    sorting?: {
      sortBy?: 'price' | 'duration' | 'departure_time' | 'arrival_time';
      sortOrder?: 'asc' | 'desc';
    },
    cabinClass: 'economy' | 'premium-economy' | 'business' | 'first' = 'economy'
  ): Promise<Flight[]> => {
    // First get all flights for the route
    const flights = await IndexedDBService.getFlightsByRoute(originCode, destinationCode);
    
    // Apply filters if provided
    let filteredFlights = flights;
    if (filters) {
      filteredFlights = flights.filter(flight => {
        // Get price and available seats for the selected cabin class
        const price = flight[`${cabinClass.replace('-', '_')}_price`];
        const availableSeats = flight[`${cabinClass.replace('-', '_')}_available`];
        
        // Apply price filters
        if (filters.minPrice !== undefined && price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
        
        // Apply airline filter
        if (filters.airlineId && flight.airline_id !== filters.airlineId) return false;
        
        // Apply seat availability filter
        if (filters.minAvailableSeats !== undefined && availableSeats < filters.minAvailableSeats) return false;
        
        return true;
      });
    }
    
    // Apply sorting if provided
    if (sorting && sorting.sortBy) {
      const sortField = sorting.sortBy === 'price' 
        ? `${cabinClass.replace('-', '_')}_price` 
        : sorting.sortBy;
      
      const multiplier = sorting.sortOrder === 'desc' ? -1 : 1;
      
      filteredFlights.sort((a, b) => {
        if (sortField === 'departure_time' || sortField === 'arrival_time') {
          return multiplier * (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime());
        } else {
          return multiplier * ((a[sortField] || 0) - (b[sortField] || 0));
        }
      });
    }
    
    return filteredFlights;
  },
  
  /**
   * Save a booking to the cache
   */
  saveBooking: async (booking: Booking): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORES.BOOKINGS, 'readwrite');
    await tx.objectStore(STORES.BOOKINGS).put(booking);
    await tx.done;
  },
  
  /**
   * Get all cached bookings
   */
  getBookings: async (): Promise<Booking[]> => {
    const db = await initDB();
    return db.getAll(STORES.BOOKINGS);
  },
  
  /**
   * Get a booking by ID
   */
  getBookingById: async (bookingId: string): Promise<Booking | undefined> => {
    const db = await initDB();
    return db.get(STORES.BOOKINGS, bookingId);
  },
  
  /**
   * Save user profile to cache
   */
  saveUserProfile: async (profile: any): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORES.USER_PROFILE, 'readwrite');
    await tx.objectStore(STORES.USER_PROFILE).put(profile);
    await tx.done;
  },
  
  /**
   * Get cached user profile
   */
  getUserProfile: async (): Promise<any | undefined> => {
    const db = await initDB();
    const profiles = await db.getAll(STORES.USER_PROFILE);
    return profiles.length > 0 ? profiles[0] : undefined;
  },
  
  /**
   * Clear all data from IndexedDB
   */
  clearAll: async (): Promise<void> => {
    const db = await initDB();
    const storeNames = Object.values(STORES);
    
    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
      await tx.done;
    }
  }
};

export default IndexedDBService;
