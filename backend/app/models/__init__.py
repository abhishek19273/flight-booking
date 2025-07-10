"""
SQLAlchemy models package
"""
from app.models.base import Base, TimestampMixin
from app.models.airline import Airline
from app.models.airport import Airport
from app.models.flight import Flight
from app.models.booking import Booking, BookingFlight
from app.models.passenger import Passenger
from app.models.payment import Payment

# All models should be imported here for Alembic autodiscovery
