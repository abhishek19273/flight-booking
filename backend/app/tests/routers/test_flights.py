from fastapi.testclient import TestClient
from unittest.mock import patch
import pytest

# A mock user to be returned by the get_current_user dependency
MOCK_USER = {"id": "test-user-id", "email": "test@example.com"}

@pytest.fixture
def mock_get_current_user(monkeypatch):
    """Fixture to mock the get_current_user dependency."""
    def mock_user():
        return MOCK_USER
    monkeypatch.setattr("app.routers.flights.get_current_user", mock_user)
    return mock_user

@patch("app.routers.flights.get_booking_details_by_id")
def test_track_flight_status_success(
    mock_get_booking_details,
    client: TestClient,
    mock_get_current_user: dict
):
    """Test successful flight status tracking for an authenticated user."""
    # Arrange
    booking_id = "test-booking-id"
    mock_get_booking_details.return_value = {
        "id": booking_id,
        "user_id": MOCK_USER["id"],
        "flights": [
            {
                "flight": {
                    "origin": {"name": "JFK"},
                    "destination": {"name": "LAX"},
                    "departure_time": "2025-10-10T10:00:00",
                    "arrival_time": "2025-10-10T13:00:00",
                    "flight_number": "SBJ123"
                }
            }
        ]
    }

    # Act
    response = client.get(f"/flights/track/{booking_id}")

    # Assert
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    stream_content = response.text
    assert "event: flight_status" in stream_content
    assert "data: {" in stream_content
    assert "Scheduled" in stream_content

@patch("app.routers.flights.get_booking_details_by_id")
def test_track_flight_status_unauthorized_access(
    mock_get_booking_details,
    client: TestClient,
    mock_get_current_user: dict
):
    """Test that a user gets a 404 when trying to access a booking that is not theirs."""
    # Arrange
    booking_id = "unauthorized-booking-id"
    mock_get_booking_details.return_value = None

    # Act
    response = client.get(f"/flights/track/{booking_id}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Flight details for this booking could not be found."
    mock_get_booking_details.assert_called_once_with(booking_id, user_id=MOCK_USER["id"])

@patch("app.routers.flights.get_booking_details_by_id")
def test_track_flight_status_booking_not_found(
    mock_get_booking_details,
    client: TestClient,
    mock_get_current_user: dict
):
    """Test tracking a booking that does not exist."""
    # Arrange
    booking_id = "non-existent-booking-id"
    mock_get_booking_details.return_value = None

    # Act
    response = client.get(f"/flights/track/{booking_id}")

    # Assert
    assert response.status_code == 404

@patch("app.routers.flights.get_booking_details_by_id")
def test_track_flight_status_no_flight_details(
    mock_get_booking_details,
    client: TestClient,
    mock_get_current_user: dict
):
    """Test tracking a booking that has no associated flight details."""
    # Arrange
    booking_id = "booking-with-no-flight"
    mock_get_booking_details.return_value = {
        "id": booking_id,
        "user_id": MOCK_USER["id"],
        "flights": [] # No flights in the booking
    }

    # Act
    response = client.get(f"/flights/track/{booking_id}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Flight details for this booking could not be found."
