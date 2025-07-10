# Supabase Auth Implementation Guide - Backend

This guide provides detailed instructions for implementing Supabase Auth integration with your FastAPI backend for the Sky-Bound Journeys application.

## 1. Project Setup

### Install Required Dependencies

```bash
pip install fastapi "uvicorn[standard]" python-dotenv gotrue python-jose
```

### Configure Environment Variables

Create a `.env` file in the root of your backend project:

```
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_JWT_SECRET=YOUR_SUPABASE_JWT_SECRET
```

## 2. Create Supabase Client Module

Create a file `app/services/supabase_client.py`:

```python
import os
from gotrue import SyncGoTrueClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

# Initialize Supabase client
def get_gotrue_client():
    """
    Returns a GoTrue client for Supabase authentication
    """
    return SyncGoTrueClient(url=supabase_url, headers={"apikey": supabase_key})
```

## 3. Implement JWT Validation

Create a file `app/services/auth.py`:

```python
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from gotrue.errors import AuthApiError
from .supabase_client import get_gotrue_client

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to get the current user from the JWT token
    """
    token = credentials.credentials
    
    try:
        # Validate the token and get user data
        gotrue_client = get_gotrue_client()
        user = gotrue_client.get_user(token)
        return user
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}"
        )

async def get_admin_user(user = Depends(get_current_user)):
    """
    Dependency to check if the user has admin role
    """
    # Check if the user has admin role in user metadata
    user_metadata = getattr(user, "user_metadata", {}) or {}
    role = user_metadata.get("role")
    
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    return user
```

## 4. Configure CORS for Frontend Communication

Update your `main.py` file:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Sky-Bound Journeys API")

# Configure CORS
origins = [
    "http://localhost:3000",  # React development server
    "https://your-production-frontend-domain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.routers import auth, flights, bookings, users, airports

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(flights.router, prefix="/api/flights", tags=["Flights"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(airports.router, prefix="/api/airports", tags=["Airports"])

@app.get("/")
async def root():
    return {"message": "Welcome to Sky-Bound Journeys API"}
```

## 5. Update Auth Router

Update `app/routers/auth.py`:

```python
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserResponse, TokenResponse, LoginRequest, RefreshTokenRequest
from app.services.auth import get_current_user
from app.services.supabase_client import get_gotrue_client
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
        
        user = auth_response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed: user not created in Supabase."
            )
        
        # Return user data
        return {
            "id": user.id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "phone_number": user_data.phone_number,
            "created_at": user.created_at
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {e}"
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
        
        session = auth_response.session
        user = auth_response.user
        
        if not session or not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Return tokens
        return {
            "access_token": session.access_token,
            "token_type": "bearer",
            "expires_in": session.expires_in,
            "refresh_token": session.refresh_token
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {e}"
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request_data: RefreshTokenRequest):
    """
    Refresh an access token using a refresh token
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Refresh the session
        refresh_response = gotrue_client.refresh_session(request_data.refresh_token)
        
        session = refresh_response.session
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Return new tokens
        return {
            "access_token": session.access_token,
            "token_type": "bearer",
            "expires_in": session.expires_in,
            "refresh_token": session.refresh_token
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired refresh token: {e}"
        )

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """
    Get the current authenticated user's profile
    """
    user_meta = getattr(current_user, "user_metadata", {}) or {}
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "first_name": user_meta.get("first_name"),
        "last_name": user_meta.get("last_name"),
        "phone_number": user_meta.get("phone_number")
    }

@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """
    Logout a user by invalidating their session
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Sign out the user
        gotrue_client.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {e}"
        )
```

## 6. Update User Schemas

Create or update `app/schemas/user.py`:

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    created_at: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
```

## 7. Example Protected Route

Update `app/routers/bookings.py` to include authentication:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.services.auth import get_current_user
from app.database.init_db import get_supabase_client

router = APIRouter()

@router.post("/", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, current_user = Depends(get_current_user)):
    """
    Create a new booking (requires authentication)
    """
    supabase = get_supabase_client()
    
    # Add the user_id to the booking data
    booking_dict = booking_data.dict()
    booking_dict["user_id"] = current_user.id
    
    # Create the booking in the database
    response = supabase.table("bookings").insert(booking_dict).execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {response.error}"
        )
    
    return response.data[0]

@router.get("/", response_model=list[BookingResponse])
async def get_user_bookings(current_user = Depends(get_current_user)):
    """
    Get all bookings for the authenticated user
    """
    supabase = get_supabase_client()
    
    # Query bookings for the current user
    response = supabase.table("bookings") \
        .select("*") \
        .eq("user_id", current_user.id) \
        .execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bookings: {response.error}"
        )
    
    return response.data
```

## 8. Google OAuth Integration

Update your Supabase project settings:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your OAuth credentials (Client ID and Secret)
5. Configure redirect URLs

Then update your auth router to handle Google OAuth:

```python
@router.get("/google")
async def google_login():
    """
    Generate a URL for Google OAuth login
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Generate OAuth URL
        oauth_response = gotrue_client.sign_in_with_oauth({
            "provider": "google",
            "options": {
                "redirect_to": "http://localhost:3000/auth/callback"
            }
        })
        
        # Return the URL for the frontend to redirect to
        return {"url": oauth_response.url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Google OAuth URL: {e}"
        )
```

## 9. Password Reset Flow

Add these endpoints to your auth router:

```python
@router.post("/request-password-reset")
async def request_password_reset(email_data: dict):
    """
    Request a password reset email
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Send password reset email
        gotrue_client.reset_password_for_email(email_data["email"])
        return {"message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send password reset email: {e}"
        )

@router.post("/reset-password")
async def reset_password(reset_data: dict):
    """
    Reset password with token
    """
    gotrue_client = get_gotrue_client()
    
    try:
        # Update user password
        gotrue_client.verify_otp({
            "email": reset_data["email"],
            "token": reset_data["token"],
            "type": "recovery",
            "new_password": reset_data["new_password"]
        })
        
        return {"message": "Password reset successful"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reset password: {e}"
        )
```

This implementation guide provides a comprehensive approach to integrating Supabase Auth in your FastAPI backend, following the architecture described in your requirements.

## 10. Testing Your Implementation

To test your Supabase Auth implementation:

1. Start your FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

2. Use the Swagger UI at `http://localhost:8000/docs` to test your auth endpoints
3. Test protected routes with and without valid JWT tokens
4. Verify that the Google OAuth flow works correctly
5. Test the password reset functionality

Remember to configure your Supabase project's Row Level Security (RLS) policies to secure your data properly.

## 11. Swagger Documentation

Update your `main.py` to include detailed OpenAPI documentation:

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI()

# ... other code ...

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Sky-Bound Journeys API",
        version="1.0.0",
        description="API for Sky-Bound Journeys flight booking system",
        routes=app.routes,
    )
    
    # Add security scheme for JWT
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Apply security to all operations
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```
