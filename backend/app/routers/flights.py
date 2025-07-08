from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import List
from app.schemas.flight import FlightSearchParams, FlightResponse, FlightDetailResponse, FlightAvailabilityResponse, FlightStatusUpdate
from app.database.init_db import get_supabase_client
from sse_starlette.sse import EventSourceResponse
import json
import asyncio
from ..services.email import EmailNotificationService

router = APIRouter()


@router.post("/search", response_model=List[FlightResponse])
async def search_flights(search_params: FlightSearchParams):
    """
    Search for flights based on origin, destination, date, and other criteria
    """
    supabase = get_supabase_client()
    
    # Build the query
    query = supabase.table("flights") \
        .select("*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)") \
        .eq("origin_airport.iata_code", search_params.from_code.upper()) \
        .eq("destination_airport.iata_code", search_params.to_code.upper())
        
    # Add date filter
    # Format date as ISO string for comparison
    departure_date = search_params.departure_date
    query = query.gte("departure_time", f"{departure_date}T00:00:00") \
                .lt("departure_time", f"{departure_date}T23:59:59")
    
    # Add cabin class availability filter
    total_passengers = search_params.passengers.adults + search_params.passengers.children + search_params.passengers.infants
    cabin_class = search_params.cabin_class
    
    if cabin_class == "economy":
        query = query.gte("economy_available", total_passengers)
    elif cabin_class == "premium-economy":
        query = query.gte("premium_economy_available", total_passengers)
    elif cabin_class == "business":
        query = query.gte("business_available", total_passengers)
    elif cabin_class == "first":
        query = query.gte("first_available", total_passengers)
    
    # Execute the query
    response = query.execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {response.error}"
        )
    
    return response.data


@router.get("/{flight_id}", response_model=FlightDetailResponse)
async def get_flight(flight_id: str):
    """
    Get detailed information about a specific flight
    """
    supabase = get_supabase_client()
    
    # Get flight with related data
    response = supabase.table("flights") \
        .select("*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)") \
        .eq("id", flight_id) \
        .single() \
        .execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight with ID {flight_id} not found"
        )
    
    return response.data


@router.get("/{flight_id}/availability", response_model=FlightAvailabilityResponse)
async def get_flight_availability(flight_id: str, cabin_class: str = None):
    """
    Get current seat availability for a flight
    """
    supabase = get_supabase_client()
    
    # Select availability fields based on cabin class
    fields = ["id as flight_id", "updated_at"]
    
    if cabin_class:
        if cabin_class == "economy":
            fields.append("economy_available")
        elif cabin_class == "premium-economy":
            fields.append("premium_economy_available")
        elif cabin_class == "business":
            fields.append("business_available")
        elif cabin_class == "first":
            fields.append("first_available")
    else:
        fields.extend([
            "economy_available", 
            "premium_economy_available", 
            "business_available", 
            "first_available"
        ])
    
    # Query the database
    response = supabase.table("flights") \
        .select(",".join(fields)) \
        .eq("id", flight_id) \
        .single() \
        .execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight with ID {flight_id} not found"
        )
    
    return response.data


async def flight_status_event_generator(flight_id: str):
    """
    Generator for Server-Sent Events with flight status updates
    """
    try:
        supabase = get_supabase_client()
        
        # Initial fetch of flight status
        initial_response = supabase.table("flights") \
            .select("id, status, departure_time, arrival_time, updated_at") \
            .eq("id", flight_id) \
            .single() \
            .execute()
            
        if hasattr(initial_response, "error") and initial_response.error:
            yield f"data: {json.dumps({'error': f'Flight with ID {flight_id} not found'})}\n\n"
            return
        
        # Send initial status
        flight_status = initial_response.data
        yield f"data: {json.dumps(flight_status)}\n\n"
        
        # Keep connection alive and check for updates periodically
        last_update = flight_status.get("updated_at")
        while True:
            # Wait before checking for updates
            await asyncio.sleep(10)
            
            # Check for status updates
            update_response = supabase.table("flights") \
                .select("id, status, departure_time, arrival_time, updated_at") \
                .eq("id", flight_id) \
                .single() \
                .execute()
                
            if not hasattr(update_response, "error"):
                updated_status = update_response.data
                if updated_status.get("updated_at") != last_update:
                    # Send updated status
                    yield f"data: {json.dumps(updated_status)}\n\n"
                    last_update = updated_status.get("updated_at")
            
    except asyncio.CancelledError:
        # Client disconnected
        pass


@router.get("/{flight_id}/status")
async def get_flight_status_updates(flight_id: str, request: Request):
    """
    Stream real-time flight status updates using Server-Sent Events (SSE)
    """
    event_generator = flight_status_event_generator(flight_id)
    return EventSourceResponse(event_generator)
