from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.schemas.booking import BookingResponse
from app.services.auth import get_current_user
from app.database.init_db import get_supabase_client

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the profile of the currently authenticated user
    """
    supabase = get_supabase_client()
    
    # Get user profile from database
    profile_response = supabase.table("user_profiles") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .single() \
        .execute()
    
    if hasattr(profile_response, "error") and profile_response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Combine auth user data with profile data
    profile_data = profile_response.data
    user_data = {
        "id": current_user["id"],
        "email": current_user["email"],
        "first_name": current_user["user_metadata"].get("first_name") or profile_data.get("first_name"),
        "last_name": current_user["user_metadata"].get("last_name") or profile_data.get("last_name"),
        "phone_number": current_user["user_metadata"].get("phone_number") or profile_data.get("phone_number"),
        "created_at": current_user["created_at"],
        "address": profile_data.get("address"),
        "city": profile_data.get("city"),
        "country": profile_data.get("country"),
        "zip_code": profile_data.get("zip_code"),
        "preferences": profile_data.get("preferences"),
        "updated_at": profile_data.get("updated_at")
    }
    
    return user_data


@router.put("/me", response_model=UserProfileResponse)
async def update_user_profile(profile_data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update the profile of the currently authenticated user
    """
    supabase = get_supabase_client()
    
    # Update user profile in database
    profile_update = profile_data.dict(exclude_unset=True)
    profile_response = supabase.table("user_profiles") \
        .update(profile_update) \
        .eq("user_id", current_user["id"]) \
        .execute()
    
    if hasattr(profile_response, "error") and profile_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {profile_response.error}"
        )
    
    # Update user metadata in Supabase Auth
    user_metadata_update = {}
    if profile_data.first_name:
        user_metadata_update["first_name"] = profile_data.first_name
    if profile_data.last_name:
        user_metadata_update["last_name"] = profile_data.last_name
    if profile_data.phone_number:
        user_metadata_update["phone_number"] = profile_data.phone_number
    
    if user_metadata_update:
        supabase.auth.api.update_user(
            current_user["id"], 
            {"user_metadata": {**current_user["user_metadata"], **user_metadata_update}}
        )
    
    # Return updated profile
    return await get_current_user_profile(current_user)


@router.get("/me/bookings", response_model=List[BookingResponse])
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    """
    Get all bookings for the currently authenticated user
    """
    supabase = get_supabase_client()
    
    # Get user bookings from database
    bookings_response = supabase.table("bookings") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .order("created_at", desc=True) \
        .execute()
    
    if hasattr(bookings_response, "error") and bookings_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve bookings: {bookings_response.error}"
        )
    
    return bookings_response.data
