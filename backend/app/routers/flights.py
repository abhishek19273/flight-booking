import logging
from fastapi import APIRouter, HTTPException, status, Request, Depends
from fastapi.responses import StreamingResponse
from app.services.auth import get_current_user
from app.services.booking import get_booking_details_by_id
import random
from typing import List, Literal
from app.schemas.flight import FlightSearchParams, FlightResponse, FlightDetailResponse, FlightAvailabilityResponse, FlightStatusUpdate, Passengers
from app.database.init_db import get_supabase_client
from sse_starlette.sse import EventSourceResponse
import json
import asyncio
import warnings
from datetime import datetime

router = APIRouter()


@router.get("/search", response_model=List[FlightResponse])
async def search_flights(
    from_code: str,
    to_code: str,
    departure_date: str,
    return_date: str = None,
    cabin_class: Literal['economy', 'premium-economy', 'business', 'first'] = 'economy',
    adults: int = 1,
    children: int = 0,
    infants: int = 0,
    sort_by: Literal['price', 'duration', 'departure_time', 'arrival_time'] = None,
    sort_order: Literal['asc', 'desc'] = 'asc',
    min_price: float = None,
    max_price: float = None,
    airline_code: str = None,
    max_duration: int = None,  # in minutes
):
    """
    Search for flights based on origin, destination, date, and other criteria.
    Supports round-trip searches, filtering, and sorting.
    """
    passengers = Passengers(adults=adults, children=children, infants=infants)
    trip_type = 'round-trip' if return_date else 'one-way'
    
    params = FlightSearchParams(
        from_code=from_code,
        to_code=to_code,
        departure_date=departure_date,
        return_date=return_date,
        passengers=passengers,
        cabin_class=cabin_class,
        trip_type=trip_type
    )

    total_passengers = params.passengers.adults + params.passengers.children
    cabin_availability_column = f"{params.cabin_class.replace('-', '_')}_available"
    cabin_price_column = f"{params.cabin_class.replace('-', '_')}_price"

    try:
        warnings.warn(
            "get_supabase_client() is deprecated. Use SQLAlchemy ORM models and async sessions instead.",
            DeprecationWarning
        )

        supabase = get_supabase_client()

        # First, get the IDs of the airports from their IATA codes
        origin_airport_response = supabase.table('airports').select('id').eq('iata_code', params.from_code.upper()).execute()
        if not origin_airport_response.data:
            return []  # No flights if origin airport not found
        origin_airport_id = origin_airport_response.data[0]['id']

        destination_airport_response = supabase.table('airports').select('id').eq('iata_code', params.to_code.upper()).execute()
        if not destination_airport_response.data:
            return []  # No flights if destination airport not found
        destination_airport_id = destination_airport_response.data[0]['id']

        # Query for outbound flights
        outbound_query = supabase.table('flights').select(
            '*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)'
        )
        outbound_query = outbound_query.eq('origin_airport_id', origin_airport_id)
        outbound_query = outbound_query.eq('destination_airport_id', destination_airport_id)
        outbound_query = outbound_query.gte("departure_time", f"{params.departure_date}T00:00:00") \
                                      .lt("departure_time", f"{params.departure_date}T23:59:59")

        # Apply common filters
        if total_passengers > 0:
            outbound_query = outbound_query.gte(cabin_availability_column, total_passengers)
        
        # Apply price filters if specified
        if min_price is not None:
            outbound_query = outbound_query.gte(cabin_price_column, min_price)
        if max_price is not None:
            outbound_query = outbound_query.lte(cabin_price_column, max_price)
            
        # Apply duration filter if specified
        if max_duration is not None:
            outbound_query = outbound_query.lte('duration_minutes', max_duration)
            
        # Apply airline filter if specified
        if airline_code:
            airline_response = supabase.table('airlines').select('id').eq('iata_code', airline_code.upper()).execute()
            if airline_response.data:
                airline_id = airline_response.data[0]['id']
                outbound_query = outbound_query.eq('airline_id', airline_id)
        
        # Apply sorting
        if sort_by:
            # Handle price sorting specially since it depends on cabin class
            if sort_by == 'price':
                outbound_query = outbound_query.order(cabin_price_column, desc=(sort_order == 'desc'))
            else:
                outbound_query = outbound_query.order(sort_by, desc=(sort_order == 'desc'))
        
        outbound_response = outbound_query.execute()
        
        if hasattr(outbound_response, 'error') and outbound_response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {outbound_response.error.message}"
            )
        
        outbound_flights = outbound_response.data
        
        # For one-way trips, return just the outbound flights
        if trip_type == 'one-way':
            return outbound_flights
        
        # For round-trips, also query return flights
        return_query = supabase.table('flights').select(
            '*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)'
        )
        return_query = return_query.eq('origin_airport_id', destination_airport_id)  # Swap origin and destination
        return_query = return_query.eq('destination_airport_id', origin_airport_id)
        return_query = return_query.gte("departure_time", f"{params.return_date}T00:00:00") \
                                  .lt("departure_time", f"{params.return_date}T23:59:59")
        
        # Apply the same filters to return flights
        if total_passengers > 0:
            return_query = return_query.gte(cabin_availability_column, total_passengers)
            
        if min_price is not None:
            return_query = return_query.gte(cabin_price_column, min_price)
        if max_price is not None:
            return_query = return_query.lte(cabin_price_column, max_price)
            
        if max_duration is not None:
            return_query = return_query.lte('duration_minutes', max_duration)
            
        if airline_code:
            if airline_response and airline_response.data:
                return_query = return_query.eq('airline_id', airline_id)
        
        # Apply the same sorting to return flights
        if sort_by:
            if sort_by == 'price':
                return_query = return_query.order(cabin_price_column, desc=(sort_order == 'desc'))
            else:
                return_query = return_query.order(sort_by, desc=(sort_order == 'desc'))
        
        return_response = return_query.execute()
        
        if hasattr(return_response, 'error') and return_response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {return_response.error.message}"
            )
        
        # Combine outbound and return flights
        # Mark outbound flights
        for flight in outbound_flights:
            flight['is_return'] = False
            
        # Mark return flights
        return_flights = return_response.data
        for flight in return_flights:
            flight['is_return'] = True
            
        # Return combined results
        return outbound_flights + return_flights

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/{flight_id}", response_model=FlightDetailResponse)
async def get_flight_details(flight_id: str):
    """
    Retrieve detailed information for a specific flight.
    """
    try:
        response = get_supabase_client().table('flights_with_details').select('*').eq('id', flight_id).single().execute()

        if hasattr(response, 'error') and response.error:
            if "PGRST116" in response.error.code: # "The result contains 0 rows"
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {response.error.message}")

        return response.data

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{flight_id}/availability", response_model=FlightAvailabilityResponse)
async def get_flight_availability(flight_id: str):
    """
    Get seat availability for a specific flight.
    """
    try:
        response = get_supabase_client().table('flights').select(
            'economy_available, premium_economy_available, business_available, first_available'
        ).eq('id', flight_id).single().execute()

        if hasattr(response, 'error') and response.error:
            if "PGRST116" in response.error.code:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {response.error.message}")

        return response.data

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{flight_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def update_flight_status(flight_id: str, status_update: FlightStatusUpdate):
    """
    Update the status of a flight (e.g., 'delayed', 'cancelled').
    """
    try:
        response = get_supabase_client().table('flights').update({'status': status_update.status}).eq('id', flight_id).execute()

        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {response.error.message}")

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found to update")

        return

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/updates/stream")
async def stream_flight_updates(request: Request):
    """
    SSE endpoint to stream mock flight status updates for demonstration.
    """
    async def mock_event_generator():
        flight_number = "SBJ-2024"
        statuses = ["On Time", "Delayed", "Boarding", "Departed", "In Air", "Landed"]
        index = 0
        try:
            while True:
                if await request.is_disconnected():
                    print("Client disconnected, breaking from mock stream.")
                    break

                mock_payload = {
                    "flight_id": flight_number,
                    "status": statuses[index % len(statuses)],
                    "updated_at": datetime.utcnow().isoformat(),
                    "message": f"Flight {flight_number} status is now: {statuses[index % len(statuses)]}."
                }

                yield {
                    "event": "flight_update",
                    "data": json.dumps(mock_payload)
                }

                index += 1
                await asyncio.sleep(5)  # Send an update every 5 seconds

        except asyncio.CancelledError:
            print("Mock stream cancelled.")
            raise

    return EventSourceResponse(mock_event_generator())

logger = logging.getLogger(__name__)

@router.get("/track/{booking_id}")
async def track_flight_status(booking_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """
    SSE endpoint to stream flight status updates for a specific booking.
    This version uses the actual flight details to generate more realistic mock data.
    """
    try:
        user_id = current_user['id']
        logger.info(f"Attempting to track flight for booking_id: {booking_id} for user_id: {user_id}")
        
        # 1. Fetch booking details, ensuring it exists and belongs to the current user.
        booking_details = await get_booking_details_by_id(booking_id, user_id=user_id)
        
        if not booking_details:
            logger.warning(f"Tracking failed: Booking not found for id {booking_id} and user {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found or you do not have permission to view it.")

        logger.info(f"Successfully found booking {booking_id} for tracking.")
        # The service returns a list of 'flights', not a single 'flight'. We'll track the first one.
        if not booking_details or not booking_details.get('flights') or not booking_details['flights']:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight details for this booking could not be found.")

        # Use the 'flight' object nested inside the first item of the 'flights' list
        flight_info = booking_details['flights'][0]['flight']
        origin = flight_info.get('origin', {}).get('name', 'N/A')
        destination = flight_info.get('destination', {}).get('name', 'N/A')
        departure_time = flight_info.get('departure_time', 'N/A')
        arrival_time = flight_info.get('arrival_time', 'N/A')
        flight_number = flight_info.get('flight_number', 'N/A')
        departure_gate = flight_info.get('departure_gate', 'TBA')
        arrival_gate = flight_info.get('arrival_gate', 'TBA')

    except HTTPException as e:
        # Forward HTTP exceptions from the service layer
        raise e
    except Exception as e:
        # Catch any other unexpected errors during detail fetching
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve booking details: {str(e)}"
        )

    async def event_generator():
        """Yields mock flight status updates periodically using real flight data."""
        statuses = [
            {"status": "Confirmed", "location": f"{origin}", "details": f"Your flight {flight_number} to {destination} is confirmed for {departure_time}."},
            {"status": "On Time", "location": f"Gate {departure_gate}", "details": "Boarding will begin approximately 45 minutes before departure."},
            {"status": "Boarding", "location": f"Gate {departure_gate}", "details": "Now boarding all zones. Please have your boarding pass ready."},
            {"status": "Departed", "location": "En route", "details": f"Flight {flight_number} has departed from {origin}."},
            {"status": "In Air", "location": "Cruising Altitude", "details": f"Estimated time of arrival in {destination} is {arrival_time}."},
            {"status": "Landed", "location": f"{destination}", "details": f"Flight {flight_number} has landed at {destination}."},
            {"status": "Arrived", "location": f"Gate {arrival_gate}", "details": f"Welcome to {destination}. Baggage claim is at carousel {random.randint(1, 10)}."}
        ]
        try:
            for status_update in statuses:
                if await request.is_disconnected():
                    print(f"Client disconnected early from tracking booking {booking_id}")
                    break
                yield f"event: flight_status\ndata: {json.dumps(status_update)}\n\n"
                await asyncio.sleep(random.uniform(3, 6))
            
            if not await request.is_disconnected():
                yield f"event: end_of_stream\ndata: {json.dumps({'status': 'Complete', 'details': 'Tracking finished.'})}\n\n"

        except asyncio.CancelledError:
            print(f"Client disconnected from tracking booking {booking_id}")
            # No need to raise, as the connection is already closed

    return StreamingResponse(event_generator(), media_type="text/event-stream")
