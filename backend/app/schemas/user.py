from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    preferences: Optional[Dict] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime
    user_metadata: Optional[Dict[str, Any]] = None


class UserProfileResponse(UserResponse):
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    preferences: Optional[Dict] = None
    updated_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
