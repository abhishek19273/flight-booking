-- Add more comprehensive dummy data for better search functionality

-- Insert more airlines
INSERT INTO public.airlines (code, name, logo_url) VALUES
('UA', 'United Airlines', 'https://logos-world.net/wp-content/uploads/2020/03/United-Airlines-Logo.png'),
('DL', 'Delta Air Lines', 'https://logos-world.net/wp-content/uploads/2020/03/Delta-Air-Lines-Logo.png'),
('SW', 'Southwest Airlines', 'https://logos-world.net/wp-content/uploads/2020/03/Southwest-Airlines-Logo.png'),
('BA', 'British Airways', 'https://logos-world.net/wp-content/uploads/2020/03/British-Airways-Logo.png'),
('LH', 'Lufthansa', 'https://logos-world.net/wp-content/uploads/2020/03/Lufthansa-Logo.png'),
('AF', 'Air France', 'https://logos-world.net/wp-content/uploads/2020/03/Air-France-Logo.png'),
('EK', 'Emirates', 'https://logos-world.net/wp-content/uploads/2020/03/Emirates-Logo.png'),
('QF', 'Qantas', 'https://logos-world.net/wp-content/uploads/2020/03/Qantas-Logo.png'),
('SQ', 'Singapore Airlines', 'https://logos-world.net/wp-content/uploads/2020/03/Singapore-Airlines-Logo.png'),
('JL', 'Japan Airlines', 'https://logos-world.net/wp-content/uploads/2020/03/Japan-Airlines-Logo.png')
ON CONFLICT (code) DO UPDATE SET
name = EXCLUDED.name,
logo_url = EXCLUDED.logo_url;

-- Insert more airports with comprehensive data
INSERT INTO public.airports (iata_code, icao_code, name, city, country, timezone) VALUES
-- US Airports
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'America/New_York'),
('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'America/Los_Angeles'),
('ORD', 'KORD', 'O''Hare International Airport', 'Chicago', 'United States', 'America/Chicago'),
('MIA', 'KMIA', 'Miami International Airport', 'Miami', 'United States', 'America/New_York'),
('DFW', 'KDFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'United States', 'America/Chicago'),
('SFO', 'KSFO', 'San Francisco International Airport', 'San Francisco', 'United States', 'America/Los_Angeles'),
('SEA', 'KSEA', 'Seattle-Tacoma International Airport', 'Seattle', 'United States', 'America/Los_Angeles'),
('BOS', 'KBOS', 'Logan International Airport', 'Boston', 'United States', 'America/New_York'),
('ATL', 'KATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta', 'United States', 'America/New_York'),
('LAS', 'KLAS', 'McCarran International Airport', 'Las Vegas', 'United States', 'America/Los_Angeles'),

-- European Airports
('LHR', 'EGLL', 'Heathrow Airport', 'London', 'United Kingdom', 'Europe/London'),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', 'Europe/Paris'),
('FRA', 'EDDF', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'Europe/Berlin'),
('AMS', 'EHAM', 'Amsterdam Airport Schiphol', 'Amsterdam', 'Netherlands', 'Europe/Amsterdam'),
('FCO', 'LIRF', 'Leonardo da Vinci International Airport', 'Rome', 'Italy', 'Europe/Rome'),
('MAD', 'LEMD', 'Adolfo Suárez Madrid-Barajas Airport', 'Madrid', 'Spain', 'Europe/Madrid'),
('BCN', 'LEBL', 'Barcelona-El Prat Airport', 'Barcelona', 'Spain', 'Europe/Madrid'),
('MUC', 'EDDM', 'Munich Airport', 'Munich', 'Germany', 'Europe/Berlin'),
('VIE', 'LOWW', 'Vienna International Airport', 'Vienna', 'Austria', 'Europe/Vienna'),
('ZUR', 'LSZH', 'Zurich Airport', 'Zurich', 'Switzerland', 'Europe/Zurich'),

-- Asian Airports
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'Japan', 'Asia/Tokyo'),
('HND', 'RJTT', 'Haneda Airport', 'Tokyo', 'Japan', 'Asia/Tokyo'),
('SIN', 'WSSS', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'Asia/Singapore'),
('ICN', 'RKSI', 'Incheon International Airport', 'Seoul', 'South Korea', 'Asia/Seoul'),
('HKG', 'VHHH', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong', 'Asia/Hong_Kong'),
('PEK', 'ZBAA', 'Beijing Capital International Airport', 'Beijing', 'China', 'Asia/Shanghai'),
('PVG', 'ZSPD', 'Shanghai Pudong International Airport', 'Shanghai', 'China', 'Asia/Shanghai'),
('BOM', 'VABB', 'Chhatrapati Shivaji International Airport', 'Mumbai', 'India', 'Asia/Kolkata'),
('DEL', 'VIDP', 'Indira Gandhi International Airport', 'Delhi', 'India', 'Asia/Kolkata'),
('DXB', 'OMDB', 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'Asia/Dubai'),

-- Australian/Oceania Airports
('SYD', 'YSSY', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia', 'Australia/Sydney'),
('MEL', 'YMML', 'Melbourne Airport', 'Melbourne', 'Australia', 'Australia/Melbourne')
ON CONFLICT (iata_code) DO UPDATE SET
icao_code = EXCLUDED.icao_code,
name = EXCLUDED.name,
city = EXCLUDED.city,
country = EXCLUDED.country,
timezone = EXCLUDED.timezone;

-- Insert comprehensive flight data with varied schedules
INSERT INTO public.flights (
    flight_number, airline_id, origin_airport_id, destination_airport_id,
    departure_time, arrival_time, duration_minutes, aircraft_type, status,
    economy_price, premium_economy_price, business_price, first_price,
    economy_seats, premium_economy_seats, business_seats, first_seats,
    economy_available, premium_economy_available, business_available, first_available
) 
SELECT 
    airlines.code || LPAD((ROW_NUMBER() OVER (PARTITION BY airlines.code))::text, 3, '0') as flight_number,
    airlines.id as airline_id,
    origin.id as origin_airport_id,
    dest.id as destination_airport_id,
    ('2024-01-08'::date + (random() * 365)::int + 
     (EXTRACT(hour FROM now()) + random() * 24)::int * interval '1 hour')::timestamp with time zone as departure_time,
    ('2024-01-08'::date + (random() * 365)::int + 
     (EXTRACT(hour FROM now()) + random() * 24 + 2 + random() * 12)::int * interval '1 hour')::timestamp with time zone as arrival_time,
    (120 + random() * 480)::int as duration_minutes,
    CASE 
        WHEN random() < 0.3 THEN 'Boeing 737'
        WHEN random() < 0.5 THEN 'Airbus A320'
        WHEN random() < 0.7 THEN 'Boeing 787'
        WHEN random() < 0.85 THEN 'Airbus A350'
        ELSE 'Boeing 777'
    END as aircraft_type,
    CASE 
        WHEN random() < 0.8 THEN 'scheduled'::flight_status
        WHEN random() < 0.9 THEN 'delayed'::flight_status
        ELSE 'cancelled'::flight_status
    END as status,
    (200 + random() * 800)::numeric(10,2) as economy_price,
    (400 + random() * 600)::numeric(10,2) as premium_economy_price,
    (800 + random() * 1200)::numeric(10,2) as business_price,
    (2000 + random() * 3000)::numeric(10,2) as first_price,
    (150 + random() * 50)::int as economy_seats,
    (20 + random() * 20)::int as premium_economy_seats,
    (15 + random() * 15)::int as business_seats,
    (4 + random() * 8)::int as first_seats,
    (100 + random() * 40)::int as economy_available,
    (15 + random() * 15)::int as premium_economy_available,
    (8 + random() * 10)::int as business_available,
    (2 + random() * 6)::int as first_available
FROM 
    public.airlines,
    public.airports origin,
    public.airports dest
WHERE 
    origin.id != dest.id
    AND random() < 0.1 -- Limit the number of combinations to avoid too many flights
LIMIT 500;

-- Add full-text search capabilities
-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_airports_search ON public.airports USING gin(
    to_tsvector('english', name || ' ' || city || ' ' || country || ' ' || iata_code)
);

CREATE INDEX IF NOT EXISTS idx_airlines_search ON public.airlines USING gin(
    to_tsvector('english', name || ' ' || code)
);

-- Create a function for airport search with full-text capabilities
CREATE OR REPLACE FUNCTION public.search_airports(search_query TEXT)
RETURNS TABLE (
    id UUID,
    iata_code TEXT,
    name TEXT,
    city TEXT,
    country TEXT,
    search_rank REAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.iata_code,
        a.name,
        a.city,
        a.country,
        ts_rank(
            to_tsvector('english', a.name || ' ' || a.city || ' ' || a.country || ' ' || a.iata_code),
            plainto_tsquery('english', search_query)
        ) as search_rank
    FROM public.airports a
    WHERE 
        to_tsvector('english', a.name || ' ' || a.city || ' ' || a.country || ' ' || a.iata_code) 
        @@ plainto_tsquery('english', search_query)
        OR a.iata_code ILIKE '%' || search_query || '%'
        OR a.name ILIKE '%' || search_query || '%'
        OR a.city ILIKE '%' || search_query || '%'
    ORDER BY search_rank DESC, a.name;
END;
$$;

-- Create RLS policy for the search function
CREATE POLICY "Search airports function is accessible to everyone" ON public.airports
    FOR SELECT USING (true);

-- Function to get real-time flight status updates
CREATE OR REPLACE FUNCTION public.get_flight_updates()
RETURNS TABLE (
    id UUID,
    flight_number TEXT,
    airline_name TEXT,
    status flight_status,
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    origin_airport TEXT,
    destination_airport TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simulate real-time updates by occasionally changing flight status
    UPDATE public.flights 
    SET 
        status = CASE 
            WHEN random() < 0.05 AND status = 'scheduled' THEN 'delayed'::flight_status
            WHEN random() < 0.02 AND status = 'delayed' THEN 'scheduled'::flight_status
            WHEN random() < 0.01 AND status = 'scheduled' THEN 'departed'::flight_status
            WHEN random() < 0.005 AND status = 'departed' THEN 'arrived'::flight_status
            ELSE status
        END,
        updated_at = CASE 
            WHEN random() < 0.1 THEN now()
            ELSE updated_at
        END
    WHERE departure_time > now() - interval '2 hours'
      AND departure_time < now() + interval '24 hours';

    RETURN QUERY
    SELECT 
        f.id,
        f.flight_number,
        al.name as airline_name,
        f.status,
        f.departure_time,
        f.arrival_time,
        orig.iata_code as origin_airport,
        dest.iata_code as destination_airport,
        f.updated_at
    FROM public.flights f
    JOIN public.airlines al ON f.airline_id = al.id
    JOIN public.airports orig ON f.origin_airport_id = orig.id
    JOIN public.airports dest ON f.destination_airport_id = dest.id
    WHERE f.departure_time > now() - interval '2 hours'
      AND f.departure_time < now() + interval '24 hours'
    ORDER BY f.updated_at DESC
    LIMIT 100;
END;
$$;