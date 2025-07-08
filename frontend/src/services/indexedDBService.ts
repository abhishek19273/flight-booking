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
    
    return index.getAll([originCode.toUpperCase(), destinationCode.toUpperCase()]);
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
