// IndexedDB service for flight search results caching
const DB_NAME = 'sky-bound-journeys-db';
const DB_VERSION = 1;
const FLIGHT_STORE = 'flight-search-results';
const SEARCH_PARAMS_STORE = 'search-params';

interface DBSchema {
  'flight-search-results': {
    key: string;
    value: {
      results: any[];
      timestamp: number;
      searchParamsKey: string;
    };
  };
  'search-params': {
    key: string;
    value: any;
  };
}

// Generate a unique key for search parameters
export const generateSearchParamsKey = (searchParams: any): string => {
  return Object.entries(searchParams)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}:${JSON.stringify(value)}`;
      }
      return `${key}:${value}`;
    })
    .join('|');
};

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error('Error opening IndexedDB'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(FLIGHT_STORE)) {
        db.createObjectStore(FLIGHT_STORE, { keyPath: 'searchParamsKey' });
      }
      
      if (!db.objectStoreNames.contains(SEARCH_PARAMS_STORE)) {
        db.createObjectStore(SEARCH_PARAMS_STORE, { keyPath: 'key' });
      }
    };
  });
};

// Save flight search results to IndexedDB
export const saveFlightSearchResults = async (
  searchParams: any,
  results: any[]
): Promise<void> => {
  try {
    const db = await initDB();
    const searchParamsKey = generateSearchParamsKey(searchParams);
    const transaction = db.transaction([FLIGHT_STORE, SEARCH_PARAMS_STORE], 'readwrite');
    
    // Save search params
    const searchParamsStore = transaction.objectStore(SEARCH_PARAMS_STORE);
    searchParamsStore.put({
      key: searchParamsKey,
      params: searchParams
    });
    
    // Save flight results
    const flightStore = transaction.objectStore(FLIGHT_STORE);
    flightStore.put({
      searchParamsKey,
      results,
      timestamp: Date.now()
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Error saving flight search results'));
    });
  } catch (error) {
    console.error('Failed to save flight search results:', error);
    throw error;
  }
};

// Get cached flight search results from IndexedDB
export const getCachedFlightSearchResults = async (
  searchParams: any,
  maxAge: number = 30 * 60 * 1000 // Default: 30 minutes
): Promise<any[] | null> => {
  try {
    const db = await initDB();
    const searchParamsKey = generateSearchParamsKey(searchParams);
    const transaction = db.transaction(FLIGHT_STORE, 'readonly');
    const store = transaction.objectStore(FLIGHT_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(searchParamsKey);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data && (Date.now() - data.timestamp) < maxAge) {
          resolve(data.results);
        } else {
          resolve(null); // No valid cached data found
        }
      };
      
      request.onerror = () => {
        reject(new Error('Error retrieving cached flight search results'));
      };
    });
  } catch (error) {
    console.error('Failed to get cached flight search results:', error);
    return null;
  }
};

// Clear expired cache entries (can be called periodically)
export const clearExpiredCache = async (maxAge: number = 24 * 60 * 60 * 1000): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(FLIGHT_STORE, 'readwrite');
    const store = transaction.objectStore(FLIGHT_STORE);
    const currentTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if ((currentTime - cursor.value.timestamp) > maxAge) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => {
        reject(new Error('Error clearing expired cache entries'));
      };
    });
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
};

// Get all cached search parameters
export const getCachedSearchParams = async (): Promise<any[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(SEARCH_PARAMS_STORE, 'readonly');
    const store = transaction.objectStore(SEARCH_PARAMS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result.map(item => item.params));
      };
      
      request.onerror = () => {
        reject(new Error('Error retrieving cached search parameters'));
      };
    });
  } catch (error) {
    console.error('Failed to get cached search parameters:', error);
    return [];
  }
};

// Check if the browser is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};
