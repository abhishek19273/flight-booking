# Sky-Bound Journeys Frontend Documentation

Welcome to the official documentation for the Sky-Bound Journeys frontend. This document provides a comprehensive overview of the application's features, architecture, and codebase.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Features](#features)
  - [Authentication](#authentication)
  - [Flight Search](#flight-search)
  - [Flight Booking](#flight-booking)
  - [Booking Confirmation](#booking-confirmation)
  - [Home Page](#home-page)
- [Folder Structure](#folder-structure)
- [Key Components](#key-components)
- [Services](#services)

## Project Overview

Sky-Bound Journeys is a modern, user-friendly flight booking application. It allows users to search for flights, book tickets, and manage their bookings seamlessly. The frontend is built with React, TypeScript, and Tailwind CSS, providing a fast, responsive, and intuitive user experience.

## Getting Started

To get the frontend up and running locally, follow these simple steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/abhishek19273/flight-booking.git
    cd flight-booking/frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Features

### Authentication

The application provides a secure and straightforward authentication system.

- **User Sign-Up:** New users can create an account using their email and password.
- **User Login:** Registered users can log in with their credentials.
- **Social Login:** Users can also sign up or log in using their Google account for a quicker process.
- **Password Recovery:** A password recovery option is available for users who have forgotten their password.

### Flight Search

The flight search functionality allows users to find the best flights for their journey.

- **Search Form:** Users can search for flights by providing the departure and arrival airports, along with the travel date.
- **Flight Listings:** The search results page displays a list of available flights with essential details such as airline, price, duration, and number of stops.
- **Real-Time Updates:** The application provides real-time updates on flight statuses, ensuring users have the most current information.

### Flight Booking

The booking process is designed to be simple and efficient.

- **Flight Selection:** Users can select their desired flight from the search results to proceed with the booking.
- **Passenger Details:** The booking form allows users to enter passenger information.
- **Seat Selection:** A seat selection feature is available for users to choose their preferred seats.
- **Payment:** The application includes a mock payment processing system to complete the booking.

### Booking Confirmation

After a successful booking, users are provided with a confirmation.

- **Booking Summary:** The confirmation page displays a detailed summary of the booked flight, including passenger and payment details.
- **Print/Download:** Users have the option to print or download their booking confirmation for their records.

### Home Page

The home page serves as the entry point to the application.

- **Featured Destinations:** It showcases a curated list of featured destinations to inspire travel.
- **Quick Search:** A search bar is prominently displayed, allowing users to perform a quick flight search directly from the home page.

## Folder Structure

The `src` directory is organized as follows:

```
src
├── components/       # Reusable UI components
├── contexts/         # React contexts for state management
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Application pages
├── services/         # API requests and other services
├── types/            # TypeScript type definitions
└── workers/          # Web workers for background tasks
```

## Key Components

- `Header.tsx`: The main navigation bar of the application.
- `Footer.tsx`: The footer section, containing useful links and information.
- `FlightCard.tsx`: A card component to display flight details in the search results.
- `BookingForm.tsx`: The form used for entering passenger and payment information.
- `SeatPicker.tsx`: A component for selecting seats on the flight.

## Detailed Components and API Calls

### FlightSearchForm

- **Functionality**: This component allows users to search for flights by providing departure and arrival airports, along with the travel date.
- **API Calls**:
  - `GET /api/flights/search`: Retrieves a list of available flights based on the user's search criteria.

### FlightResults

- **Functionality**: This component displays the flight search results in a clear and organized manner. It also provides real-time updates on flight statuses.
- **API Calls**:
  - `GET /api/flights/status`: Fetches real-time status updates for the displayed flights.

### FlightTracking

- **Functionality**: This component allows users to track the real-time status of a specific flight.
- **API Calls**:
  - `GET /api/flights/track`: Retrieves the real-time tracking information for a given flight.

## Services

The `services` directory contains the logic for interacting with external APIs.

- `authService.ts`: Handles authentication-related API calls, such as login, sign-up, and password recovery.
- `flightService.ts`: Manages API requests for searching flights and fetching flight data.
- `bookingService.ts`: Handles the flight booking process, including payment and confirmation.
