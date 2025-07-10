# Sky-Bound Journeys Backend Documentation

Welcome to the official documentation for the Sky-Bound Journeys backend. This document provides a comprehensive overview of the API endpoints, their functionalities, and the expected request/response formats.

## Table of Contents

- [Project Overview](#project-overview)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Airports](#airports)
  - [Flights](#flights)
  - [Bookings](#bookings)
  - [Payments](#payments)
  - [Flight Admin](#flight-admin)

## Project Overview

The Sky-Bound Journeys backend is a robust and scalable flight booking API built with FastAPI. It handles user authentication, flight and airport data management, booking and payment processing, and administrative functionalities.

## API Endpoints

### Authentication

**File:** `routers/auth.py`

**Note:** Authentication is handled by Supabase Auth service.

- **POST /api/auth/register**
  - **Description:** Registers a new user in Supabase Auth.
  - **Request Body:** `UserCreate` schema (email, password, first_name, last_name).
  - **Response:** `UserResponse` schema with user data from Supabase.

- **POST /api/auth/login**
  - **Description:** Authenticates a user via Supabase Auth and returns JWT tokens.
  - **Request Body:** `LoginRequest` (email, password).
  - **Response:** `TokenResponse` with access and refresh tokens.

- **POST /api/auth/refresh**
  - **Description:** Refreshes an expired access token using a refresh token.
  - **Request Body:** `RefreshTokenRequest` (refresh_token).
  - **Response:** `TokenResponse` with new access and refresh tokens.

- **GET /api/auth/me**
  - **Description:** Retrieves the profile of the currently authenticated user from Supabase.
  - **Authentication:** Required (JWT token).
  - **Response:** `UserResponse` schema.

- **POST /api/auth/reset-password**
  - **Description:** Initiates password reset via Supabase Auth.
  - **Request Body:** `{ "email": "..." }`.

- **POST /api/auth/google**
  - **Description:** Handles Google OAuth sign-in via Supabase Auth.
  - **Request Body:** `{ "idToken": "..." }`.
  - **Response:** `TokenResponse` with access and refresh tokens.

### Users

**File:** `routers/users.py`

**Note:** User data is managed by Supabase Auth and stored in Supabase profiles.

- **GET /api/users/me**
  - **Description:** Retrieves the profile of the currently authenticated user from Supabase.
  - **Authentication:** Required (JWT token).
  - **Response:** `UserProfileResponse` schema with profile data.

- **PUT /api/users/me**
  - **Description:** Updates the profile of the currently authenticated user in Supabase.
  - **Authentication:** Required (JWT token).
  - **Request Body:** `UserProfileUpdate` schema.
  - **Response:** `UserProfileResponse` schema.

- **GET /api/users/bookings**
  - **Description:** Retrieves all bookings for the currently authenticated user.
  - **Authentication:** Required (JWT token).
  - **Response:** List of `BookingResponse` schemas.

### Airports

**File:** `routers/airports.py`

- **GET /api/airports/**
  - **Description:** Retrieves a paginated list of all airports.
  - **Query Parameters:** `skip` (int), `limit` (int).
  - **Response:** List of `Airport` schemas.

- **GET /api/airports/search**
  - **Description:** Searches for airports by name or IATA code.
  - **Query Parameters:** `query` (string).
  - **Response:** List of `Airport` schemas.

- **GET /api/airports/{airport_id}**
  - **Description:** Retrieves a specific airport by its ID.
  - **Response:** `Airport` schema.

### Flights

**File:** `routers/flights.py`

- **GET /api/flights/search**
  - **Description:** Searches for flights based on departure/arrival airports and date.
  - **Query Parameters:** `departure_airport`, `arrival_airport`, `date`.
  - **Response:** List of `Flight` schemas.

- **GET /api/flights/{flight_id}**
  - **Description:** Retrieves the details of a specific flight.
  - **Response:** `Flight` schema.

- **GET /api/flights/{flight_id}/availability**
  - **Description:** Gets seat availability for a specific flight.
  - **Response:** `SeatAvailability` schema.

- **POST /api/flights/subscribe**
  - **Description:** Subscribes a user to receive status updates for a flight.
  - **Authentication:** Required.
  - **Request Body:** `{ "flight_id": "..." }`.

- **GET /api/flights/ws/{client_id}**
  - **Description:** Establishes a WebSocket connection for real-time flight updates.

### Bookings

**File:** `routers/bookings.py`

- **POST /api/bookings/**
  - **Description:** Creates a new booking.
  - **Authentication:** Required.
  - **Request Body:** `BookingCreate` schema.
  - **Response:** `Booking` schema.

- **GET /api/bookings/**
  - **Description:** Retrieves all bookings for the authenticated user.
  - **Authentication:** Required.
  - **Response:** List of `Booking` schemas.

- **GET /api/bookings/{booking_id}**
  - **Description:** Retrieves the details of a specific booking.
  - **Authentication:** Required.
  - **Response:** `Booking` schema.

- **PUT /api/bookings/{booking_id}**
  - **Description:** Updates a specific booking.
  - **Authentication:** Required.
  - **Request Body:** `BookingUpdate` schema.
  - **Response:** `Booking` schema.

- **DELETE /api/bookings/{booking_id}**
  - **Description:** Cancels a specific booking.
  - **Authentication:** Required.

- **GET /api/bookings/{booking_id}/ws**
  - **Description:** Establishes a WebSocket connection for real-time booking status updates.

### Payments

**File:** `routers/payments.py`

- **POST /api/payments/create-payment-intent**
  - **Description:** Creates a Stripe Payment Intent for a booking.
  - **Authentication:** Required.
  - **Request Body:** `{ "booking_id": "..." }`.
  - **Response:** `{ "client_secret": "..." }`.

- **POST /api/payments/webhook**
  - **Description:** Handles Stripe webhook events to update payment status.

### Flight Admin

**File:** `routers/flight_admin.py`

- **POST /api/admin/flights/**
  - **Description:** Adds a new flight (admin only).
  - **Authentication:** Admin role required.
  - **Request Body:** `FlightCreate` schema.
  - **Response:** `Flight` schema.

- **PUT /api/admin/flights/{flight_id}**
  - **Description:** Updates an existing flight (admin only).
  - **Authentication:** Admin role required.
  - **Request Body:** `FlightUpdate` schema.
  - **Response:** `Flight` schema.

- **DELETE /api/admin/flights/{flight_id}**
  - **Description:** Deletes a flight (admin only).
  - **Authentication:** Admin role required.

- **GET /api/admin/flights/**
  - **Description:** Retrieves a list of all flights (admin only).
  - **Authentication:** Admin role required.
  - **Response:** List of `Flight` schemas.

- **GET /api/admin/flights/{flight_id}**
  - **Description:** Retrieves a specific flight by ID (admin only).
  - **Authentication:** Admin role required.
  - **Response:** `Flight` schema.
