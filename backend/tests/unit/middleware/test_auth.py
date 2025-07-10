"""
Unit tests for the authentication middleware.
"""
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
import jwt

from app.middleware.auth import get_current_user, get_admin_user


class TestAuthMiddleware:
    """Test cases for authentication middleware."""

    async def test_get_current_user_valid_token(self, mock_jwt_decode, valid_jwt_payload):
        """Test that a valid token returns the correct user data."""
        # Arrange
        mock_jwt_decode.return_value = valid_jwt_payload
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.token.here")
        
        # Act
        user = await get_current_user(credentials)
        
        # Assert
        assert user["id"] == valid_jwt_payload["sub"]
        assert user["email"] == valid_jwt_payload["email"]
        mock_jwt_decode.assert_called_once()

    async def test_get_current_user_invalid_token(self, mock_jwt_decode):
        """Test that an invalid token raises an HTTPException."""
        # Arrange
        mock_jwt_decode.side_effect = jwt.PyJWTError("Invalid token")
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.here")
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials)
        
        assert exc_info.value.status_code == 401
        assert "Invalid authentication token" in exc_info.value.detail

    async def test_get_current_user_missing_sub(self, mock_jwt_decode):
        """Test that a token without a subject raises an HTTPException."""
        # Arrange
        mock_jwt_decode.return_value = {"email": "test@example.com"}  # No 'sub' field
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="incomplete.token.here")
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials)
        
        assert exc_info.value.status_code == 401
        assert "Invalid authentication credentials" in exc_info.value.detail

    async def test_get_admin_user_valid_admin(self, mock_jwt_decode, admin_jwt_payload, mock_admin_user):
        """Test that an admin user can access admin resources."""
        # Arrange
        mock_jwt_decode.return_value = admin_jwt_payload
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.admin.token")
        
        # Act
        user = await get_admin_user(credentials, supabase_client=mock_admin_user)
        
        # Assert
        assert user["id"] == admin_jwt_payload["sub"]
        assert user["email"] == admin_jwt_payload["email"]

    async def test_get_admin_user_non_admin(self, mock_jwt_decode, valid_jwt_payload, mock_supabase):
        """Test that a non-admin user cannot access admin resources."""
        # Arrange
        mock_jwt_decode.return_value = valid_jwt_payload
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.non_admin.token")
        
        # Mock the Supabase response for a non-admin user
        table_mock = mock_supabase.table.return_value
        select_mock = table_mock.select.return_value
        eq_mock = select_mock.eq.return_value
        execute_mock = eq_mock.execute.return_value
        
        # Set the mock response data for a regular user
        execute_mock.data = [{"role": "user"}]
        execute_mock.error = None
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_admin_user(credentials, supabase_client=mock_supabase)
        
        assert exc_info.value.status_code == 403
        assert "Not authorized" in exc_info.value.detail
