from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from app.schemas.flight import FlightResponse


class PassengerCreate(BaseModel):
    type: Literal['adult', 'child', 'infant']
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    passport_number: Optional[str] = None
    nationality: Optional[str] = None
    cabin_class: Literal['economy', 'premium-economy', 'business', 'first']


class BookingFlightCreate(BaseModel):
    flight_id: str
    is_return_flight: bool = False


class BookingCreate(BaseModel):
    trip_type: Literal['one-way', 'round-trip']
    flights: List[BookingFlightCreate]
    passengers: List[PassengerCreate]
    total_amount: float


class BookingUpdate(BaseModel):
    status: Optional[Literal['confirmed', 'cancelled']] = None


class PassengerResponse(PassengerCreate):
    id: str
    booking_id: str
    created_at: datetime


class BookingFlightResponse(BaseModel):
    id: str
    booking_id: str
    flight_id: str
    is_return_flight: bool
    flight: Optional[FlightResponse] = None
    created_at: datetime


class BookingResponse(BaseModel):
    id: str
    user_id: str
    booking_reference: str
    trip_type: str
    total_amount: float
    status: str
    created_at: datetime
    updated_at: datetime


class BookingDetailResponse(BookingResponse):
    flights: List[BookingFlightResponse]
    passengers: List[PassengerResponse]
