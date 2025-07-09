"""
Flight model for SQLAlchemy ORM
"""
from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.base import TimestampMixin

class Flight(Base, TimestampMixin):
    """Flight model representing flights table"""
    __tablename__ = "flights"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    flight_number = Column(String, nullable=False)
    airline_id = Column(UUID(as_uuid=True), ForeignKey("airlines.id"), nullable=False)
    origin_airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    destination_airport_id = Column(UUID(as_uuid=True), ForeignKey("airports.id"), nullable=False)
    departure_time = Column(DateTime(timezone=True), nullable=False)
    arrival_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    status = Column(String, nullable=False, server_default="scheduled")
    
    economy_price = Column(Numeric, nullable=False)
    premium_economy_price = Column(Numeric, nullable=True)
    business_price = Column(Numeric, nullable=True)
    first_price = Column(Numeric, nullable=True)
    
    economy_available = Column(Integer, server_default="0", nullable=False)
    premium_economy_available = Column(Integer, server_default="0", nullable=True)
    business_available = Column(Integer, server_default="0", nullable=True)
    first_available = Column(Integer, server_default="0", nullable=True)
    
    stops = Column(Integer, server_default="0", nullable=False)
    
    # Relationships
    airline = relationship("Airline")
    origin_airport = relationship("Airport", foreign_keys=[origin_airport_id])
    destination_airport = relationship("Airport", foreign_keys=[destination_airport_id])
    booking_flights = relationship("BookingFlight", back_populates="flight")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('scheduled', 'delayed', 'cancelled', 'in_air', 'landed', 'diverted')"),
        Index('ix_flights_origin_dest_departure', 'origin_airport_id', 'destination_airport_id', 'departure_time'),
        Index('ix_flights_departure_time', 'departure_time'),
        Index('ix_flights_airline_id', 'airline_id'),
    )
    
    def __repr__(self):
        return f"<Flight(number={self.flight_number}, from={self.origin_airport_id}, to={self.destination_airport_id})>"
