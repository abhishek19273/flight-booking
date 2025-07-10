from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse, BookingDetailResponse
from app.services.auth import get_current_user
from app.services.email import EmailNotificationService
from app.services.booking import (
    create_booking, get_booking_details_by_id, generate_booking_reference, get_all_booking_details_for_user
)
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


@router.get("", response_model=List[BookingDetailResponse])
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    """
    Get all detailed bookings for the authenticated user.
    """
    try:
        bookings = await get_all_booking_details_for_user(current_user["id"])
        return bookings
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve bookings: {str(e)}"
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


@router.put("/{booking_id}", response_model=BookingDetailResponse)
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
    
    # Separate passenger updates from booking status updates
    update_payload = booking_update.dict(exclude_unset=True)
    passenger_updates = update_payload.pop('passengers', None)

    # Update passenger details if provided
    if passenger_updates:
        for p_update in passenger_updates:
            p_id = p_update.pop('id')
            passenger_update_response = supabase.table('passengers') \
                .update(p_update) \
                .eq('id', p_id) \
                .eq('booking_id', booking_id) \
                .execute()
            if hasattr(passenger_update_response, 'error') and passenger_update_response.error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to update passenger {p_id}: {passenger_update_response.error}"
                )

    # Update booking status if provided
    if update_payload:
        update_response = supabase.table("bookings") \
            .update(update_payload) \
            .eq("id", booking_id) \
            .execute()
        if hasattr(update_response, "error") and update_response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update booking status: {update_response.error}"
            )
    
    # Fetch the final, updated booking details to return
    updated_booking = await get_booking_details_by_id(booking_id)
    

    
    # Send email notification about the update
    user_email = current_user.get('email')
    if user_email:
        update_type = 'modified'
        if 'status' in update_payload and update_payload['status'] == 'cancelled':
            update_type = 'cancelled'
        
        await EmailNotificationService.send_booking_update(
            email_to=user_email,
            booking_details=updated_booking,
            update_type=update_type
        )

    return updated_booking


@router.put("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """
    Cancel a booking.

    This endpoint marks a booking as 'cancelled'. It checks for ownership
    and prevents cancelling an already cancelled booking.
    """
    supabase = get_supabase_client()

    # 1. Check if booking exists, belongs to the user, and get its current status.
    check_response = supabase.table("bookings") \
        .select("id, status") \
        .eq("id", booking_id) \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()

    if hasattr(check_response, "error") or not check_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found or does not belong to you"
        )

    # 2. Check if the booking is already cancelled.
    if check_response.data.get("status") == 'cancelled':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled."
        )

    # 3. Update the booking status to 'cancelled'.
    update_response = supabase.table("bookings") \
        .update({"status": "cancelled"}) \
        .eq("id", booking_id) \
        .execute()

    if hasattr(update_response, "error") and update_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel booking: {update_response.error.message}"
        )

    if not update_response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve booking details after cancellation."
        )

    # 4. Send email notification about booking cancellation
    try:
        booking_details = await get_booking_details_by_id(booking_id)
        user_email = current_user.get('email')
        if user_email:
            await EmailNotificationService.send_booking_update(
                email_to=user_email,
                booking_details=booking_details,
                update_type='cancelled'
            )
    except Exception as e:
        # Log the error but don't fail the request if email fails
        print(f"Failed to send cancellation email for booking {booking_id}: {e}")

    # 5. Return the updated booking object.
    return update_response.data[0]


@router.get("/reference/generate", response_model=Dict[str, str])
async def generate_booking_ref(current_user: dict = Depends(get_current_user)):
    """
    Generate a unique booking reference
    """
    booking_ref = generate_booking_reference()
    return {"booking_reference": booking_ref}
