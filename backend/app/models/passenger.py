"""
Passenger model for SQLAlchemy ORM
"""
from sqlalchemy import Column, String, ForeignKey, Date, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.base import TimestampMixin

class Passenger(Base, TimestampMixin):
    """Passenger model representing passengers table"""
    __tablename__ = "passengers"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    passport_number = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    cabin_class = Column(String, nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="passengers")

    # Constraints
    __table_args__ = (
        CheckConstraint("type IN ('adult', 'child', 'infant')"),
        CheckConstraint("cabin_class IN ('economy', 'premium-economy', 'business', 'first')"),
        Index('ix_passengers_booking_id', 'booking_id'),
    )
    
    def __repr__(self):
        return f"<Passenger(name={self.first_name} {self.last_name}, type={self.type})>"
