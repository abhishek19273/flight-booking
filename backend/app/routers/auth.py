from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.user import UserCreate, UserResponse, TokenResponse, LoginRequest, RefreshTokenRequest
from app.middleware.auth import get_current_user
from app.services.supabase_client import get_supabase_client, get_gotrue_client
from gotrue.errors import AuthApiError

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """
    Register a new user with Supabase Auth
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Register the user with Supabase Auth
        auth_response = gotrue_client.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "phone_number": user_data.phone_number,
                }
            }
        })
        
        # Return user data
        return {
            "id": auth_response.user.id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "phone_number": user_data.phone_number,
            "created_at": auth_response.user.created_at
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Login a user with email and password
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Authenticate with Supabase
        auth_response = gotrue_client.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        # Return tokens directly from Supabase
        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "token_type": "bearer",
            "expires_in": auth_response.session.expires_in
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {str(e)}"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request_data: RefreshTokenRequest):
    """
    Refresh an access token using a refresh token
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Refresh the session with Supabase
        auth_response = gotrue_client.refresh_session(request_data.refresh_token)
        
        # Return the new tokens
        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "token_type": "bearer",
            "expires_in": auth_response.session.expires_in
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to refresh token: {str(e)}"
        )
    refresh_response = supabase.auth.refresh_session(request_data.refresh_token)
    
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


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.
    """
    supabase = get_supabase_client()
    
    # Get user data from Supabase auth.users table
    response = supabase.from_("users").select("*").eq("id", current_user["id"]).execute()
    
    if response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {response.error.message}"
        )
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return response.data[0]


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """
    Logout a user by invalidating their session
    """
    gotrue_client = get_gotrue_client()
    token = credentials.credentials
    
    try:
        gotrue_client.sign_out(token)
        return {"message": "Successfully logged out"}
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )
