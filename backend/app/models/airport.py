"""
Airport model for SQLAlchemy ORM
"""
from sqlalchemy import Column, String, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from app.database.database import Base
from app.models.base import TimestampMixin

class Airport(Base, TimestampMixin):
    """Airport model representing airports table"""
    __tablename__ = "airports"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    iata_code = Column(String, nullable=False, unique=True)
    icao_code = Column(String, nullable=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timezone = Column(String, nullable=True)

    __table_args__ = (Index('ix_airports_iata_code', 'iata_code'),)
    
    def __repr__(self):
        return f"<Airport(iata_code={self.iata_code}, name={self.name}, city={self.city})>"
