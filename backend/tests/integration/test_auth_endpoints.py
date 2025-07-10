"""
Integration tests for the authentication endpoints.
"""
import pytest
from unittest.mock import patch

from fastapi.testclient import TestClient


class TestAuthEndpoints:
    """Test cases for authentication endpoints."""

    def test_protected_endpoint_with_valid_token(self, test_client, mock_jwt_decode, valid_jwt_payload):
        """Test accessing a protected endpoint with a valid token."""
        # Arrange
        mock_jwt_decode.return_value = valid_jwt_payload
        
        # Act
        response = test_client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer valid.token.here"}
        )
        
        # Assert
        assert response.status_code == 200
        assert "id" in response.json()
        assert response.json()["id"] == valid_jwt_payload["sub"]

    def test_protected_endpoint_with_invalid_token(self, test_client):
        """Test accessing a protected endpoint with an invalid token."""
        # Act
        response = test_client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        
        # Assert
        assert response.status_code == 401
        assert "detail" in response.json()
        assert "Invalid authentication token" in response.json()["detail"]

    def test_protected_endpoint_without_token(self, test_client):
        """Test accessing a protected endpoint without a token."""
        # Act
        response = test_client.get("/api/users/me")
        
        # Assert
        # FastAPI's security scheme returns 403 when no token is provided
        assert response.status_code == 403
        assert "detail" in response.json()
        # The error message should indicate authentication is required
        assert "authenticated" in response.json()["detail"].lower() or "authorization" in response.json()["detail"].lower()

    def test_admin_endpoint_with_admin_token(self, test_client, mock_jwt_decode, admin_jwt_payload, mock_admin_user, monkeypatch):
        """Test accessing an admin endpoint with an admin token."""
        # Arrange
        mock_jwt_decode.return_value = admin_jwt_payload
        
        # Monkeypatch the get_supabase_client function to return our mock
        from app.services.supabase_client import get_supabase_client
        monkeypatch.setattr("app.middleware.auth.get_supabase_client", lambda: mock_admin_user)
        
        # Act
        response = test_client.get(
            "/api/admin/users",
            headers={"Authorization": "Bearer valid.admin.token"}
        )
        
        # Assert
        assert response.status_code == 200

    def test_admin_endpoint_with_non_admin_token(self, test_client, mock_jwt_decode, valid_jwt_payload, mock_supabase, monkeypatch):
        """Test accessing an admin endpoint with a non-admin token."""
        # Arrange
        mock_jwt_decode.return_value = valid_jwt_payload
        
        # Mock the Supabase response for a non-admin user
        table_mock = mock_supabase.table.return_value
        select_mock = table_mock.select.return_value
        eq_mock = select_mock.eq.return_value
        execute_mock = eq_mock.execute.return_value
        
        # Set the mock response data for a regular user
        execute_mock.data = [{"role": "user"}]
        execute_mock.error = None
        
        # Monkeypatch the get_supabase_client function to return our mock
        monkeypatch.setattr("app.middleware.auth.get_supabase_client", lambda: mock_supabase)
        
        # Act
        response = test_client.get(
            "/api/admin/users",
            headers={"Authorization": "Bearer valid.non_admin.token"}
        )
        
        # Assert
        assert response.status_code == 403
        assert "detail" in response.json()
        assert "Not authorized" in response.json()["detail"]
