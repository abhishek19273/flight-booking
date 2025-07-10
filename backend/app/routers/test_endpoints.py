"""
Test endpoints for authentication testing.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.middleware.auth import get_current_user, get_admin_user, security

router = APIRouter()


@router.get("/users/me")
async def get_current_user_endpoint(user=Depends(get_current_user)):
    """
    Test endpoint that requires authentication.
    Returns the current user's information.
    """
    return user


@router.get("/admin/users")
async def get_admin_users(credentials: HTTPAuthorizationCredentials = Depends(security), supabase_client=None):
    """
    Test endpoint that requires admin authentication.
    Returns a list of users (for testing purposes only).
    """
    # Use the get_admin_user dependency with the injected Supabase client
    admin = await get_admin_user(credentials, supabase_client=supabase_client)
    return {"message": "Admin access granted", "users": [{"id": "1", "email": "test@example.com"}]}
