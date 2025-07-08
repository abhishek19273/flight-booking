"""
Airline model for SQLAlchemy ORM
"""
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import text
from app.database.database import Base
from app.models.base import TimestampMixin

class Airline(Base, TimestampMixin):
    """Airline model representing airlines table"""
    __tablename__ = "airlines"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<Airline(code={self.code}, name={self.name})>"
