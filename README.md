# Sky-Bound Journeys

A full-stack flight booking application with Supabase Auth integration.

## Features

- **Secure Authentication**: Complete Supabase Auth integration with email/password and social login
- **Protected Routes**: Role-based access control for frontend routes
- **JWT Validation**: Secure API endpoints with JWT token validation
- **User Management**: User profiles with Supabase Auth
- **Flight Search**: Search for flights with various filters
- **Booking System**: Book flights and manage bookings

## Tech Stack

### Frontend
- React with TypeScript
- React Router for navigation
- Supabase JS client for auth
- Tailwind CSS for styling
- Axios for API requests

### Backend
- FastAPI (Python)
- Supabase for authentication and database
- JWT token validation
- PostgreSQL (via Supabase)

## Setup Instructions

### Prerequisites
- Node.js and npm
- Python 3.8+
- Supabase account and project

### Supabase Setup
1. Create a new Supabase project at https://app.supabase.com
2. Enable Email Auth and Google OAuth in the Authentication settings
3. Copy your Supabase URL and anon key from the API settings
4. Set up your JWT secret in the JWT settings

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

5. Update the `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_key
   SUPABASE_JWT_SECRET=your_supabase_jwt_secret
   ```

6. Start the backend server:
   ```
   uvicorn app.main:app --reload
   ```

## Authentication Flow

### Sign Up
1. User submits registration form with email, password, and profile information
2. Supabase creates a new user in the Auth schema
3. Verification email is sent to the user
4. User verifies email by clicking the link

### Sign In
1. User submits login form with email and password
2. Supabase validates credentials and returns JWT tokens
3. Frontend stores tokens and updates auth state
4. Protected routes become accessible

### Social Login
1. User clicks "Sign in with Google" button
2. Supabase OAuth flow redirects to Google
3. User authorizes the application
4. Supabase creates or updates user record
5. User is redirected back to the application with tokens

### Password Reset
1. User requests password reset with email
2. Supabase sends password reset email
3. User clicks the reset link
4. User sets a new password
5. User can sign in with the new password

## API Authentication

All API endpoints are protected with JWT validation:

1. Frontend attaches the Supabase access token to API requests
2. Backend validates the JWT token using the Supabase JWT secret
3. If valid, the request proceeds; otherwise, a 401 Unauthorized response is returned

## License

MIT
