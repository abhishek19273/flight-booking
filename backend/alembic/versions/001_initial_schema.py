"""Initial schema creation

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-07-09 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create UUID extension if not already present
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Airlines table
    op.create_table('airlines',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Airports table
    op.create_table('airports',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('iata_code', sa.String(), nullable=False),
        sa.Column('icao_code', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=False),
        sa.Column('country', sa.String(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('iata_code')
    )
    
    # Users table
    op.create_table('users',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_admin', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    # Flights table
    op.create_table('flights',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('flight_number', sa.String(), nullable=False),
        sa.Column('airline_id', UUID(), nullable=False),
        sa.Column('origin_airport_id', UUID(), nullable=False),
        sa.Column('destination_airport_id', UUID(), nullable=False),
        sa.Column('departure_time', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('arrival_time', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), server_default=sa.text("'scheduled'"), nullable=False),
        sa.Column('economy_price', sa.Numeric(), nullable=False),
        sa.Column('premium_economy_price', sa.Numeric(), nullable=True),
        sa.Column('business_price', sa.Numeric(), nullable=True),
        sa.Column('first_price', sa.Numeric(), nullable=True),
        sa.Column('economy_available', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('premium_economy_available', sa.Integer(), server_default=sa.text('0'), nullable=True),
        sa.Column('business_available', sa.Integer(), server_default=sa.text('0'), nullable=True),
        sa.Column('first_available', sa.Integer(), server_default=sa.text('0'), nullable=True),
        sa.Column('stops', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['airline_id'], ['airlines.id'], ),
        sa.ForeignKeyConstraint(['origin_airport_id'], ['airports.id'], ),
        sa.ForeignKeyConstraint(['destination_airport_id'], ['airports.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('scheduled', 'delayed', 'cancelled', 'in_air', 'landed', 'diverted')")
    )
    
    # Bookings table
    op.create_table('bookings',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', UUID(), nullable=False),
        sa.Column('booking_reference', sa.String(), nullable=False),
        sa.Column('trip_type', sa.String(), nullable=False),
        sa.Column('total_amount', sa.Numeric(), nullable=False),
        sa.Column('status', sa.String(), server_default=sa.text("'confirmed'"), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booking_reference'),
        sa.CheckConstraint("trip_type IN ('one-way', 'round-trip')"),
        sa.CheckConstraint("status IN ('confirmed', 'cancelled', 'pending')")
    )
    
    # Booking Flights table
    op.create_table('booking_flights',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('booking_id', UUID(), nullable=False),
        sa.Column('flight_id', UUID(), nullable=False),
        sa.Column('is_return_flight', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['flight_id'], ['flights.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('booking_id', 'flight_id', 'is_return_flight', name='unique_booking_flight')
    )
    
    # Passengers table
    op.create_table('passengers',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('booking_id', UUID(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('passport_number', sa.String(), nullable=True),
        sa.Column('nationality', sa.String(), nullable=True),
        sa.Column('cabin_class', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("type IN ('adult', 'child', 'infant')"),
        sa.CheckConstraint("cabin_class IN ('economy', 'premium-economy', 'business', 'first')")
    )
    
    # Payments table
    op.create_table('payments',
        sa.Column('id', UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('booking_id', UUID(), nullable=False),
        sa.Column('amount', sa.Numeric(), nullable=False),
        sa.Column('currency', sa.String(), server_default=sa.text("'USD'"), nullable=False),
        sa.Column('payment_method', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('transaction_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('pending', 'completed', 'failed', 'refunded')")
    )
    
    # Create indexes for better performance
    op.create_index(op.f('idx_flights_airline_id'), 'flights', ['airline_id'])
    op.create_index(op.f('idx_flights_origin_airport_id'), 'flights', ['origin_airport_id'])
    op.create_index(op.f('idx_flights_destination_airport_id'), 'flights', ['destination_airport_id'])
    op.create_index(op.f('idx_flights_departure_time'), 'flights', ['departure_time'])
    op.create_index(op.f('idx_flights_arrival_time'), 'flights', ['arrival_time'])
    op.create_index(op.f('idx_flights_status'), 'flights', ['status'])
    op.create_index(op.f('idx_bookings_user_id'), 'bookings', ['user_id'])
    op.create_index(op.f('idx_booking_flights_booking_id'), 'booking_flights', ['booking_id'])
    op.create_index(op.f('idx_booking_flights_flight_id'), 'booking_flights', ['flight_id'])
    op.create_index(op.f('idx_passengers_booking_id'), 'passengers', ['booking_id'])
    op.create_index(op.f('idx_payments_booking_id'), 'payments', ['booking_id'])
    
    # Create function to auto-update timestamps
    op.execute('''
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    ''')
    
    # Create triggers for updated_at columns
    op.execute('''
    CREATE TRIGGER update_flights_updated_at
    BEFORE UPDATE ON flights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ''')
    
    op.execute('''
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ''')
    
    op.execute('''
    CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ''')
    
    op.execute('''
    CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ''')


def downgrade():
    # Drop triggers first
    op.execute('DROP TRIGGER IF EXISTS update_payments_updated_at ON payments')
    op.execute('DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings')
    op.execute('DROP TRIGGER IF EXISTS update_users_updated_at ON users')
    op.execute('DROP TRIGGER IF EXISTS update_flights_updated_at ON flights')
    
    # Drop the timestamp update function
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column()')
    
    # Drop all indexes
    op.drop_index(op.f('idx_payments_booking_id'), table_name='payments')
    op.drop_index(op.f('idx_passengers_booking_id'), table_name='passengers')
    op.drop_index(op.f('idx_booking_flights_flight_id'), table_name='booking_flights')
    op.drop_index(op.f('idx_booking_flights_booking_id'), table_name='booking_flights')
    op.drop_index(op.f('idx_bookings_user_id'), table_name='bookings')
    op.drop_index(op.f('idx_flights_status'), table_name='flights')
    op.drop_index(op.f('idx_flights_arrival_time'), table_name='flights')
    op.drop_index(op.f('idx_flights_departure_time'), table_name='flights')
    op.drop_index(op.f('idx_flights_destination_airport_id'), table_name='flights')
    op.drop_index(op.f('idx_flights_origin_airport_id'), table_name='flights')
    op.drop_index(op.f('idx_flights_airline_id'), table_name='flights')
    
    # Drop tables in reverse order to avoid foreign key constraints
    op.drop_table('payments')
    op.drop_table('passengers')
    op.drop_table('booking_flights')
    op.drop_table('bookings')
    op.drop_table('flights')
    op.drop_table('users')
    op.drop_table('airports')
    op.drop_table('airlines')
