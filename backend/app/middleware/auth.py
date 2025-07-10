from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from app.services.supabase_client import get_supabase_client

# JWT security scheme
security = HTTPBearer()

# JWT secret from Supabase
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("Missing SUPABASE_JWT_SECRET. Please check your .env file.")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the JWT token and returns the user
    """
    token = credentials.credentials
    
    try:
        # Verify the token
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=["HS256"],
            options={"verify_signature": True}
        )
        
        # Extract user info from token
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Return the user ID from the token
        return {"id": user_id, "email": payload.get("email")}
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the JWT token and ensures the user has admin role
    """
    user = await get_current_user(credentials)
    
    # Get user data from Supabase to check role
    supabase = get_supabase_client()
    response = supabase.table("users").select("role").eq("id", user["id"]).execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    
    if not response.data or response.data[0].get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    
    return user
