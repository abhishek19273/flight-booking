-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.trip_type AS ENUM ('one-way', 'round-trip');
CREATE TYPE public.cabin_class AS ENUM ('economy', 'premium-economy', 'business', 'first');
CREATE TYPE public.passenger_type AS ENUM ('adult', 'child', 'infant');
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled', 'completed');
CREATE TYPE public.flight_status AS ENUM ('scheduled', 'delayed', 'cancelled', 'departed', 'arrived');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create airlines table
CREATE TABLE public.airlines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create airports table
CREATE TABLE public.airports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    iata_code TEXT NOT NULL UNIQUE,
    icao_code TEXT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    timezone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flights table
CREATE TABLE public.flights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flight_number TEXT NOT NULL,
    airline_id UUID NOT NULL REFERENCES public.airlines(id),
    origin_airport_id UUID NOT NULL REFERENCES public.airports(id),
    destination_airport_id UUID NOT NULL REFERENCES public.airports(id),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    aircraft_type TEXT,
    status public.flight_status NOT NULL DEFAULT 'scheduled',
    economy_price DECIMAL(10,2),
    premium_economy_price DECIMAL(10,2),
    business_price DECIMAL(10,2),
    first_price DECIMAL(10,2),
    economy_seats INTEGER DEFAULT 0,
    premium_economy_seats INTEGER DEFAULT 0,
    business_seats INTEGER DEFAULT 0,
    first_seats INTEGER DEFAULT 0,
    economy_available INTEGER DEFAULT 0,
    premium_economy_available INTEGER DEFAULT 0,
    business_available INTEGER DEFAULT 0,
    first_available INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_reference TEXT NOT NULL UNIQUE,
    trip_type public.trip_type NOT NULL,
    status public.booking_status NOT NULL DEFAULT 'confirmed',
    total_amount DECIMAL(10,2) NOT NULL,
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_flights table (for round-trip bookings)
CREATE TABLE public.booking_flights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    flight_id UUID NOT NULL REFERENCES public.flights(id),
    is_return_flight BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create passengers table
CREATE TABLE public.passengers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    type public.passenger_type NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    passport_number TEXT,
    nationality TEXT,
    cabin_class public.cabin_class NOT NULL,
    seat_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for public read-only tables
CREATE POLICY "Airlines are viewable by everyone" ON public.airlines
    FOR SELECT USING (true);

CREATE POLICY "Airports are viewable by everyone" ON public.airports
    FOR SELECT USING (true);

CREATE POLICY "Flights are viewable by everyone" ON public.flights
    FOR SELECT USING (true);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for booking_flights
CREATE POLICY "Users can view their own booking flights" ON public.booking_flights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = booking_flights.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own booking flights" ON public.booking_flights
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = booking_flights.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

-- Create RLS policies for passengers
CREATE POLICY "Users can view their own passengers" ON public.passengers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = passengers.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own passengers" ON public.passengers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = passengers.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own passengers" ON public.passengers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = passengers.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

-- Create function to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name)
    VALUES (
        new.id,
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON public.flights
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate booking reference
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'SB' || UPPER(substring(gen_random_uuid()::text from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_flights_departure_time ON public.flights(departure_time);
CREATE INDEX idx_flights_origin_destination ON public.flights(origin_airport_id, destination_airport_id);
CREATE INDEX idx_flights_airline ON public.flights(airline_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX idx_airports_iata ON public.airports(iata_code);
CREATE INDEX idx_airlines_code ON public.airlines(code);