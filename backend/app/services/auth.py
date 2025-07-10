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
    Validate the access token and return the current user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    supabase = get_supabase_client()
    try:
        # 1. Decode the token to get the user_id (subject).
        logger.info("Attempting to decode JWT...")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.error("JWT decoding failed: 'sub' (user_id) not found in payload.")
            raise credentials_exception
        logger.info(f"JWT decoded successfully. User ID: {user_id}")

        # 2. As an authorized backend, fetch the full user object from Supabase.
        logger.info(f"Attempting to fetch user profile from Supabase for user_id: {user_id}")
        try:
            user_response = supabase.auth.admin.get_user_by_id(user_id)
            if not user_response or not user_response.user:
                logger.error(f"Supabase call succeeded but returned no user for user_id: {user_id}")
                raise credentials_exception
            logger.info(f"Successfully fetched user profile from Supabase for user_id: {user_id}")
            # 3. Return the user object (it's a Pydantic model, so we convert to dict).
            return user_response.user.model_dump()
        except Exception as e:
            logger.error(f"ERROR during Supabase admin call for user_id {user_id}: {e}")
            raise credentials_exception

    except JWTError as e:
        # If decoding fails, the token is invalid.
        logger.error(f"JWTError during token decoding: {e}")
        raise credentials_exception
