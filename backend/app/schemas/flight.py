from pydantic import BaseModel
from typing import Optional, List, Dict, Literal
from datetime import datetime


class AirportBase(BaseModel):
    iata_code: str
    name: str
    city: str
    country: str


class AirportResponse(AirportBase):
    id: str
    icao_code: Optional[str] = None
    timezone: Optional[str] = None


class AirportDetailResponse(AirportResponse):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime


class AirlineResponse(BaseModel):
    id: str
    name: str
    code: str
    logo_url: Optional[str] = None
    created_at: datetime


class Passengers(BaseModel):
    adults: int = 1
    children: int = 0
    infants: int = 0


class FlightSearchParams(BaseModel):
    from_code: str
    to_code: str
    departure_date: str
    return_date: Optional[str] = None
    passengers: Passengers
    cabin_class: Literal['economy', 'premium-economy', 'business', 'first'] = 'economy'
    trip_type: Literal['one-way', 'round-trip'] = 'one-way'


class FlightResponse(BaseModel):
    id: str
    flight_number: str
    airline_id: str
    origin_airport_id: str
    destination_airport_id: str
    departure_time: datetime
    arrival_time: datetime
    duration_minutes: int
    status: str
    economy_price: Optional[float] = None
    premium_economy_price: Optional[float] = None
    business_price: Optional[float] = None
    first_price: Optional[float] = None
    economy_available: Optional[int] = None
    premium_economy_available: Optional[int] = None
    business_available: Optional[int] = None
    first_available: Optional[int] = None
    airline: AirlineResponse
    origin_airport: AirportResponse
    destination_airport: AirportResponse


class FlightDetailResponse(FlightResponse):
    aircraft_type: Optional[str] = None
    economy_seats: Optional[int] = None
    premium_economy_seats: Optional[int] = None
    business_seats: Optional[int] = None
    first_seats: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class FlightAvailabilityResponse(BaseModel):
    flight_id: str
    economy_available: Optional[int] = None
    premium_economy_available: Optional[int] = None
    business_available: Optional[int] = None
    first_available: Optional[int] = None
    updated_at: datetime


class FlightStatusUpdate(BaseModel):
    status: Literal['scheduled', 'delayed', 'boarding', 'departed', 'in_air', 'landed', 'arrived', 'cancelled']
    delay_minutes: Optional[int] = None
    gate_change: Optional[str] = None
    notes: Optional[str] = None
