"""
Test fixtures for the backend tests.
"""
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Add path to import app modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app


@pytest.fixture
def test_client():
    """
    Create a test client for the FastAPI app.
    """
    return TestClient(app)


@pytest.fixture
def mock_supabase():
    """
    Mock the Supabase client for testing.
    """
    with patch("app.services.supabase_client.get_supabase_client") as mock:
        supabase_mock = MagicMock()
        mock.return_value = supabase_mock
        yield supabase_mock


@pytest.fixture
def mock_jwt_decode():
    """
    Mock the JWT decode function for testing authentication.
    """
    with patch("jwt.decode") as mock:
        yield mock


@pytest.fixture
def valid_jwt_payload():
    """
    Return a valid JWT payload for testing.
    """
    return {
        "sub": "test-user-id",
        "email": "test@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "exp": 9999999999  # Far future
    }


@pytest.fixture
def admin_jwt_payload():
    """
    Return a JWT payload for an admin user.
    """
    return {
        "sub": "admin-user-id",
        "email": "admin@example.com",
        "aud": "authenticated",
        "role": "authenticated",
        "exp": 9999999999  # Far future
    }


@pytest.fixture
def mock_admin_user(mock_supabase):
    """
    Mock the Supabase response for an admin user.
    """
    # Create a complete mock chain for Supabase query
    table_mock = MagicMock()
    select_mock = MagicMock()
    eq_mock = MagicMock()
    execute_mock = MagicMock()
    
    mock_supabase.table.return_value = table_mock
    table_mock.select.return_value = select_mock
    select_mock.eq.return_value = eq_mock
    eq_mock.execute.return_value = execute_mock
    
    # Set the mock response data for an admin user
    execute_mock.data = [{"role": "admin"}]
    execute_mock.error = None
    
    # Make sure the execute_mock has the necessary attributes
    execute_mock.count = 1
    
    return mock_supabase
