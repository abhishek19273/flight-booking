from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.schemas.user import UserCreate, UserResponse, TokenResponse, LoginRequest
from app.services.auth import create_access_token
from app.database.init_db import get_supabase_client

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """
    Register a new user with Supabase Auth
    """
    supabase = get_supabase_client()
    
    # Register the user with Supabase Auth
    auth_response = supabase.auth.sign_up(
        email=user_data.email,
        password=user_data.password,
        options={
            "data": {
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "phone_number": user_data.phone_number
            }
        }
    )
    
    if hasattr(auth_response, "error") and auth_response.error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {auth_response.error.message}"
        )
    
    # Create user profile in the profiles table
    user_id = auth_response.user.id
    profile_data = {
        "user_id": user_id,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone_number": user_data.phone_number
    }
    
    profile_response = supabase.table("user_profiles").insert(profile_data).execute()
    
    if hasattr(profile_response, "error") and profile_response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user profile: {profile_response.error}"
        )
    
    # Return user data
    return {
        "id": auth_response.user.id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone_number": user_data.phone_number,
        "created_at": auth_response.user.created_at
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Login a user with email and password
    """
    supabase = get_supabase_client()
    
    # Authenticate with Supabase
    auth_response = supabase.auth.sign_in(
        email=credentials.email,
        password=credentials.password
    )
    
    if hasattr(auth_response, "error") and auth_response.error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create access token
    user = auth_response.user
    access_token_data = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=60)
    )
    
    # Add refresh token
    access_token_data["refresh_token"] = auth_response.session.refresh_token
    
    return access_token_data


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """
    Refresh an access token using a refresh token
    """
    supabase = get_supabase_client()
    
    # Attempt to refresh the session
    refresh_response = supabase.auth.refresh_session(refresh_token)
    
    if hasattr(refresh_response, "error") and refresh_response.error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Create new access token
    user = refresh_response.user
    access_token_data = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=60)
    )
    
    # Add new refresh token
    access_token_data["refresh_token"] = refresh_response.session.refresh_token
    
    return access_token_data


@router.post("/logout")
async def logout(token: str):
    """
    Logout a user by invalidating their session
    """
    supabase = get_supabase_client()
    
    # Sign out the user
    supabase.auth.api.sign_out(token)
    
    return {"message": "Successfully logged out"}
