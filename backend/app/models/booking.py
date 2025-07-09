"""
Booking models for SQLAlchemy ORM
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, Boolean, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.base import TimestampMixin

class Booking(Base, TimestampMixin):
    """Booking model representing bookings table"""
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    booking_reference = Column(String, nullable=False, unique=True)
    trip_type = Column(String, nullable=False)
    total_amount = Column(Numeric, nullable=False)
    status = Column(String, nullable=False, server_default="confirmed")
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    booking_flights = relationship("BookingFlight", back_populates="booking", cascade="all, delete-orphan")
    passengers = relationship("Passenger", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("trip_type IN ('one-way', 'round-trip')"),
        CheckConstraint("status IN ('confirmed', 'cancelled', 'pending')"),
        Index('ix_bookings_user_id_created_at', 'user_id', 'created_at'),
    )
    
    def __repr__(self):
        return f"<Booking(reference={self.booking_reference}, user_id={self.user_id})>"


class BookingFlight(Base, TimestampMixin):
    """BookingFlight model representing booking_flights table (join table)"""
    __tablename__ = "booking_flights"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    flight_id = Column(UUID(as_uuid=True), ForeignKey("flights.id"), nullable=False)
    is_return_flight = Column(Boolean, server_default="false", nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="booking_flights")
    flight = relationship("Flight", back_populates="booking_flights")
    
    # Unique constraint to prevent duplicating the same flight in a booking
    __table_args__ = (
        UniqueConstraint('booking_id', 'flight_id', 'is_return_flight', name='unique_booking_flight'),
    )
    
    def __repr__(self):
        return f"<BookingFlight(booking_id={self.booking_id}, flight_id={self.flight_id})>"
