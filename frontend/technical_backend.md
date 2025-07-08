# SkyBound Journeys - Backend Technical Documentation

## Architecture Overview

The backend for SkyBound Journeys will be implemented using FastAPI and will integrate with Supabase for authentication, database storage, and real-time updates. The system will follow a microservices architecture pattern with the following components:

1. **Authentication Service**: Handles user authentication using Supabase Auth.
2. **Flight Service**: Manages flight data, search, and availability.
3. **Booking Service**: Handles the booking process and management.
4. **Notification Service**: Handles email notifications and real-time updates.
5. **Payment Service**: Manages payment processing.

## Technology Stack

- **FastAPI**: High-performance Python web framework for building APIs
- **Supabase**: Backend-as-a-service for authentication, database, and real-time updates
- **PostgreSQL**: Database (provided by Supabase)
- **Server-Sent Events (SSE)**: For real-time flight status updates
- **Docker**: For containerization
- **Pydantic**: For data validation and settings management
- **pytest**: For automated testing
- **Swagger/OpenAPI**: For API documentation

## Database Schema

### Tables

#### Users (Managed by Supabase Auth)
- id (PK)
- email
- first_name
- last_name
- phone_number
- created_at
- updated_at

#### User_Profiles
- id (PK)
- user_id (FK to Users)
- address
- city
- country
- zip_code
- preferences (JSON)
- created_at
- updated_at

#### Airlines
- id (PK)
- name
- code (IATA code)
- logo_url
- created_at
- updated_at

#### Airports
- id (PK)
- iata_code
- icao_code
- name
- city
- country
- timezone
- latitude
- longitude
- created_at
- updated_at

#### Flights
- id (PK)
- flight_number
- airline_id (FK to Airlines)
- origin_airport_id (FK to Airports)
- destination_airport_id (FK to Airports)
- departure_time
- arrival_time
- duration_minutes
- status (scheduled, on-time, delayed, cancelled, arrived)
- aircraft_type
- economy_price
- economy_available
- economy_seats
- premium_economy_price
- premium_economy_available
- premium_economy_seats
- business_price
- business_available
- business_seats
- first_price
- first_available
- first_seats
- created_at
- updated_at

#### Bookings
- id (PK)
- user_id (FK to Users)
- booking_reference (unique)
- trip_type (one-way, round-trip)
- total_amount
- status (pending, confirmed, cancelled)
- created_at
- updated_at

#### Booking_Flights
- id (PK)
- booking_id (FK to Bookings)
- flight_id (FK to Flights)
- is_return_flight (boolean)
- created_at
- updated_at

#### Passengers
- id (PK)
- booking_id (FK to Bookings)
- type (adult, child, infant)
- first_name
- last_name
- date_of_birth
- passport_number
- nationality
- cabin_class (economy, premium-economy, business, first)
- created_at
- updated_at

#### Payments
- id (PK)
- booking_id (FK to Bookings)
- amount
- currency
- status (pending, completed, failed, refunded)
- payment_method
- payment_details (encrypted JSON)
- created_at
- updated_at

## API Endpoints

### Authentication API

```python
@app.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    
@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Login a user"""
    
@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """Refresh an access token"""
    
@app.post("/auth/logout")
async def logout(token: str):
    """Logout a user"""
User Profile API
python
At mention
@app.get("/users/me", response_model=UserProfileResponse)
async def get_current_user(current_user: User = Depends(get_current_user)):
    """Get the current user profile"""
    
@app.put("/users/me", response_model=UserProfileResponse)
async def update_user_profile(profile_data: UserProfileUpdate, current_user: User = Depends(get_current_user)):
    """Update the current user profile"""
    
@app.get("/users/me/bookings", response_model=List[BookingResponse])
async def get_user_bookings(current_user: User = Depends(get_current_user)):
    """Get all bookings for the current user"""
Airports API
python
At mention
@app.get("/airports", response_model=List[AirportResponse])
async def search_airports(query: str = None, limit: int = 10):
    """Search for airports by name, city, or IATA code"""
    
@app.get("/airports/{airport_id}", response_model=AirportDetailResponse)
async def get_airport(airport_id: str):
    """Get airport details by ID"""
Flights API
python
At mention
@app.post("/flights/search", response_model=List[FlightResponse])
async def search_flights(search_params: FlightSearchParams):
    """Search for flights based on criteria"""
    
@app.get("/flights/{flight_id}", response_model=FlightDetailResponse)
async def get_flight(flight_id: str):
    """Get flight details by ID"""
    
@app.get("/flights/{flight_id}/availability", response_model=FlightAvailabilityResponse)
async def get_flight_availability(flight_id: str, cabin_class: str = None):
    """Get seat availability for a flight"""
Booking API
python
At mention
@app.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    """Create a new booking"""
    
@app.get("/bookings/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    """Get booking details by ID"""
    
@app.put("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: str, booking_data: BookingUpdate, current_user: User = Depends(get_current_user)):
    """Update a booking"""
    
@app.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a booking"""
Payment API
python
At mention
@app.post("/payments", response_model=PaymentResponse)
async def process_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    """Process a payment for a booking"""
    
@app.get("/payments/{payment_id}", response_model=PaymentDetailResponse)
async def get_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    """Get payment details by ID"""
Real-time Flight Updates API
python
At mention
@app.get("/flights/{flight_id}/status")
async def get_flight_status_updates(flight_id: str, request: Request):
    """Get real-time status updates for a flight using SSE"""
Real-time Updates with Server-Sent Events (SSE)
The system will implement Server-Sent Events for real-time flight status updates:

python
At mention
async def flight_status_event_generator(flight_id: str):
    """Generator for flight status events"""
    try:
        while True:
            # Get the latest flight status from database
            flight_status = await get_latest_flight_status(flight_id)
            
            # Format the event data
            data = json.dumps({
                "flight_id": flight_id,
                "status": flight_status.status,
                "departure_time": flight_status.departure_time,
                "arrival_time": flight_status.arrival_time,
                "gate": flight_status.gate,
                "terminal": flight_status.terminal,
                "updated_at": flight_status.updated_at
            })
            
            # Yield the SSE formatted event
            yield f"data: {data}\n\n"
            
            # Wait for a period before checking for updates again
            await asyncio.sleep(10)
    except asyncio.CancelledError:
        # Handle client disconnection
        pass

@app.get("/flights/{flight_id}/status")
async def flight_status_updates(flight_id: str, request: Request):
    """Endpoint for SSE flight status updates"""
    event_generator = flight_status_event_generator(flight_id)
    return EventSourceResponse(event_generator)
Integration with Supabase
Authentication
We'll use Supabase Auth for user authentication:

python
At mention
from supabase import create_client, Client

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def register_user(email: str, password: str, user_data: dict):
    """Register a new user with Supabase Auth"""
    auth_response = supabase.auth.sign_up(
        email=email,
        password=password
    )
    
    if auth_response.error:
        raise HTTPException(status_code=400, detail=auth_response.error.message)
    
    # Create user profile in database
    user_id = auth_response.user.id
    user_data["user_id"] = user_id
    
    profile_response = supabase.table("user_profiles").insert(user_data).execute()
    
    return auth_response.user

async def login_user(email: str, password: str):
    """Login a user with Supabase Auth"""
    auth_response = supabase.auth.sign_in(
        email=email,
        password=password
    )
    
    if auth_response.error:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return auth_response.session
Database Operations
We'll use Supabase's PostgreSQL database for data storage:

python
At mention
async def search_flights(search_params: FlightSearchParams):
    """Search flights using Supabase query builder"""
    query = supabase.table("flights") \
        .select("*, airlines(*), origin_airport:airports!origin_airport_id(*), destination_airport:airports!destination_airport_id(*)") \
        .eq("origin_airport.iata_code", search_params.from_code) \
        .eq("destination_airport.iata_code", search_params.to_code)
        
    # Add date filter
    departure_date = search_params.departure_date
    query = query.gte("departure_time", f"{departure_date}T00:00:00") \
                .lte("departure_time", f"{departure_date}T23:59:59")
    
    # Add cabin class availability filter
    if search_params.cabin_class == "economy":
        query = query.gt("economy_available", search_params.passengers)
    elif search_params.cabin_class == "premium-economy":
        query = query.gt("premium_economy_available", search_params.passengers)
    elif search_params.cabin_class == "business":
        query = query.gt("business_available", search_params.passengers)
    elif search_params.cabin_class == "first":
        query = query.gt("first_available", search_params.passengers)
    
    response = query.execute()
    
    if response.error:
        raise HTTPException(status_code=500, detail="Database error")
    
    return response.data
Offline Support with IndexedDB
The backend will support offline data persistence by providing endpoints for the frontend to fetch and cache data:

python
At mention
@app.get("/cache/airports")
async def get_airports_for_cache():
    """Get all airports for client-side caching"""
    airports = supabase.table("airports").select("*").execute()
    return airports.data

@app.get("/cache/airlines")
async def get_airlines_for_cache():
    """Get all airlines for client-side caching"""
    airlines = supabase.table("airlines").select("*").execute()
    return airlines.data
Email Notifications
The system will send email notifications for booking confirmations and updates:

python
At mention
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True
)

async def send_booking_confirmation(booking: Booking, user_email: str):
    """Send booking confirmation email"""
    message = MessageSchema(
        subject="Your booking confirmation",
        recipients=[user_email],
        template_body={
            "booking_reference": booking.booking_reference,
            "passenger_name": f"{booking.passengers[0].first_name} {booking.passengers[0].last_name}",
            "flight_number": booking.flights[0].flight_number,
            "departure_date": booking.flights[0].departure_time.strftime("%Y-%m-%d %H:%M"),
            "origin_airport": booking.flights[0].origin_airport.name,
            "destination_airport": booking.flights[0].destination_airport.name,
        },
        subtype="html"
    )
    
    fm = FastMail(mail_config)
    await fm.send_message(message, template_name="booking_confirmation.html")
Web Workers for Performance
The backend will provide endpoints to support frontend Web Workers for CPU-intensive tasks:

python
At mention
@app.post("/search/optimize")
async def optimize_search_results(search_data: dict):
    """Endpoint for optimized search processing"""
    # This endpoint will return data formatted for the frontend Web Worker
    # to process and filter efficiently
Testing Strategy
The backend will implement comprehensive testing using pytest:

python
At mention
# Example test for flight search
async def test_search_flights():
    """Test flight search functionality"""
    search_params = {
        "from_code": "JFK",
        "to_code": "LAX",
        "departure_date": "2023-12-01",
        "passengers": 2,
        "cabin_class": "economy"
    }
    
    response = await client.post("/flights/search", json=search_params)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
Deployment
The backend will be deployed using Docker containers:

dockerfile
At mention
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
Implementation Steps
Set up FastAPI project structure
Create Supabase project and configure authentication
Implement database schema in Supabase
Develop core API endpoints
Implement SSE for real-time updates
Set up email notification service
Add support for offline data persistence
Implement testing
Set up Docker containerization
Deploy to production environment