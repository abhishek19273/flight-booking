import uuid
import logging
from typing import Dict, Any, List
from app.database.init_db import get_supabase_client
from app.services.email import EmailNotificationService
from fastapi import HTTPException, status

# Configure logger
logger = logging.getLogger(__name__)

def generate_booking_reference() -> str:
    """
    Generate a unique booking reference code
    Format: SBJ-XXXXXX (where X is alphanumeric)
    """
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"SBJ-{unique_id}"

async def create_booking(user_id: str, booking_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new booking with flight associations and passengers
    """
    supabase = get_supabase_client()
    
    # Generate booking reference
    booking_reference = generate_booking_reference()
    
    # Create booking record
    booking = {
        "user_id": user_id,
        "booking_reference": booking_reference,
        "trip_type": booking_data["trip_type"],
        "total_amount": booking_data["total_amount"],
        "status": "confirmed"
    }
    
    # Insert booking into database
    booking_response = supabase.table("bookings").insert(booking).execute()
    
    if hasattr(booking_response, "error") and booking_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {booking_response.error}"
        )
    
    booking_id = booking_response.data[0]["id"]
    
    # Create booking-flight relationships
    booking_flights = []
    for flight_item in booking_data["flights"]:
        booking_flights.append({
            "booking_id": booking_id,
            "flight_id": flight_item["flight_id"],
            "is_return_flight": flight_item["is_return_flight"]
        })
    
    if booking_flights:
        flight_response = supabase.table("booking_flights").insert(booking_flights).execute()
        
        if hasattr(flight_response, "error") and flight_response.error:
            # Rollback booking if flight association fails
            supabase.table("bookings").delete().eq("id", booking_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to associate flights with booking: {flight_response.error}"
            )
    
    # Create passengers
    passengers = []
    for passenger in booking_data["passengers"]:
        passengers.append({
            "booking_id": booking_id,
            "type": passenger["type"],
            "first_name": passenger["first_name"],
            "last_name": passenger["last_name"],
            "date_of_birth": passenger["date_of_birth"],
            "passport_number": passenger.get("passport_number"),
            "nationality": passenger.get("nationality"),
            "cabin_class": passenger["cabin_class"]
        })
    
    if passengers:
        passenger_response = supabase.table("passengers").insert(passengers).execute()
        
        if hasattr(passenger_response, "error") and passenger_response.error:
            # Rollback booking and flights if passenger creation fails
            supabase.table("booking_flights").delete().eq("booking_id", booking_id).execute()
            supabase.table("bookings").delete().eq("id", booking_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create passengers: {passenger_response.error}"
            )
    
    # Get complete booking details, ensuring it matches the user who created it
    booking_details = await get_booking_details_by_id(booking_id, user_id=user_id)
    
    # Send confirmation email
    try:
        user_email_response = supabase.table("profiles").select("email").eq("user_id", user_id).execute()
        if user_email_response.data:
            user_email = user_email_response.data[0].get("email")
            if user_email:
                await EmailNotificationService.send_booking_confirmation(
                    email_to=[user_email],  # Pass email as a list
                    booking_details=booking_details
                )
            else:
                logger.warning(f"Email field is empty in profile for user_id: {user_id}")
        else:
            logger.warning(f"No profile found for user_id: {user_id}. Cannot send confirmation email.")
    except Exception as e:
        logger.error(f"An error occurred while fetching user email or sending confirmation for user_id {user_id}: {e}", exc_info=True)
    
    return booking_details

async def get_all_booking_details_for_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all booking details for a specific user, including flights and passengers.
    """
    supabase = get_supabase_client()

    # 1. Get all booking IDs for the user
    bookings_response = supabase.table("bookings").select("id").eq("user_id", user_id).order("created_at", desc=True).execute()
    if hasattr(bookings_response, "error") and bookings_response.error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to retrieve bookings: {bookings_response.error}")

    user_bookings = bookings_response.data
    if not user_bookings:
        return []

    # 2. Fetch detailed information for each booking
    detailed_bookings = []
    for b in user_bookings:
        try:
            # Pass user_id to ensure we only fetch details for the user's own bookings
            booking_details = await get_booking_details_by_id(b['id'], user_id=user_id)
            detailed_bookings.append(booking_details)
        except HTTPException:
            # If a single booking fails, we can choose to skip it or log it.
            # For now, we'll skip it to not fail the entire request.
            continue
            
    return detailed_bookings


async def get_booking_details_by_id(booking_id: str, user_id: str = None) -> Dict[str, Any]:
    """
    Get detailed information about a specific booking including flights and passengers.
    If user_id is provided, it also ensures the booking belongs to that user.
    """
    supabase = get_supabase_client()
    
    # Base query for getting a booking
    query = supabase.table("bookings").select("*").eq("id", booking_id)

    # If a user_id is provided, add it to the query to enforce ownership
    if user_id:
        query = query.eq("user_id", user_id)

    booking_response = query.single().execute()
    
    if hasattr(booking_response, "error") and booking_response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found"
        )
    
    booking = booking_response.data
    
    # Get booking flights with details
    flights_response = supabase.table("booking_flights") \
        .select("*, flight:flights(*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*))") \
        .eq("booking_id", booking_id) \
        .execute()
    
    # Get passengers
    passengers_response = supabase.table("passengers") \
        .select("*") \
        .eq("booking_id", booking_id) \
        .execute()
    
    # Combine all data
    booking["flights"] = flights_response.data if not hasattr(flights_response, "error") else []
    booking["passengers"] = passengers_response.data if not hasattr(passengers_response, "error") else []
    
    return booking
