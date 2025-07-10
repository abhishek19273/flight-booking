from fastapi import APIRouter, HTTPException, status, Request
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
    cabin_class: Literal['economy', 'premium-economy', 'business', 'first'] = 'economy',
    adults: int = 1,
    children: int = 0,
    infants: int = 0,
):
    """
    Search for flights based on origin, destination, date, and other criteria.
    """
    passengers = Passengers(adults=adults, children=children, infants=infants)
    params = FlightSearchParams(
        from_code=from_code,
        to_code=to_code,
        departure_date=departure_date,
        passengers=passengers,
        cabin_class=cabin_class,
        trip_type='one-way'
    )

    total_passengers = params.passengers.adults + params.passengers.children
    cabin_availability_column = f"{params.cabin_class.replace('-', '_')}_available"

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

        # Now, query flights using the airport IDs
        query = supabase.table('flights').select(
            '*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)'
        )
        query = query.eq('origin_airport_id', origin_airport_id)
        query = query.eq('destination_airport_id', destination_airport_id)

        query = query.gte("departure_time", f"{params.departure_date}T00:00:00") \
                     .lt("departure_time", f"{params.departure_date}T23:59:59")

        if total_passengers > 0:
            query = query.gte(cabin_availability_column, total_passengers)

        response = query.execute()

        if hasattr(response, 'error') and response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {response.error.message}"
            )

        return response.data

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
    SSE endpoint to stream flight status updates to clients.
    """
    async def event_generator():
        supabase = get_supabase_client()
        # In a real application, you would subscribe to a specific flight_id channel
        # For this example, we listen to all public flight updates
        channel = supabase.channel('flight_updates')

        def callback(payload):
            # This is a simplistic callback. In a real app, you'd want to push
            # this payload into a queue that the event_generator can read from.
            # Directly yielding from here is not possible as this callback
            # is not part of the generator's async context.
            print(f"Flight update received: {payload}")

        channel.on('postgres_changes', event='*', schema='public', table='flights', callback=callback)
        supabase.postgrest.subscribe(channel)

        try:
            while True:
                if await request.is_disconnected():
                    print("Client disconnected, closing stream.")
                    supabase.postgrest.unsubscribe(channel)
                    break
                
                # Send a heartbeat to keep the connection alive
                yield {
                    "event": "heartbeat",
                    "data": json.dumps({"timestamp": datetime.utcnow().isoformat()})
                }
                await asyncio.sleep(15)

        except asyncio.CancelledError:
            print("Stream cancelled by server.")
            supabase.postgrest.unsubscribe(channel)
            raise

    return EventSourceResponse(event_generator())
