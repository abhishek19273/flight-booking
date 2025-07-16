import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import HTTPException
import uuid

from app.services.booking import (
    validate_flight_availability,
    update_seat_availability,
    rollback_seat_deductions,
    create_booking
)


@pytest.fixture
def mock_supabase():
    """Fixture to create a mock Supabase client"""
    mock = MagicMock()
    return mock


@pytest.fixture
def mock_flight_data():
    """Fixture to create mock flight data for testing"""
    return {
        "id": str(uuid.uuid4()),
        "flight_number": "SBJ123",
        "economy_available": 50,
        "business_available": 20,
        "first_available": 10
    }


@pytest.fixture
def mock_flight_items():
    """Fixture to create mock flight items for testing"""
    return [
        {
            "flight_id": str(uuid.uuid4()),
            "cabin_class": "economy",
            "num_passengers": 2,
            "is_return_flight": False
        },
        {
            "flight_id": str(uuid.uuid4()),
            "cabin_class": "business",
            "num_passengers": 1,
            "is_return_flight": True
        }
    ]


@pytest.fixture
def mock_booking_data(mock_flight_items):
    """Fixture to create mock booking data for testing"""
    return {
        "trip_type": "round-trip",
        "total_amount": 1500.00,
        "flights": mock_flight_items,
        "passengers": [
            {
                "type": "adult",
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "1990-01-01",
                "passport_number": "AB123456",
                "nationality": "US",
                "cabin_class": "economy"
            },
            {
                "type": "child",
                "first_name": "Jane",
                "last_name": "Doe",
                "date_of_birth": "2015-01-01",
                "cabin_class": "economy"
            }
        ]
    }


@patch('app.services.booking.get_supabase_client')
async def test_validate_flight_availability_success(mock_get_supabase, mock_supabase, mock_flight_items, mock_flight_data):
    """Test successful validation of flight availability"""
    # Arrange
    mock_get_supabase.return_value = mock_supabase
    
    # Configure mock responses for each flight
    mock_response = MagicMock()
    mock_response.data = mock_flight_data
    mock_response.error = None
    
    # Set up the mock to return the flight data for each flight
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
    
    # Act
    is_valid, error_message, flights_to_update = await validate_flight_availability(mock_flight_items)
    
    # Assert
    assert is_valid is True
    assert error_message == ""
    assert len(flights_to_update) == len(mock_flight_items)
    
    # Verify the correct calls were made
    mock_supabase.table.assert_called_with("flights")
    assert mock_supabase.table.return_value.select.call_count == len(mock_flight_items)


@patch('app.services.booking.get_supabase_client')
async def test_validate_flight_availability_not_enough_seats(mock_get_supabase, mock_supabase, mock_flight_items):
    """Test validation failure when not enough seats are available"""
    # Arrange
    mock_get_supabase.return_value = mock_supabase
    
    # Configure mock response with insufficient seats
    mock_response = MagicMock()
    mock_response.data = {
        "id": mock_flight_items[0]["flight_id"],
        "flight_number": "SBJ123",
        "economy_available": 1,  # Not enough for 2 passengers
        "business_available": 5,
        "first_available": 3
    }
    mock_response.error = None
    
    # Set up the mock to return the flight data
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
    
    # Act
    is_valid, error_message, flights_to_update = await validate_flight_availability(mock_flight_items)
    
    # Assert
    assert is_valid is False
    assert "Not enough economy seats available" in error_message
    assert len(flights_to_update) == 0


@patch('app.services.booking.get_supabase_client')
async def test_validate_flight_availability_flight_not_found(mock_get_supabase, mock_supabase, mock_flight_items):
    """Test validation failure when a flight is not found"""
    # Arrange
    mock_get_supabase.return_value = mock_supabase
    
    # Configure mock response with an error
    mock_response = MagicMock()
    mock_response.data = None
    mock_response.error = "Flight not found"
    
    # Set up the mock to return the error
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_response
    
    # Act
    is_valid, error_message, flights_to_update = await validate_flight_availability(mock_flight_items)
    
    # Assert
    assert is_valid is False
    assert "Flight with ID" in error_message
    assert "not found" in error_message
    assert len(flights_to_update) == 0


@patch('app.services.booking.get_supabase_client')
async def test_update_seat_availability_deduct(mock_get_supabase, mock_supabase):
    """Test successful seat deduction"""
    # Arrange
    mock_get_supabase.return_value = mock_supabase
    
    flights_to_update = [
        {
            "flight_id": "flight-1",
            "cabin_class": "economy",
            "num_passengers": 2,
            "available_seats": 10
        }
    ]
    
    # Configure mock response for update
    mock_response = MagicMock()
    mock_response.data = {"id": "flight-1", "economy_available": 8}
    mock_response.error = None
    
    # Set up the mock to return the update response
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
    
    # Act
    updated_flights = await update_seat_availability(flights_to_update, deduct=True)
    
    # Assert
    assert len(updated_flights) == 1
    assert updated_flights[0]["new_available_seats"] == 8
    
    # Verify the correct calls were made
    mock_supabase.table.assert_called_with("flights")
    mock_supabase.table.return_value.update.assert_called_once()


@patch('app.services.booking.get_supabase_client')
async def test_update_seat_availability_restore(mock_get_supabase, mock_supabase):
    """Test successful seat restoration"""
    # Arrange
    mock_get_supabase.return_value = mock_supabase
    
    flights_to_update = [
        {
            "flight_id": "flight-1",
            "cabin_class": "economy",
            "num_passengers": 2,
            "available_seats": 8
        }
    ]
    
    # Configure mock response for update
    mock_response = MagicMock()
    mock_response.data = {"id": "flight-1", "economy_available": 10}
    mock_response.error = None
    
    # Set up the mock to return the update response
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
    
    # Act
    updated_flights = await update_seat_availability(flights_to_update, deduct=False)
    
    # Assert
    assert len(updated_flights) == 1
    assert updated_flights[0]["new_available_seats"] == 10
    
    # Verify the correct calls were made
    mock_supabase.table.assert_called_with("flights")
    mock_supabase.table.return_value.update.assert_called_once()


@patch('app.services.booking.update_seat_availability')
async def test_rollback_seat_deductions(mock_update_seat_availability):
    """Test rollback of seat deductions"""
    # Arrange
    mock_update_seat_availability.return_value = []
    flights_updated = [
        {
            "flight_id": "flight-1",
            "cabin_class": "economy",
            "num_passengers": 2,
            "available_seats": 8
        }
    ]
    
    # Act
    await rollback_seat_deductions(flights_updated)
    
    # Assert
    mock_update_seat_availability.assert_called_once_with(flights_updated, deduct=False)


@patch('app.services.booking.get_booking_details_by_id')
@patch('app.services.booking.update_seat_availability')
@patch('app.services.booking.validate_flight_availability')
@patch('app.services.booking.get_supabase_client')
async def test_create_booking_success(
    mock_get_supabase, mock_validate_flight_availability, 
    mock_update_seat_availability, mock_get_booking_details,
    mock_supabase, mock_booking_data
):
    """Test successful booking creation"""
    # Arrange
    user_id = "user-123"
    mock_get_supabase.return_value = mock_supabase
    
    # Mock validate_flight_availability to return success
    mock_validate_flight_availability.return_value = (True, "", [{"flight_id": "flight-1"}])
    
    # Mock update_seat_availability to return updated flights
    mock_update_seat_availability.return_value = [{"flight_id": "flight-1", "new_available_seats": 8}]
    
    # Mock booking creation response
    booking_id = "booking-123"
    mock_booking_response = MagicMock()
    mock_booking_response.data = [{"id": booking_id}]
    mock_booking_response.error = None
    
    # Mock booking flights response
    mock_flights_response = MagicMock()
    mock_flights_response.data = [{"id": "bf-1"}, {"id": "bf-2"}]
    mock_flights_response.error = None
    
    # Mock passengers response
    mock_passengers_response = MagicMock()
    mock_passengers_response.data = [{"id": "p-1"}, {"id": "p-2"}]
    mock_passengers_response.error = None
    
    # Set up the mock responses
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = [
        mock_booking_response, mock_flights_response, mock_passengers_response
    ]
    
    # Mock get_booking_details_by_id to return booking details
    mock_booking_details = {"id": booking_id, "flights": [], "passengers": []}
    mock_get_booking_details.return_value = mock_booking_details
    
    # Act
    result = await create_booking(user_id, mock_booking_data)
    
    # Assert
    assert result == mock_booking_details
    mock_validate_flight_availability.assert_called_once()
    mock_update_seat_availability.assert_called_once()
    mock_get_booking_details.assert_called_once_with(booking_id, user_id=user_id)
    
    # Verify the correct calls were made to create booking, flights, and passengers
    assert mock_supabase.table.call_count >= 3


@patch('app.services.booking.rollback_seat_deductions')
@patch('app.services.booking.update_seat_availability')
@patch('app.services.booking.validate_flight_availability')
@patch('app.services.booking.get_supabase_client')
async def test_create_booking_validation_failure(
    mock_get_supabase, mock_validate_flight_availability, 
    mock_update_seat_availability, mock_rollback_seat_deductions,
    mock_supabase, mock_booking_data
):
    """Test booking creation failure due to validation"""
    # Arrange
    user_id = "user-123"
    mock_get_supabase.return_value = mock_supabase
    
    # Mock validate_flight_availability to return failure
    error_message = "Not enough seats available"
    mock_validate_flight_availability.return_value = (False, error_message, [])
    
    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await create_booking(user_id, mock_booking_data)
    
    assert excinfo.value.status_code == 400
    assert excinfo.value.detail == error_message
    
    # Verify no seat updates or rollbacks were attempted
    mock_update_seat_availability.assert_not_called()
    mock_rollback_seat_deductions.assert_not_called()


@patch('app.services.booking.rollback_seat_deductions')
@patch('app.services.booking.update_seat_availability')
@patch('app.services.booking.validate_flight_availability')
@patch('app.services.booking.get_supabase_client')
async def test_create_booking_rollback_on_failure(
    mock_get_supabase, mock_validate_flight_availability, 
    mock_update_seat_availability, mock_rollback_seat_deductions,
    mock_supabase, mock_booking_data
):
    """Test rollback when booking creation fails"""
    # Arrange
    user_id = "user-123"
    mock_get_supabase.return_value = mock_supabase
    
    # Mock validate_flight_availability to return success
    updated_flights = [{"flight_id": "flight-1", "new_available_seats": 8}]
    mock_validate_flight_availability.return_value = (True, "", [{"flight_id": "flight-1"}])
    
    # Mock update_seat_availability to return updated flights
    mock_update_seat_availability.return_value = updated_flights
    
    # Mock booking creation to fail
    mock_booking_response = MagicMock()
    mock_booking_response.data = None
    mock_booking_response.error = "Database error"
    
    # Set up the mock to return the error
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_booking_response
    
    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        await create_booking(user_id, mock_booking_data)
    
    assert excinfo.value.status_code == 500
    assert "Failed to create booking" in excinfo.value.detail
    
    # Verify rollback was attempted
    mock_rollback_seat_deductions.assert_called_once_with(updated_flights)
