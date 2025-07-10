"""seed_flight_data

Revision ID: b913e2af69d1
Revises: 
Create Date: 2025-07-10 14:13:30.288204

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime, timedelta, timezone
import random

# revision identifiers, used by Alembic.
revision: str = 'b913e2af69d1'
down_revision: Union[str, None] = 'a5127238f717'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Define table schemas for data seeding
airlines_table = table('airlines',
    column('id', postgresql.UUID(as_uuid=True)),
    column('code', sa.String),
    column('name', sa.String),
    column('logo_url', sa.String)
)

airports_table = table('airports',
    column('id', postgresql.UUID(as_uuid=True)),
    column('iata_code', sa.String),
    column('icao_code', sa.String),
    column('name', sa.String),
    column('city', sa.String),
    column('country', sa.String),
    column('latitude', sa.Float),
    column('longitude', sa.Float),
    column('timezone', sa.String)
)

flights_table = table('flights',
    column('id', postgresql.UUID(as_uuid=True)),
    column('flight_number', sa.String),
    column('airline_id', postgresql.UUID(as_uuid=True)),
    column('origin_airport_id', postgresql.UUID(as_uuid=True)),
    column('destination_airport_id', postgresql.UUID(as_uuid=True)),
    column('departure_time', sa.DateTime(timezone=True)),
    column('arrival_time', sa.DateTime(timezone=True)),
    column('duration_minutes', sa.Integer),
    column('status', sa.String),
    column('economy_price', sa.Numeric),
    column('business_price', sa.Numeric),
    column('first_price', sa.Numeric),
    column('economy_available', sa.Integer),
    column('business_available', sa.Integer),
    column('first_available', sa.Integer),
    column('stops', sa.Integer)
)


def upgrade() -> None:
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    # Seed Airlines
    airlines_data = [
        {'id': uuid.uuid4(), 'code': 'UA', 'name': 'United Airlines', 'logo_url': 'https://example.com/ua-logo.png'},
        {'id': uuid.uuid4(), 'code': 'DL', 'name': 'Delta Air Lines', 'logo_url': 'https://example.com/dl-logo.png'},
        {'id': uuid.uuid4(), 'code': 'AA', 'name': 'American Airlines', 'logo_url': 'https://example.com/aa-logo.png'},
        {'id': uuid.uuid4(), 'code': 'EK', 'name': 'Emirates', 'logo_url': 'https://example.com/ek-logo.png'},
        {'id': uuid.uuid4(), 'code': 'LH', 'name': 'Lufthansa', 'logo_url': 'https://example.com/lh-logo.png'},
        {'id': uuid.uuid4(), 'code': 'BA', 'name': 'British Airways', 'logo_url': 'https://example.com/ba-logo.png'},
        {'id': uuid.uuid4(), 'code': 'SQ', 'name': 'Singapore Airlines', 'logo_url': 'https://example.com/sq-logo.png'},
        {'id': uuid.uuid4(), 'code': 'AF', 'name': 'Air France', 'logo_url': 'https://example.com/af-logo.png'},
        {'id': uuid.uuid4(), 'code': 'KL', 'name': 'KLM Royal Dutch Airlines', 'logo_url': 'https://example.com/kl-logo.png'},
        {'id': uuid.uuid4(), 'code': 'WN', 'name': 'Southwest Airlines', 'logo_url': 'https://example.com/wn-logo.png'},
    ]
    op.bulk_insert(airlines_table, airlines_data)

    # Seed Airports
    airports_data = [
        {'id': uuid.uuid4(), 'iata_code': 'JFK', 'name': 'John F. Kennedy International Airport', 'city': 'New York', 'country': 'USA'},
        {'id': uuid.uuid4(), 'iata_code': 'LAX', 'name': 'Los Angeles International Airport', 'city': 'Los Angeles', 'country': 'USA'},
        {'id': uuid.uuid4(), 'iata_code': 'LHR', 'name': 'Heathrow Airport', 'city': 'London', 'country': 'United Kingdom'},
        {'id': uuid.uuid4(), 'iata_code': 'HND', 'name': 'Tokyo Haneda Airport', 'city': 'Tokyo', 'country': 'Japan'},
        {'id': uuid.uuid4(), 'iata_code': 'DXB', 'name': 'Dubai International Airport', 'city': 'Dubai', 'country': 'UAE'},
        {'id': uuid.uuid4(), 'iata_code': 'SFO', 'name': 'San Francisco International Airport', 'city': 'San Francisco', 'country': 'USA'},
        {'id': uuid.uuid4(), 'iata_code': 'CDG', 'name': 'Charles de Gaulle Airport', 'city': 'Paris', 'country': 'France'},
        {'id': uuid.uuid4(), 'iata_code': 'AMS', 'name': 'Amsterdam Airport Schiphol', 'city': 'Amsterdam', 'country': 'Netherlands'},
        {'id': uuid.uuid4(), 'iata_code': 'FRA', 'name': 'Frankfurt Airport', 'city': 'Frankfurt', 'country': 'Germany'},
        {'id': uuid.uuid4(), 'iata_code': 'SIN', 'name': 'Singapore Changi Airport', 'city': 'Singapore', 'country': 'Singapore'},
        {'id': uuid.uuid4(), 'iata_code': 'ORD', 'name': 'O\'Hare International Airport', 'city': 'Chicago', 'country': 'USA'},
        {'id': uuid.uuid4(), 'iata_code': 'DFW', 'name': 'Dallas/Fort Worth International Airport', 'city': 'Dallas', 'country': 'USA'},
    ]
    op.bulk_insert(airports_table, airports_data)

    # Fetch IDs for relationships
    airlines = {a['code']: a['id'] for a in airlines_data}
    airports = {a['iata_code']: a['id'] for a in airports_data}

    # Seed Flights
    flights_data = []
    today = datetime.now(timezone.utc)
    routes = [
        ('JFK', 'LAX', 'UA', 390), ('LAX', 'JFK', 'UA', 330),
        ('JFK', 'LHR', 'BA', 420), ('LHR', 'JFK', 'BA', 450),
        ('SFO', 'HND', 'SQ', 660), ('HND', 'SFO', 'SQ', 600),
        ('LHR', 'DXB', 'EK', 400), ('DXB', 'LHR', 'EK', 430),
        ('CDG', 'JFK', 'AF', 480), ('JFK', 'CDG', 'AF', 450),
        ('AMS', 'FRA', 'LH', 60), ('FRA', 'AMS', 'LH', 65),
        ('DFW', 'ORD', 'AA', 150), ('ORD', 'DFW', 'AA', 160),
        ('LAX', 'SFO', 'WN', 75), ('SFO', 'LAX', 'WN', 80),
        ('SIN', 'LHR', 'SQ', 780), ('LHR', 'SIN', 'SQ', 760),
    ]

    for i in range(30): # Create flights for the next 30 days
        current_date = today + timedelta(days=i)
        for origin, dest, airline_code, duration in routes:
            for j in range(random.randint(1, 4)): # 1 to 4 flights per day per route
                departure_time = current_date.replace(hour=random.randint(6, 22), minute=random.choice([0, 15, 30, 45]), second=0, microsecond=0)
                arrival_time = departure_time + timedelta(minutes=duration)
                flights_data.append({
                    'id': uuid.uuid4(),
                    'flight_number': f'{airline_code}{random.randint(100, 999)}',
                    'airline_id': airlines[airline_code],
                    'origin_airport_id': airports[origin],
                    'destination_airport_id': airports[dest],
                    'departure_time': departure_time,
                    'arrival_time': arrival_time,
                    'duration_minutes': duration,
                    'status': 'scheduled',
                    'economy_price': round(random.uniform(200.0, 800.0), 2),
                    'business_price': round(random.uniform(1000.0, 4000.0), 2),
                    'first_price': round(random.uniform(4000.0, 10000.0), 2),
                    'economy_available': random.randint(50, 200),
                    'business_available': random.randint(10, 50),
                    'first_available': random.randint(4, 16),
                    'stops': 0
                })

    op.bulk_insert(flights_table, flights_data)

def downgrade() -> None:
    bind = op.get_bind()
    session = sa.orm.Session(bind=bind)

    op.execute(flights_table.delete())
    op.execute(airlines_table.delete())
    op.execute(airports_table.delete())

