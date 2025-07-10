import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from app.database.init_db import get_supabase_client
import logging


logger = logging.getLogger("auth")

# Load environment variables
load_dotenv()

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "expires_at": int(expire.timestamp())
    }


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate the access token using Supabase and return the current user.
    This is the correct way to validate a Supabase JWT from a secure backend.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    supabase = get_supabase_client()
    try:
        logger.info("Attempting to validate token with Supabase...")
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            logger.error("Token is invalid or expired.")
            raise credentials_exception
            
        logger.info(f"Token validated successfully. User ID: {user_response.user.id}")
        # Return the user object as a dictionary
        return user_response.user.model_dump()

    except Exception as e:
        logger.error(f"An unexpected error occurred during token validation: {e}")
        raise credentials_exception
