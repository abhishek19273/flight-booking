from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from datetime import datetime
from app.schemas.flight import FlightStatusUpdate, FlightDetailResponse
from app.services.auth import get_current_user
from app.services.email import EmailNotificationService
from app.database.init_db import get_supabase_client

router = APIRouter()

# Dictionary to store connected clients for SSE
connected_clients = {}

async def get_flight_with_details(flight_id: str):
    """Get flight details with airline and airport information"""
    supabase = get_supabase_client()
    
    response = supabase.table("flights") \
        .select("*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)") \
        .eq("id", flight_id) \
        .single() \
        .execute()
    
    if hasattr(response, "error") or not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight with ID {flight_id} not found"
        )
    
    return response.data


@router.post("/status/{flight_id}", response_model=FlightDetailResponse)
async def update_flight_status(flight_id: str, status_update: FlightStatusUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update flight status (requires admin privileges)
    
    This endpoint allows administrators to update a flight's status and
    automatically sends email notifications to affected passengers.
    """
    # Check if user has admin privileges
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update flight status"
        )
    
    supabase = get_supabase_client()
    
    # Update flight status
    update_response = supabase.table("flights") \
        .update({"status": status_update.status}) \
        .eq("id", flight_id) \
        .execute()
    
    if hasattr(update_response, "error") or not update_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flight with ID {flight_id} not found or couldn't be updated"
        )
    
    # Get updated flight with details
    flight_details = await get_flight_with_details(flight_id)
    
    # Notify clients subscribed to this flight's SSE stream
    if flight_id in connected_clients:
        for queue in connected_clients[flight_id]:
            await queue.put({
                "flight_id": flight_id,
                "status": status_update.status,
                "timestamp": datetime.utcnow().isoformat()
            })
    
    # Find users who have booked this flight and send them email notifications
    try:
        # Get bookings associated with this flight
        bookings_response = supabase.table("booking_flights") \
            .select("booking:bookings(id, user_id, booking_reference)") \
            .eq("flight_id", flight_id) \
            .execute()
        
        # Get unique users who have booked this flight
        if bookings_response.data:
            user_ids = [booking["booking"]["user_id"] for booking in bookings_response.data if booking.get("booking")]
            
            if user_ids:
                # Get user emails
                users_response = supabase.table("profiles") \
                    .select("user_id, email, first_name, last_name") \
                    .in_("user_id", user_ids) \
                    .execute()
                
                if users_response.data:
                    # Send email to each affected user
                    for user in users_response.data:
                        if user.get("email"):
                            # Add user info to flight details for email template
                            flight_with_user = {**flight_details}
                            flight_with_user["user"] = {
                                "first_name": user.get("first_name", ""),
                                "last_name": user.get("last_name", "")
                            }
                            
                            # Store original times for comparison in email
                            flight_with_user["original_departure_time"] = flight_details.get("departure_time")
                            flight_with_user["original_arrival_time"] = flight_details.get("arrival_time")
                            
                            await EmailNotificationService.send_flight_status_update(
                                email_to=user["email"],
                                flight_details=flight_with_user,
                                status_update=status_update.status
                            )
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Error sending email notifications: {str(e)}")
    
    return flight_details
