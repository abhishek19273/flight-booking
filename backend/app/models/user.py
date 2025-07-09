"""
User model for SQLAlchemy ORM
"""
from sqlalchemy import Column, String, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    """User model representing users table"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_admin = Column(Boolean, nullable=False, default=False)

    __table_args__ = (Index('ix_users_email', 'email'),)

    # Relationships
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(email={self.email}, name={self.first_name} {self.last_name})>"
