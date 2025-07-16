import pytest
from unittest.mock import MagicMock, patch
import uuid
import json
from fastapi import status


@pytest.fixture
def round_trip_booking_payload():
    """Fixture to create a valid round-trip booking payload"""
    outbound_flight_id = str(uuid.uuid4())
    return_flight_id = str(uuid.uuid4())
    
    return {
        "trip_type": "round-trip",
        "cabin_class": "economy",
        "total_amount": 1200.00,
        "flights": [
            {
                "flight_id": outbound_flight_id,
                "is_return_flight": False,
                "price": 600.00
            },
            {
                "flight_id": return_flight_id,
                "is_return_flight": True,
                "price": 600.00
            }
        ],
        "passengers": [
            {
                "type": "adult",
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "1990-01-01",
                "passport_number": "AB123456",
                "nationality": "US"
            },
            {
                "type": "child",
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "2015-01-01"
            }
        ]
    }


@pytest.fixture
def invalid_round_trip_booking_payload(round_trip_booking_payload):
    """Fixture to create an invalid round-trip booking payload (no return flight)"""
    payload = round_trip_booking_payload.copy()
    # Mark both flights as outbound (not return)
    for flight in payload["flights"]:
        flight["is_return_flight"] = False
    return payload


@patch('app.services.booking.validate_flight_availability')
@patch('app.services.booking.update_seat_availability')
@patch('app.services.booking.get_booking_details_by_id')
@patch('app.services.auth.get_supabase_client')
@patch('app.routers.bookings.get_supabase_client')
@patch('app.services.booking.get_supabase_client')
def test_create_round_trip_booking_success(
    mock_booking_supabase, mock_router_supabase, mock_auth_supabase,
    mock_get_booking_details, mock_update_seats, mock_validate_flights,
    test_client, mock_jwt_decode, valid_jwt_payload, round_trip_booking_payload
):
    """Test successful creation of a round-trip booking"""
    # Arrange
    mock_supabase = MagicMock()
    mock_booking_supabase.return_value = mock_supabase
    mock_router_supabase.return_value = mock_supabase
    mock_auth_supabase.return_value = mock_supabase
    
    mock_jwt_decode.return_value = valid_jwt_payload
    
    # Mock validate_flight_availability to return success
    mock_validate_flights.return_value = (True, "", [{"flight_id": "flight-1"}])
    
    # Mock update_seat_availability to return updated flights
    mock_update_seats.return_value = [{"flight_id": "flight-1", "new_available_seats": 8}]
    
    # Mock booking creation response
    booking_id = str(uuid.uuid4())
    mock_booking_response = MagicMock()
    mock_booking_response.data = [{"id": booking_id}]
    mock_booking_response.error = None
    
    # Mock booking flights and passengers responses
    mock_success_response = MagicMock()
    mock_success_response.data = [{"id": "success"}]
    mock_success_response.error = None
    
    # Set up the mock responses for database operations
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = [
        mock_booking_response, mock_success_response, mock_success_response
    ]
    
    # Mock get_booking_details_by_id to return booking details
    mock_booking_details = {
        "id": booking_id,
        "trip_type": "round-trip",
        "flights": [
            {
                "id": "bf-1",
                "flight_id": round_trip_booking_payload["flights"][0]["flight_id"],
                "is_return_flight": False
            },
            {
                "id": "bf-2",
                "flight_id": round_trip_booking_payload["flights"][1]["flight_id"],
                "is_return_flight": True
            }
        ],
        "passengers": [
            {
                "id": "p-1",
                "first_name": "John",
                "last_name": "Doe"
            },
            {
                "id": "p-2",
                "first_name": "Jane",
                "last_name": "Doe"
            }
        ]
    }
    mock_get_booking_details.return_value = mock_booking_details
    
    # Act
    response = test_client.post(
        "/bookings",
        json=round_trip_booking_payload,
        headers={"Authorization": "Bearer fake-token"}
    )
    
    # Assert
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["id"] == booking_id
    assert response_data["trip_type"] == "round-trip"
    assert len(response_data["flights"]) == 2
    assert any(flight["is_return_flight"] for flight in response_data["flights"])
    assert len(response_data["passengers"]) == 2
    
    # Verify the correct service methods were called
    mock_validate_flights.assert_called_once()
    mock_update_seats.assert_called_once()
    mock_get_booking_details.assert_called_once_with(booking_id, user_id=valid_jwt_payload["sub"])


@patch('app.services.auth.get_supabase_client')
@patch('app.routers.bookings.get_supabase_client')
def test_create_round_trip_booking_invalid_return_flight(
    mock_router_supabase, mock_auth_supabase,
    test_client, mock_jwt_decode, valid_jwt_payload, invalid_round_trip_booking_payload
):
    """Test round-trip booking creation fails when no return flight is specified"""
    # Arrange
    mock_supabase = MagicMock()
    mock_router_supabase.return_value = mock_supabase
    mock_auth_supabase.return_value = mock_supabase
    
    mock_jwt_decode.return_value = valid_jwt_payload
    
    # Act
    response = test_client.post(
        "/bookings",
        json=invalid_round_trip_booking_payload,
        headers={"Authorization": "Bearer fake-token"}
    )
    
    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_data = response.json()
    assert "Round-trip bookings must have exactly one flight marked as return" in response_data["detail"]


@patch('app.services.booking.validate_flight_availability')
@patch('app.services.auth.get_supabase_client')
@patch('app.routers.bookings.get_supabase_client')
@patch('app.services.booking.get_supabase_client')
def test_create_round_trip_booking_not_enough_seats(
    mock_booking_supabase, mock_router_supabase, mock_auth_supabase, mock_validate_flights,
    test_client, mock_jwt_decode, valid_jwt_payload, round_trip_booking_payload
):
    """Test round-trip booking creation fails when not enough seats are available"""
    # Arrange
    mock_supabase = MagicMock()
    mock_booking_supabase.return_value = mock_supabase
    mock_router_supabase.return_value = mock_supabase
    mock_auth_supabase.return_value = mock_supabase
    
    mock_jwt_decode.return_value = valid_jwt_payload
    
    # Mock validate_flight_availability to return failure
    error_message = "Not enough economy seats available on return flight SBJ456 (ID: flight-2). Available: 1, Requested: 2"
    mock_validate_flights.return_value = (False, error_message, [])
    
    # Act
    response = test_client.post(
        "/bookings",
        json=round_trip_booking_payload,
        headers={"Authorization": "Bearer fake-token"}
    )
    
    # Assert
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_data = response.json()
    assert error_message in response_data["detail"]
