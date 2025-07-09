"""
Payment model for SQLAlchemy ORM
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.base import TimestampMixin

class Payment(Base, TimestampMixin):
    """Payment model representing payments table"""
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    amount = Column(Numeric, nullable=False)
    currency = Column(String, server_default="USD", nullable=False)
    payment_method = Column(String, nullable=False)
    status = Column(String, nullable=False)
    transaction_id = Column(String, nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="payments")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed', 'failed', 'refunded')"),
        Index('ix_payments_booking_id', 'booking_id'),
        Index('ix_payments_transaction_id', 'transaction_id'),
    )
    
    def __repr__(self):
        return f"<Payment(booking_id={self.booking_id}, amount={self.amount}, status={self.status})>"
