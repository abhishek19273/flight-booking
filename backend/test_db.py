#!/usr/bin/env python
"""
Database test script to verify the async SQLAlchemy setup and migration results.
This script will:
1. Connect to the database using async SQLAlchemy
2. Run a simple query to verify the connection
3. Check if the migrated tables exist
4. Execute simple queries against the tables
"""
import asyncio
import logging
from sqlalchemy.future import select
from sqlalchemy.sql import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import AsyncSessionLocal
from app.database.init_db import init_db
from app.models.airline import Airline
from app.models.airport import Airport
from app.models.flight import Flight

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("test_db")


async def test_connection():
    """Test basic database connection"""
    try:
        await init_db()
        logger.info("✅ Database initialization successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}", exc_info=True)
        return False


async def check_tables():
    """Check if the expected tables exist and have data"""
    tables = ["airlines", "airports", "flights", "users", "bookings"]
    
    try:
        async with AsyncSessionLocal() as session:
            # Check each table
            for table in tables:
                result = await session.execute(text(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table}')"))
                exists = result.scalar()
                if exists:
                    logger.info(f"✅ Table '{table}' exists")
                else:
                    logger.warning(f"⚠️ Table '{table}' does not exist")
    except Exception as e:
        logger.error(f"❌ Error checking tables: {e}", exc_info=True)


async def query_airlines():
    """Query airlines table using SQLAlchemy ORM"""
    try:
        async with AsyncSessionLocal() as session:
            # Count airlines
            result = await session.execute(select(Airline))
            airlines = result.scalars().all()
            logger.info(f"✅ Found {len(airlines)} airlines in the database")
            
            # Display first 5 airlines
            for airline in airlines[:5]:
                logger.info(f"  - {airline.code}: {airline.name}")
            
            return len(airlines)
    except Exception as e:
        logger.error(f"❌ Error querying airlines: {e}", exc_info=True)
        return 0


async def query_airports():
    """Query airports table using SQLAlchemy ORM with focus on Indian airports"""
    try:
        async with AsyncSessionLocal() as session:
            # Count all airports
            all_airports_result = await session.execute(select(Airport))
            all_airports = all_airports_result.scalars().all()
            logger.info(f"✅ Found {len(all_airports)} airports in the database")
            
            # Count and show Indian airports
            indian_airports_result = await session.execute(
                select(Airport).where(Airport.country == "India")
            )
            indian_airports = indian_airports_result.scalars().all()
            logger.info(f"✅ Found {len(indian_airports)} Indian airports in the database")
            
            # Display first 5 Indian airports
            for airport in indian_airports[:5]:
                logger.info(f"  - {airport.iata_code}: {airport.name} ({airport.city})")
            
            return len(indian_airports)
    except Exception as e:
        logger.error(f"❌ Error querying airports: {e}", exc_info=True)
        return 0


async def query_flights():
    """Query flights table using SQLAlchemy ORM"""
    try:
        async with AsyncSessionLocal() as session:
            # Count all flights
            flights_result = await session.execute(select(Flight))
            flights = flights_result.scalars().all()
            logger.info(f"✅ Found {len(flights)} flights in the database")
            
            # Show a few sample flights
            if flights:
                for flight in flights[:3]:
                    origin_result = await session.execute(
                        select(Airport).where(Airport.id == flight.origin_airport_id)
                    )
                    origin = origin_result.scalar_one_or_none()
                    
                    dest_result = await session.execute(
                        select(Airport).where(Airport.id == flight.destination_airport_id)
                    )
                    destination = dest_result.scalar_one_or_none()
                    
                    airline_result = await session.execute(
                        select(Airline).where(Airline.id == flight.airline_id)
                    )
                    airline = airline_result.scalar_one_or_none()
                    
                    if origin and destination and airline:
                        logger.info(f"  - Flight {flight.flight_number}: {airline.code} from {origin.city} to {destination.city}")
                        logger.info(f"    Departure: {flight.departure_time}, Status: {flight.status}")
                        logger.info(f"    Economy Price: ${flight.economy_price}, Business Price: ${flight.business_price}")
            
            return len(flights)
    except Exception as e:
        logger.error(f"❌ Error querying flights: {e}", exc_info=True)
        return 0


async def test_db_functions():
    """Test database custom functions from migrations"""
    try:
        async with AsyncSessionLocal() as session:
            # Test search_airports function
            logger.info("Testing search_airports function...")
            result = await session.execute(text("SELECT * FROM search_airports('Delhi') LIMIT 3"))
            airports = result.fetchall()
            if airports:
                logger.info(f"✅ search_airports function works! Found {len(airports)} results")
                for airport in airports:
                    logger.info(f"  - {airport.iata_code}: {airport.name} ({airport.city})")
            else:
                logger.warning("⚠️ search_airports function didn't return results")
                
            # Test find_indian_routes function if it exists
            try:
                logger.info("Testing find_indian_routes function...")
                result = await session.execute(text("SELECT * FROM find_indian_routes() LIMIT 3"))
                routes = result.fetchall()
                if routes:
                    logger.info(f"✅ find_indian_routes function works! Found {len(routes)} results")
                    for route in routes:
                        logger.info(f"  - Route: {route.origin_city} to {route.destination_city}")
                else:
                    logger.warning("⚠️ find_indian_routes function didn't return results")
            except Exception:
                logger.warning("⚠️ find_indian_routes function might not exist yet or has an error")
                
    except Exception as e:
        logger.error(f"❌ Error testing database functions: {e}", exc_info=True)


async def main():
    """Main test function"""
    logger.info("🚀 Starting database test")
    
    # Test database connection
    connection_ok = await test_connection()
    if not connection_ok:
        logger.error("❌ Connection test failed, aborting further tests")
        return
    
    # Check if tables exist
    await check_tables()
    
    # Query ORM models
    airline_count = await query_airlines()
    airport_count = await query_airports()
    flight_count = await query_flights()
    
    if airline_count > 0 and airport_count > 0 and flight_count > 0:
        logger.info("✅ All basic model queries successful!")
    else:
        logger.warning("⚠️ One or more model queries did not return data")
    
    # Test database functions
    await test_db_functions()
    
    logger.info("✅ Database test complete!")


if __name__ == "__main__":
    asyncio.run(main())
