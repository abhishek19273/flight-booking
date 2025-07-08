from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentDetailResponse
from app.services.auth import get_current_user
from app.database.init_db import get_supabase_client

router = APIRouter()


@router.post("", response_model=PaymentResponse)
async def process_payment(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    """
    Process a payment for a booking
    """
    supabase = get_supabase_client()
    
    # Verify the booking belongs to the user
    booking_response = supabase.table("bookings") \
        .select("id") \
        .eq("id", payment_data.booking_id) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if hasattr(booking_response, "error") or len(booking_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or does not belong to you"
        )
    
    # In a real system, we would integrate with a payment processor here
    # For now, we'll simulate a successful payment
    
    # Create payment record
    payment = {
        "booking_id": payment_data.booking_id,
        "amount": payment_data.amount,
        "currency": payment_data.currency,
        "status": "completed",  # In a real system, this would initially be "pending"
        "payment_method": payment_data.payment_method,
        "payment_details": payment_data.payment_details  # In production, sensitive data should be encrypted
    }
    
    # Insert payment into database
    payment_response = supabase.table("payments").insert(payment).execute()
    
    if hasattr(payment_response, "error") and payment_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process payment: {payment_response.error}"
        )
    
    # In a real system, we would update the booking status after payment confirmation
    supabase.table("bookings") \
        .update({"status": "confirmed"}) \
        .eq("id", payment_data.booking_id) \
        .execute()
    
    return payment_response.data[0]


@router.get("/{payment_id}", response_model=PaymentDetailResponse)
async def get_payment(payment_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get payment details by ID
    """
    supabase = get_supabase_client()
    
    # Get payment with booking check
    payment_response = supabase.table("payments") \
        .select("payments.*, bookings!inner(user_id)") \
        .eq("payments.id", payment_id) \
        .eq("bookings.user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if hasattr(payment_response, "error") or not payment_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found or not authorized to view"
        )
    
    # For security, mask payment details in the response
    payment = payment_response.data
    if "payment_details" in payment and "card_number" in payment["payment_details"]:
        card_number = payment["payment_details"]["card_number"]
        payment["payment_details"]["card_number"] = f"****-****-****-{card_number[-4:]}"
    
    return payment
