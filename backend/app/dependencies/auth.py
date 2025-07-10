from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.middleware.auth import get_current_user, get_admin_user

security = HTTPBearer()

def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to require authentication for routes
    """
    return get_current_user(credentials)

def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to require admin role for routes
    """
    return get_admin_user(credentials)
