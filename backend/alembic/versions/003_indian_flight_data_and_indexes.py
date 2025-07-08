"""Indian flight data and additional indexes

Revision ID: 003_indian_flight_data_and_indexes
Revises: 002_seed_data_and_search_functions
Create Date: 2025-07-09 01:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_indian_flight_data_and_indexes'
down_revision = '002_seed_data_and_search_functions'
branch_labels = None
depends_on = None


def upgrade():
    # Add more Indian airlines
    op.execute("""
    INSERT INTO airlines (code, name, logo_url) VALUES
    ('AI', 'Air India', 'https://logos-world.net/wp-content/uploads/2020/11/Air-India-Logo.png'),
    ('IX', 'Air India Express', 'https://logos-world.net/wp-content/uploads/2020/12/Air-India-Express-Logo.png'),
    ('6E', 'IndiGo', 'https://logos-world.net/wp-content/uploads/2020/11/IndiGo-Logo.png'),
    ('SG', 'SpiceJet', 'https://logos-world.net/wp-content/uploads/2020/11/SpiceJet-Logo.png'),
    ('UK', 'Vistara', 'https://logos-world.net/wp-content/uploads/2020/11/Vistara-Logo.png'),
    ('G8', 'Go First', 'https://logos-world.net/wp-content/uploads/2020/12/GoAir-Logo.png'),
    ('I5', 'AirAsia India', 'https://logos-world.net/wp-content/uploads/2021/09/AirAsia-Logo.png'),
    ('2T', 'TruJet', 'https://logos-world.net/wp-content/uploads/2021/10/TruJet-Logo.png'),
    ('QP', 'Akasa Air', 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Akasa_Air_Logo.svg'),
    ('S2', 'JetLite', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/JetLite_logo.svg/1200px-JetLite_logo.svg.png')
    ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url
    """)

    # Add more Indian airports
    op.execute("""
    INSERT INTO airports (iata_code, icao_code, name, city, country, timezone) VALUES
    ('DEL', 'VIDP', 'Indira Gandhi International Airport', 'New Delhi', 'India', 'Asia/Kolkata'),
    ('BOM', 'VABB', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai', 'India', 'Asia/Kolkata'),
    ('MAA', 'VOMM', 'Chennai International Airport', 'Chennai', 'India', 'Asia/Kolkata'),
    ('BLR', 'VOBL', 'Kempegowda International Airport', 'Bangalore', 'India', 'Asia/Kolkata'),
    ('HYD', 'VOHS', 'Rajiv Gandhi International Airport', 'Hyderabad', 'India', 'Asia/Kolkata'),
    ('CCU', 'VECC', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata', 'India', 'Asia/Kolkata'),
    ('AMD', 'VAAH', 'Sardar Vallabhbhai Patel International Airport', 'Ahmedabad', 'India', 'Asia/Kolkata'),
    ('COK', 'VOCI', 'Cochin International Airport', 'Kochi', 'India', 'Asia/Kolkata'),
    ('PNQ', 'VAPO', 'Pune Airport', 'Pune', 'India', 'Asia/Kolkata'),
    ('GOI', 'VAGO', 'Goa International Airport', 'Goa', 'India', 'Asia/Kolkata'),
    ('LKO', 'VILK', 'Chaudhary Charan Singh International Airport', 'Lucknow', 'India', 'Asia/Kolkata'),
    ('JAI', 'VIJP', 'Jaipur International Airport', 'Jaipur', 'India', 'Asia/Kolkata'),
    ('IXC', 'VICG', 'Chandigarh International Airport', 'Chandigarh', 'India', 'Asia/Kolkata'),
    ('TRV', 'VOTV', 'Trivandrum International Airport', 'Thiruvananthapuram', 'India', 'Asia/Kolkata'),
    ('IXB', 'VEBD', 'Bagdogra Airport', 'Siliguri', 'India', 'Asia/Kolkata'),
    ('PAT', 'VEPT', 'Jay Prakash Narayan International Airport', 'Patna', 'India', 'Asia/Kolkata'),
    ('GAU', 'VEGT', 'Lokpriya Gopinath Bordoloi International Airport', 'Guwahati', 'India', 'Asia/Kolkata'),
    ('SXR', 'VISR', 'Sheikh ul-Alam International Airport', 'Srinagar', 'India', 'Asia/Kolkata'),
    ('VTZ', 'VOVZ', 'Visakhapatnam Airport', 'Visakhapatnam', 'India', 'Asia/Kolkata'),
    ('BBI', 'VEBS', 'Biju Patnaik International Airport', 'Bhubaneswar', 'India', 'Asia/Kolkata'),
    ('IXR', 'VERC', 'Birsa Munda Airport', 'Ranchi', 'India', 'Asia/Kolkata'),
    ('IXM', 'VOMD', 'Madurai Airport', 'Madurai', 'India', 'Asia/Kolkata'),
    ('IXZ', 'VOPB', 'Veer Savarkar International Airport', 'Port Blair', 'India', 'Asia/Kolkata'),
    ('VNS', 'VIBN', 'Lal Bahadur Shastri International Airport', 'Varanasi', 'India', 'Asia/Kolkata'),
    ('IDR', 'VAID', 'Devi Ahilyabai Holkar Airport', 'Indore', 'India', 'Asia/Kolkata')
    ON CONFLICT (iata_code) DO UPDATE SET
    icao_code = EXCLUDED.icao_code,
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    country = EXCLUDED.country,
    timezone = EXCLUDED.timezone
    """)

    # Create additional indexes for better performance
    op.execute("CREATE INDEX IF NOT EXISTS idx_flights_all_airports ON flights (origin_airport_id, destination_airport_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_airports_country ON airports (country)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_flights_price_range ON flights (economy_price, business_price)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_airports_india ON airports ((country = 'India'))")
    op.execute("CREATE INDEX IF NOT EXISTS idx_airports_city ON airports (city)")
    
    # Create partial index for upcoming Indian flights
    op.execute("""
    CREATE INDEX IF NOT EXISTS idx_indian_upcoming_flights ON flights (departure_time)
    WHERE (
        SELECT country FROM airports WHERE airports.id = flights.origin_airport_id
    ) = 'India'
    AND departure_time > NOW()
    """)
    
    # Add multicolumn index for search by date range and route
    op.execute("""
    CREATE INDEX IF NOT EXISTS idx_flights_route_date ON flights 
    (origin_airport_id, destination_airport_id, departure_time)
    """)

    # Create view for popular Indian routes
    op.execute("""
    CREATE OR REPLACE VIEW popular_indian_routes AS
    SELECT 
        orig.city as origin_city,
        dest.city as destination_city,
        COUNT(*) as flight_count,
        AVG(f.economy_price) as avg_economy_price
    FROM 
        flights f
        JOIN airports orig ON f.origin_airport_id = orig.id
        JOIN airports dest ON f.destination_airport_id = dest.id
    WHERE 
        orig.country = 'India' AND dest.country = 'India'
    GROUP BY 
        orig.city, dest.city
    HAVING 
        COUNT(*) > 3
    ORDER BY 
        flight_count DESC, avg_economy_price ASC
    """)

    # Create function to find cheapest flights between Indian cities
    op.execute("""
    CREATE OR REPLACE FUNCTION find_cheapest_indian_flights(
        origin_city TEXT,
        destination_city TEXT,
        departure_date DATE
    )
    RETURNS TABLE (
        flight_id UUID,
        flight_number TEXT,
        airline_name TEXT,
        departure_time TIMESTAMP WITH TIME ZONE,
        arrival_time TIMESTAMP WITH TIME ZONE,
        economy_price NUMERIC,
        business_price NUMERIC,
        available_seats INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            f.id as flight_id,
            f.flight_number,
            a.name as airline_name,
            f.departure_time,
            f.arrival_time,
            f.economy_price,
            f.business_price,
            f.economy_available as available_seats
        FROM 
            flights f
            JOIN airlines a ON f.airline_id = a.id
            JOIN airports orig ON f.origin_airport_id = orig.id
            JOIN airports dest ON f.destination_airport_id = dest.id
        WHERE 
            orig.city = origin_city
            AND dest.city = destination_city
            AND orig.country = 'India'
            AND dest.country = 'India'
            AND f.departure_time::date = departure_date
            AND f.economy_available > 0
        ORDER BY 
            f.economy_price ASC,
            f.departure_time ASC
        LIMIT 10;
    END;
    $$
    """)

    # Create a materialized view for domestic Indian flight statistics
    op.execute("""
    CREATE MATERIALIZED VIEW indian_flight_stats AS
    SELECT
        al.code as airline_code,
        al.name as airline_name,
        COUNT(*) as total_flights,
        COUNT(*) FILTER (WHERE f.status = 'scheduled') as scheduled_flights,
        COUNT(*) FILTER (WHERE f.status = 'delayed') as delayed_flights,
        COUNT(*) FILTER (WHERE f.status = 'cancelled') as cancelled_flights,
        ROUND(AVG(f.economy_price)::numeric, 2) as avg_economy_price,
        ROUND(AVG(f.business_price)::numeric, 2) as avg_business_price,
        ROUND(MIN(f.economy_price)::numeric, 2) as min_economy_price,
        ROUND(MAX(f.economy_price)::numeric, 2) as max_economy_price
    FROM
        flights f
        JOIN airlines al ON f.airline_id = al.id
        JOIN airports orig ON f.origin_airport_id = orig.id
        JOIN airports dest ON f.destination_airport_id = dest.id
    WHERE
        orig.country = 'India' AND dest.country = 'India'
    GROUP BY
        al.code, al.name
    ORDER BY
        total_flights DESC
    WITH NO DATA;
    """)

    # Create a function to refresh the materialized view
    op.execute("""
    CREATE OR REPLACE FUNCTION refresh_indian_flight_stats()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW indian_flight_stats;
    END;
    $$
    """)

    # Execute the refresh for initial data
    op.execute("SELECT refresh_indian_flight_stats()")
    
    # Create a function to find available flight routes between Indian cities
    op.execute("""
    CREATE OR REPLACE FUNCTION find_indian_routes(
        from_city TEXT DEFAULT NULL,
        to_city TEXT DEFAULT NULL
    )
    RETURNS TABLE (
        origin_city TEXT,
        origin_iata TEXT,
        destination_city TEXT,
        destination_iata TEXT,
        airlines TEXT[],
        min_price NUMERIC,
        max_price NUMERIC,
        avg_duration INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            orig.city as origin_city,
            orig.iata_code as origin_iata,
            dest.city as destination_city,
            dest.iata_code as destination_iata,
            array_agg(DISTINCT al.code) as airlines,
            MIN(f.economy_price) as min_price,
            MAX(f.economy_price) as max_price,
            ROUND(AVG(f.duration_minutes))::integer as avg_duration
        FROM 
            flights f
            JOIN airlines al ON f.airline_id = al.id
            JOIN airports orig ON f.origin_airport_id = orig.id
            JOIN airports dest ON f.destination_airport_id = dest.id
        WHERE 
            orig.country = 'India' AND dest.country = 'India'
            AND (from_city IS NULL OR orig.city = from_city)
            AND (to_city IS NULL OR dest.city = to_city)
        GROUP BY 
            orig.city, orig.iata_code, dest.city, dest.iata_code
        HAVING 
            COUNT(*) > 0
        ORDER BY 
            origin_city, destination_city;
    END;
    $$
    """)


def downgrade():
    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS find_indian_routes(TEXT, TEXT)")
    op.execute("DROP FUNCTION IF EXISTS refresh_indian_flight_stats()")
    op.execute("DROP FUNCTION IF EXISTS find_cheapest_indian_flights(TEXT, TEXT, DATE)")
    
    # Drop materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS indian_flight_stats")
    
    # Drop view
    op.execute("DROP VIEW IF EXISTS popular_indian_routes")
    
    # Drop indexes
    op.execute("DROP INDEX IF EXISTS idx_flights_route_date")
    op.execute("DROP INDEX IF EXISTS idx_indian_upcoming_flights")
    op.execute("DROP INDEX IF EXISTS idx_airports_city")
    op.execute("DROP INDEX IF EXISTS idx_airports_india")
    op.execute("DROP INDEX IF EXISTS idx_flights_price_range")
    op.execute("DROP INDEX IF EXISTS idx_airports_country")
    op.execute("DROP INDEX IF EXISTS idx_flights_all_airports")
    
    # No need to remove data, as that would be handled in previous migration downgrades
