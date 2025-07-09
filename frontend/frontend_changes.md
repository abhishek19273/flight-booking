Now for the frontend_changes.md:

```markdown
# SkyBound Journeys - Frontend Changes Documentation

## Overview

The frontend of SkyBound Journeys needs modifications to integrate with the new FastAPI backend and implement additional features required by the technical assignment. This document outlines the necessary changes and additions to the existing React frontend.

## Current Architecture

The current frontend is built with:

- React + TypeScript
- Vite as the build tool
- Tailwind CSS for styling
- shadcn-ui for UI components

## Required Changes

### 1. Backend Integration

#### API Service Layer

Replace the existing mock API service with real API calls to the FastAPI backend:

```typescript
// src/services/api/flightApi.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flight API Service
export const flightService = {
  searchFlights: async (searchParams) => {
    const response = await axiosInstance.post('/flights/search', searchParams);
    return response.data;
  },
  
  getFlightDetails: async (flightId) => {
    const response = await axiosInstance.get(`/flights/${flightId}`);
    return response.data;
  },
  
  searchAirports: async (query) => {
    const response = await axiosInstance.get(`/airports?query=${query}`);
    return response.data;
  },
};

// Booking API Service
export const bookingService = {
  createBooking: async (bookingData) => {
    const response = await axiosInstance.post('/bookings', bookingData);
    return response.data;
  },
  
  getBooking: async (bookingId) => {
    const response = await axiosInstance.get(`/bookings/${bookingId}`);
    return response.data;
  },
  
  cancelBooking: async (bookingId) => {
    const response = await axiosInstance.delete(`/bookings/${bookingId}`);
    return response.data;
  },
};

// User API Service
export const userService = {
  getUserProfile: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },
  
  updateUserProfile: async (profileData) => {
    const response = await axiosInstance.put('/users/me', profileData);
    return response.data;
  },
  
  getBookingHistory: async () => {
    const response = await axiosInstance.get('/users/me/bookings');
    return response.data;
  },
};

// Payment API Service
export const paymentService = {
  processPayment: async (paymentData) => {
    const response = await axiosInstance.post('/payments', paymentData);
    return response.data;
  },
};
2. Supabase Authentication Integration
Replace current authentication with Supabase Auth:

typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and set the user
    const session = supabase.auth.session();
    
    setUser(session?.user ?? null);
    setLoading(false);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user, error } = await supabase.auth.signIn({ email, password });
      if (error) throw error;
      return user;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const { user, error } = await supabase.auth.signUp(
        { email, password },
        { data: userData }
      );
      if (error) throw error;
      return user;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.api.resetPasswordForEmail(email);
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
3. IndexedDB for Offline Data Persistence
Implement IndexedDB for offline caching:

typescript
// src/services/indexedDB.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SkyBoundDB extends DBSchema {
  airports: {
    key: string;
    value: {
      id: string;
      iata_code: string;
      name: string;
      city: string;
      country: string;
    };
    indexes: { 'by-iata': string };
  };
  flights: {
    key: string;
    value: any;
    indexes: { 'by-route': [string, string, string] }; // [from, to, date]
  };
  bookings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<SkyBoundDB>>;

export const initDB = async () => {
  dbPromise = openDB<SkyBoundDB>('skybound-db', 1, {
    upgrade(db) {
      // Airports store
      const airportsStore = db.createObjectStore('airports', { keyPath: 'id' });
      airportsStore.createIndex('by-iata', 'iata_code');

      // Flights store
      const flightsStore = db.createObjectStore('flights', { keyPath: 'id' });
      flightsStore.createIndex('by-route', ['origin_airport_id', 'destination_airport_id', 'departure_date']);

      // Bookings store
      db.createObjectStore('bookings', { keyPath: 'id' });
    },
  });
  return dbPromise;
};

// Get DB instance
export const getDB = () => {
  if (!dbPromise) {
    return initDB();
  }
  return dbPromise;
};

// Cache airports
export const cacheAirports = async (airports: any[]) => {
  const db = await getDB();
  const tx = db.transaction('airports', 'readwrite');
  airports.forEach(airport => {
    tx.store.put(airport);
  });
  await tx.done;
};

// Search airports from cache
export const searchAirportsFromCache = async (query: string) => {
  const db = await getDB();
  const airports = await db.getAll('airports');
  
  if (!query || query.length < 2) return [];
  
  return airports.filter(airport => 
    airport.iata_code.toLowerCase().includes(query.toLowerCase()) ||
    airport.name.toLowerCase().includes(query.toLowerCase()) ||
    airport.city.toLowerCase().includes(query.toLowerCase())
  );
};

// Cache search results
export const cacheSearchResults = async (flights: any[], searchParams: any) => {
  const db = await getDB();
  const tx = db.transaction('flights', 'readwrite');
  
  // Store each flight
  for (const flight of flights) {
    // Add search parameters to the flight object
    flight.searchParams = searchParams;
    await tx.store.put(flight);
  }
  
  await tx.done;
};

// Get cached search results
export const getCachedSearchResults = async (searchParams: any) => {
  const db = await getDB();
  const index = db.transaction('flights').store.index('by-route');
  
  const flights = await index.getAll([
    searchParams.from,
    searchParams.to,
    searchParams.departDate
  ]);
  
  return flights;
};

// Cache booking
export const cacheBooking = async (booking: any) => {
  const db = await getDB();
  await db.put('bookings', booking);
};

// Get cached bookings
export const getCachedBookings = async () => {
  const db = await getDB();
  return db.getAll('bookings');
};
4. Web Workers for Performance-Intensive Tasks
Implement Web Workers for flight filtering and sorting:

typescript
// src/workers/flightWorker.ts
// This will be compiled into a separate JS file for the Web Worker

// Handle flight filtering and sorting
self.addEventListener('message', (event) => {
  const { flights, filters, sortBy } = event.data;
  
  // Apply filters
  let filteredFlights = flights;
  
  if (filters) {
    if (filters.airlines && filters.airlines.length > 0) {
      filteredFlights = filteredFlights.filter(
        flight => filters.airlines.includes(flight.airline_id)
      );
    }
    
    if (filters.maxPrice) {
      filteredFlights = filteredFlights.filter(flight => {
        const price = flight[`${filters.cabinClass}_price`];
        return price <= filters.maxPrice;
      });
    }
    
    if (filters.departureTime) {
      // Filter by departure time range
      const [minHour, maxHour] = filters.departureTime;
      filteredFlights = filteredFlights.filter(flight => {
        const departureHour = new Date(flight.departure_time).getHours();
        return departureHour >= minHour && departureHour <= maxHour;
      });
    }
  }
  
  // Apply sorting
  if (sortBy) {
    filteredFlights.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a[`${filters.cabinClass}_price`] - b[`${filters.cabinClass}_price`];
      } else if (sortBy === 'price-desc') {
        return b[`${filters.cabinClass}_price`] - a[`${filters.cabinClass}_price`];
      } else if (sortBy === 'duration-asc') {
        return a.duration_minutes - b.duration_minutes;
      } else if (sortBy === 'departure-asc') {
        return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
      } else if (sortBy === 'departure-desc') {
        return new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime();
      }
      return 0;
    });
  }
  
  // Post the results back
  self.postMessage({ filteredFlights });
});

// Main.tsx or App.tsx
// Create and use the Web Worker
const flightWorker = new Worker(new URL('./workers/flightWorker.ts', import.meta.url));

// Use in components
const useFlightProcessing = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const processFlights = useCallback((flights, filters, sortBy) => {
    setLoading(true);
    
    flightWorker.postMessage({ flights, filters, sortBy });
    
    flightWorker.onmessage = (e) => {
      setResults(e.data.filteredFlights);
      setLoading(false);
    };
  }, []);
  
  return { results, loading, processFlights };
};
5. Server-Sent Events for Real-time Updates
Implement SSE for real-time flight updates:

typescript
// src/hooks/useFlightStatus.ts
import { useState, useEffect } from 'react';

export const useFlightStatus = (flightId: string) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!flightId) return;
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const eventSource = new EventSource(`${API_BASE_URL}/flights/${flightId}/status`);
    
    setLoading(true);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data);
      setLoading(false);
    };
    
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Failed to connect to flight status updates');
      setLoading(false);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [flightId]);
  
  return { status, loading, error };
};

// Usage in component
function FlightStatusDisplay({ flightId }) {
  const { status, loading, error } = useFlightStatus(flightId);
  
  if (loading) return <div>Loading status updates...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h3>Flight Status: {status?.status}</h3>
      <p>Departure: {new Date(status?.departure_time).toLocaleTimeString()}</p>
      <p>Arrival: {new Date(status?.arrival_time).toLocaleTimeString()}</p>
      <p>Gate: {status?.gate}</p>
      <p>Terminal: {status?.terminal}</p>
      <p>Updated: {new Date(status?.updated_at).toLocaleString()}</p>
    </div>
  );
}
6. New Components
Flight Status Tracker Component
typescript
// src/components/FlightStatusTracker.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/