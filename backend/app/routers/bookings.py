from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse, BookingDetailResponse
from app.services.auth import get_current_user
from app.services.email import EmailNotificationService
from app.services.booking import create_booking, get_booking_details_by_id, generate_booking_reference
from app.database.init_db import get_supabase_client

router = APIRouter()


@router.post("", response_model=BookingDetailResponse)
async def create_new_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    """
    Create a new booking for the authenticated user
    """
    # Convert Pydantic model to dictionary
    booking_dict = booking_data.dict()
    
    # Create booking using the service
    try:
        booking_details = await create_booking(current_user["id"], booking_dict)
        return booking_details
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {str(e)}"
        )


@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get detailed information about a specific booking
    """
    supabase = get_supabase_client()
    
    # Check if booking exists and belongs to the user
    booking_response = supabase.table("bookings") \
        .select("id") \
        .eq("id", booking_id) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if hasattr(booking_response, "error") or len(booking_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found or does not belong to you"
        )
    
    # Get booking details using the service
    try:
        booking_details = await get_booking_details_by_id(booking_id)
        return booking_details
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve booking: {str(e)}"
        )


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: str, booking_update: BookingUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update a booking (e.g., change status to cancelled)
    """
    supabase = get_supabase_client()
    
    # Check if booking exists and belongs to the user
    check_response = supabase.table("bookings") \
        .select("id") \
        .eq("id", booking_id) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if hasattr(check_response, "error") or len(check_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found or does not belong to you"
        )
    
    # Update booking
    update_data = booking_update.dict(exclude_unset=True)
    update_response = supabase.table("bookings") \
        .update(update_data) \
        .eq("id", booking_id) \
        .execute()
    
    if hasattr(update_response, "error") and update_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update booking: {update_response.error}"
        )
    
    # Get updated booking with details for email
    if 'status' in update_data:
        booking_details = await get_booking(booking_id, current_user)
        
        # Send email notification about booking update
        user_email = current_user.get('email')
        if user_email:
            update_type = 'cancelled' if update_data['status'] == 'cancelled' else 'modified'
            await EmailNotificationService.send_booking_update(
                email_to=user_email,
                booking_details=booking_details,
                update_type=update_type
            )
    
    return update_response.data[0]


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """
    Cancel a booking
    """
    supabase = get_supabase_client()
    
    # Check if booking exists and belongs to the user
    check_response = supabase.table("bookings") \
        .select("id, status") \
        .eq("id", booking_id) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if hasattr(check_response, "error") or len(check_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found or does not belong to you"
        )
    
    booking_status = check_response.data[0].get("status")
    if booking_status == "cancelled":
        return {"message": "Booking is already cancelled"}
    
    # Update booking status to cancelled
    update_response = supabase.table("bookings") \
        .update({"status": "cancelled"}) \
        .eq("id", booking_id) \
        .execute()
    
    if hasattr(update_response, "error") and update_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel booking: {update_response.error}"
        )
    
    return {"message": "Booking successfully cancelled"}


@router.get("/reference/generate", response_model=Dict[str, str])
async def generate_booking_ref(current_user: dict = Depends(get_current_user)):
    """
    Generate a unique booking reference
    """
    booking_ref = generate_booking_reference()
    return {"booking_reference": booking_ref}
