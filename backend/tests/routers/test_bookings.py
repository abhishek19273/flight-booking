import pytest
from unittest.mock import MagicMock, patch
import logging


@patch('app.services.auth.get_supabase_client')
@patch('app.routers.bookings.get_supabase_client')
def test_update_booking_unauthorized(mock_get_supabase_bookings, mock_get_supabase_auth, test_client, mock_jwt_decode, valid_jwt_payload):
    """
    Tests that a user cannot update a booking they do not own.
    """
    # Arrange
    mock_supabase = MagicMock()
    mock_get_supabase_bookings.return_value = mock_supabase
    mock_get_supabase_auth.return_value = mock_supabase

    booking_id = "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    mock_jwt_decode.return_value = valid_jwt_payload

    # Mock the response for the ownership check
    mock_booking_response = MagicMock(data=[], error=None)

    # Configure the mock to return the empty response
    (mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value
     .execute.return_value) = mock_booking_response

    update_payload = {"passengers": [{"id": "p1", "first_name": "Jane-Updated"}]}

    response = test_client.put(
        f"/bookings/{booking_id}",
        json=update_payload,
        headers={"Authorization": "Bearer fake-token"}
    )

    assert response.status_code == 404
    assert response.json() == {"detail": f"Booking with ID {booking_id} not found or does not belong to you"}
