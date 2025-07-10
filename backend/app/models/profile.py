from sqlalchemy import Column, String, Text, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base

class Profile(Base):
    __tablename__ = 'profiles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    username = Column(String, unique=True)
    full_name = Column(String)
    avatar_url = Column(Text)
    email = Column(String)

    def __repr__(self):
        return f'<Profile {self.username}>'
