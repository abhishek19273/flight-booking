import uuid
import logging
from typing import Dict, Any, List, Tuple
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


async def validate_flight_availability(flight_items: List[Dict[str, Any]]) -> Tuple[bool, str, List[Dict[str, Any]]]:
    """
    Validate seat availability for all flights in a booking (both outbound and return)
    
    Args:
        flight_items: List of flight items with flight_id, cabin_class, num_passengers, and is_return_flight
        
    Returns:
        Tuple containing:
        - Boolean indicating if all flights have available seats
        - Error message if any flight doesn't have enough seats
        - List of flights that need to be updated if all validations pass
    """
    supabase = get_supabase_client()
    flights_to_update = []
    
    for flight_item in flight_items:
        flight_id = flight_item["flight_id"]
        cabin_class = flight_item["cabin_class"]
        num_passengers = flight_item["num_passengers"]
        is_return = flight_item.get("is_return_flight", False)
        
        # Determine which seat availability field to check based on cabin class
        availability_field = f"{cabin_class.replace('-', '_')}_available"
        
        # Get current flight details
        flight_response = supabase.table("flights").select(f"id, {availability_field}, flight_number").eq("id", flight_id).single().execute()
        
        if hasattr(flight_response, "error") or not flight_response.data:
            return False, f"Flight with ID {flight_id} not found", []
        
        flight = flight_response.data
        available_seats = flight.get(availability_field, 0)
        
        # Check if enough seats are available
        if available_seats < num_passengers:
            flight_type = "return" if is_return else "outbound"
            return False, f"Not enough {cabin_class} seats available for {flight_type} flight {flight['flight_number']}. Available: {available_seats}, Requested: {num_passengers}", []
        
        # Add to list of flights to update
        flights_to_update.append({
            "flight_id": flight_id,
            "cabin_class": cabin_class,
            "num_passengers": num_passengers,
            "is_return": is_return,
            "available_seats": available_seats
        })
    
    return True, "", flights_to_update


async def update_seat_availability(flights_to_update: List[Dict[str, Any]], deduct: bool = True) -> List[Dict[str, Any]]:
    """
    Update seat availability for multiple flights
    
    Args:
        flights_to_update: List of flight details with flight_id, cabin_class, num_passengers, etc.
        deduct: If True, deduct seats; if False, add seats back (for rollback)
        
    Returns:
        List of updated flights with their new availability counts
    """
    supabase = get_supabase_client()
    updated_flights = []
    
    for flight in flights_to_update:
        flight_id = flight["flight_id"]
        cabin_class = flight["cabin_class"]
        num_passengers = flight["num_passengers"]
        
        # Determine which seat availability field to update
        availability_field = f"{cabin_class.replace('-', '_')}_available"
        
        # Calculate new seat count
        current_seats = flight["available_seats"]
        new_seats = current_seats - num_passengers if deduct else current_seats + num_passengers
        
        # Ensure we don't go below zero or above capacity
        new_seats = max(0, new_seats)
        
        # Update the flight
        update_data = {availability_field: new_seats}
        update_response = supabase.table("flights").update(update_data).eq("id", flight_id).execute()
        
        if hasattr(update_response, "error") or not update_response.data:
            logger.error(f"Failed to update seat availability for flight {flight_id}: {getattr(update_response, 'error', 'Unknown error')}")
            continue
        
        # Add to list of updated flights
        updated_flight = flight.copy()
        updated_flight["new_available_seats"] = new_seats
        updated_flights.append(updated_flight)
        
        action = "Deducted" if deduct else "Restored"
        logger.info(f"{action} {num_passengers} {cabin_class} seats for flight {flight_id}. New availability: {new_seats}")
    
    return updated_flights


async def rollback_seat_deductions(flights_updated: List[Dict[str, Any]]):
    """
    Rollback seat deductions in case of booking failure
    
    Args:
        flights_updated: List of flights that had seats deducted
    """
    if not flights_updated:
        return
        
    try:
        await update_seat_availability(flights_updated, deduct=False)
        logger.info(f"Successfully rolled back seat deductions for {len(flights_updated)} flights")
    except Exception as e:
        logger.error(f"Failed to rollback seat deductions: {e}", exc_info=True)

async def create_booking(user_id: str, booking_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new booking with flight associations and passengers
    """
    supabase = get_supabase_client()
    updated_flights = []
    
    try:
        # Validate trip type and prepare flight items for validation
        trip_type = booking_data.get("trip_type")
        flight_items = booking_data.get("flights", [])
        
        if trip_type == "one-way" and len(flight_items) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One-way bookings must have exactly one flight"
            )
        
        if trip_type == "round-trip" and len(flight_items) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Round-trip bookings must have exactly two flights"
            )
        
        # Prepare flight items with passenger count for seat validation
        passenger_count = len(booking_data.get("passengers", []))
        if passenger_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking must have at least one passenger"
            )
            
        # Extract cabin class from passengers (assuming all passengers have the same cabin class)
        cabin_class = None
        if booking_data.get("passengers") and len(booking_data["passengers"]) > 0:
            cabin_class = booking_data["passengers"][0].get("cabin_class")
            if not cabin_class:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cabin class must be specified for at least one passenger"
                )
        
        # Add passenger count and cabin class to each flight item
        for flight_item in flight_items:
            flight_item["num_passengers"] = passenger_count
            flight_item["cabin_class"] = cabin_class
        
        # Validate seat availability for all flights
        is_valid, error_message, flights_to_update = await validate_flight_availability(flight_items)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Update seat availability for all flights
        updated_flights = await update_seat_availability(flights_to_update)
        
        # Generate booking reference
        booking_reference = generate_booking_reference()
        
        # Create booking record
        booking = {
            "user_id": user_id,
            "booking_reference": booking_reference,
            "trip_type": trip_type,
            "total_amount": booking_data["total_amount"],
            "status": "confirmed"
        }
        
        # Insert booking into database
        booking_response = supabase.table("bookings").insert(booking).execute()
        
        if hasattr(booking_response, "error") and booking_response.error:
            # Rollback seat deductions if booking creation fails
            await rollback_seat_deductions(updated_flights)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create booking: {booking_response.error}"
            )
        
        booking_id = booking_response.data[0]["id"]
        
        # Create booking-flight relationships
        booking_flights = []
        for flight_item in flight_items:
            booking_flights.append({
                "booking_id": booking_id,
                "flight_id": flight_item["flight_id"],
                "is_return_flight": flight_item.get("is_return_flight", False)
            })
        
        if booking_flights:
            flight_response = supabase.table("booking_flights").insert(booking_flights).execute()
            
            if hasattr(flight_response, "error") and flight_response.error:
                # Rollback booking and seat deductions if flight association fails
                supabase.table("bookings").delete().eq("id", booking_id).execute()
                await rollback_seat_deductions(updated_flights)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to associate flights with booking: {flight_response.error}"
                )
        
        # Create passengers
        passengers = []
        for passenger in booking_data.get("passengers", []):
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
                # Rollback booking, flights, and seat deductions if passenger creation fails
                supabase.table("booking_flights").delete().eq("booking_id", booking_id).execute()
                supabase.table("bookings").delete().eq("id", booking_id).execute()
                await rollback_seat_deductions(updated_flights)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create passengers: {passenger_response.error}"
                )
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Rollback seat deductions for any other exceptions
        await rollback_seat_deductions(updated_flights)
        logger.error(f"Unexpected error during booking creation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
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
