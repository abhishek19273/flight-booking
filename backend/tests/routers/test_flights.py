import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, timedelta

from app.main import app


@pytest.fixture(scope="module")
def client():
    """Provides a TestClient instance for the entire module."""
    with TestClient(app) as c:
        yield c


@patch('app.routers.flights.get_supabase_client')
def test_search_flights_unit(mock_get_supabase_client, client):
    """
    Unit test for the search_flights endpoint.

    This test mocks the Supabase client to isolate the endpoint logic and verify
    that the query is constructed correctly based on the search parameters.
    """
    # Arrange
    mock_supabase = MagicMock()
    mock_get_supabase_client.return_value = mock_supabase

    # Mock query builders for airports and flights
    mock_airport_query = MagicMock()
    mock_flight_query = MagicMock()

    # Configure the side effect for the table method
    def table_side_effect(table_name):
        if table_name == 'airports':
            return mock_airport_query
        elif table_name == 'flights':
            return mock_flight_query
        return MagicMock()

    mock_supabase.table.side_effect = table_side_effect

    # Set up mocks for chained calls
    for builder in [mock_airport_query, mock_flight_query]:
        builder.select.return_value = builder
        builder.eq.return_value = builder
        builder.gte.return_value = builder
        builder.lt.return_value = builder

    # Mock responses for airport ID lookups
    origin_airport_id = 'b1c2d3e4-f5g6-7890-1234-567890abcdef'
    destination_airport_id = 'c1d2e3f4-g5h6-7890-1234-567890abcdef'

    mock_origin_response = MagicMock(data=[{'id': origin_airport_id}], error=None)
    mock_dest_response = MagicMock(data=[{'id': destination_airport_id}], error=None)
    mock_airport_query.execute.side_effect = [mock_origin_response, mock_dest_response]

    # Mock response for the final flights query
    mock_flight_data = {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "flight_number": "UA225",
        "airline_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "origin_airport_id": origin_airport_id,
        "destination_airport_id": destination_airport_id,
        "departure_time": "2025-12-01T10:00:00+00:00",
        "arrival_time": "2025-12-01T13:00:00+00:00",
        "duration_minutes": 180,
        "status": "scheduled",
        "economy_price": 250.00,
        "premium_economy_price": 450.00,
        "business_price": 800.00,
        "first_price": 1500.00,
        "economy_available": 100,
        "premium_economy_available": 50,
        "business_available": 20,
        "first_available": 10,
        "airline": {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            "name": "United Airlines", "code": "UA", "logo_url": "https://example.com/ua_logo.png", "created_at": "2024-01-01T00:00:00+00:00"
        },
        "origin_airport": {
            "id": origin_airport_id, "iata_code": "JFK", "name": "John F. Kennedy International Airport", "city": "New York", "country": "USA", "icao_code": "KJFK", "timezone": "America/New_York"
        },
        "destination_airport": {
            "id": destination_airport_id, "iata_code": "LAX", "name": "Los Angeles International Airport", "city": "Los Angeles", "country": "USA", "icao_code": "KLAX", "timezone": "America/Los_Angeles"
        }
    }
    mock_flights_response = MagicMock(data=[mock_flight_data], error=None)
    mock_flight_query.execute.return_value = mock_flights_response

    # Act
    response = client.get(
        "/flights/search?from_code=JFK&to_code=LAX&departure_date=2025-12-01&cabin_class=economy&adults=1&children=0&infants=0"
    )

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data) == 1
    assert response_data[0]['flight_number'] == 'UA225'

    # Verify airport ID lookups
    mock_supabase.table.assert_any_call('airports')
    mock_airport_query.select.assert_any_call('id')
    mock_airport_query.eq.assert_any_call('iata_code', 'JFK')
    mock_airport_query.eq.assert_any_call('iata_code', 'LAX')

    # Verify flight query
    mock_supabase.table.assert_any_call('flights')
    mock_flight_query.select.assert_called_with(
        '*, airline:airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)'
    )
    mock_flight_query.eq.assert_any_call('origin_airport_id', origin_airport_id)
    mock_flight_query.eq.assert_any_call('destination_airport_id', destination_airport_id)
    mock_flight_query.gte.assert_any_call('departure_time', '2025-12-01T00:00:00')
    mock_flight_query.lt.assert_any_call('departure_time', '2025-12-01T23:59:59')
    mock_flight_query.gte.assert_any_call('economy_available', 1)


@pytest.mark.integration
def test_search_flights_integration(client):
    """
    Integration test for the flight search endpoint.

    This test queries the live test database, which is seeded with dummy data,
    to ensure the entire flight search functionality works end-to-end.
    """
    # Arrange: Use a date known to have flights from the seeding script
    # The seeding script creates flights for 30 days from the current date.
    # We'll pick a date a few days in the future to be safe.
    search_date = (datetime.now(timezone.utc).date() + timedelta(days=5)).isoformat()

    # Act
    response = client.get(
        f"/flights/search?from_code=JFK&to_code=LAX&departure_date={search_date}&cabin_class=economy&adults=1&children=0&infants=0"
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # It's possible no flights are returned, but the request should succeed
    if len(data) > 0:
        # Verify the structure of the first flight in the response
        flight = data[0]
        assert 'id' in flight
        assert flight['origin_airport']['iata_code'] == 'JFK'
        assert flight['destination_airport']['iata_code'] == 'LAX'
        assert flight['economy_available'] >= 1

