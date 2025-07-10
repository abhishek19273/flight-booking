# Supabase Auth Integration Guide

This guide explains how the Supabase Auth integration is implemented in the Sky-Bound Journeys application.

## Table of Contents

1. [Overview](#overview)
2. [Frontend Implementation](#frontend-implementation)
3. [Backend Implementation](#backend-implementation)
4. [Authentication Flows](#authentication-flows)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)

## Overview

Sky-Bound Journeys uses Supabase Auth for user authentication, providing:

- Email/password authentication
- Social login (Google OAuth)
- JWT token validation
- Role-based access control
- Session management
- Password reset functionality

## Frontend Implementation

### Key Files

- `src/services/supabaseClient.ts`: Initializes the Supabase client
- `src/contexts/AuthContext.tsx`: Provides auth state and methods to the app
- `src/components/ProtectedRoute.tsx`: Guards routes requiring authentication
- `src/pages/LoginPage.tsx`: Login form
- `src/pages/SignUpPage.tsx`: Registration form
- `src/pages/ForgotPasswordPage.tsx`: Password reset request
- `src/pages/ResetPasswordPage.tsx`: Password reset confirmation
- `src/pages/AuthCallback.tsx`: OAuth callback handler
- `src/services/api/apiClient.ts`: Attaches JWT to API requests

### Auth Context

The `AuthContext` provides:

- Current user state
- Session state
- Authentication methods:
  - `signUp`: Register new users
  - `signIn`: Email/password login
  - `signInWithGoogle`: Social login
  - `signOut`: Logout
  - `resetPassword`: Request password reset
  - `confirmPasswordReset`: Complete password reset

### Protected Routes

Routes requiring authentication use the `ProtectedRoute` component:

```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

For admin-only routes, set the `requireAdmin` prop:

```tsx
<ProtectedRoute requireAdmin={true}>
  <AdminDashboard />
</ProtectedRoute>
```

### API Authentication

The `apiClient.ts` automatically:

1. Attaches the Supabase JWT to all API requests
2. Handles token refresh when expired
3. Redirects to login on authentication failures

## Backend Implementation

### Key Files

- `app/services/supabase_client.py`: Initializes Supabase client
- `app/middleware/auth.py`: JWT validation middleware
- `app/dependencies/auth.py`: Authentication dependencies
- `app/routers/auth.py`: Auth endpoints
- `app/schemas/user.py`: User data models

### JWT Validation

The backend validates JWTs using:

1. Supabase JWT secret
2. FastAPI middleware
3. Dependency injection

Example protected route:

```python
@router.get("/profile", response_model=schemas.UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
```

### Role-Based Access Control

Admin-only endpoints use the `get_admin_user` dependency:

```python
@router.get("/admin/users", response_model=List[schemas.User])
async def get_all_users(admin_user: User = Depends(get_admin_user)):
    # Only accessible to admins
    return await get_users()
```

## Authentication Flows

### Registration Flow

1. User submits registration form
2. Frontend calls `signUp` method in `AuthContext`
3. Supabase creates user in Auth schema
4. Verification email sent to user
5. User confirms email by clicking link
6. User redirected to login page

### Login Flow

1. User submits login form
2. Frontend calls `signIn` method
3. Supabase validates credentials and returns JWT tokens
4. `AuthContext` stores session and updates user state
5. User redirected to dashboard

### Social Login Flow

1. User clicks "Sign in with Google"
2. `signInWithGoogle` initiates OAuth flow
3. User redirected to Google consent screen
4. After approval, redirected to `/auth/callback`
5. `AuthCallback` component handles the redirect
6. User session established

### Password Reset Flow

1. User requests password reset
2. `resetPassword` sends reset email
3. User clicks link in email
4. Redirected to reset password page
5. User sets new password via `confirmPasswordReset`
6. User redirected to login page

## Security Considerations

- JWT tokens are stored securely and refreshed automatically
- API requests are protected with JWT validation
- Role-based access control prevents unauthorized access
- Password reset tokens are single-use and time-limited
- OAuth state validation prevents CSRF attacks

## Troubleshooting

### Common Issues

1. **"Invalid JWT" errors**
   - Check that `SUPABASE_JWT_SECRET` matches the project JWT secret
   - Verify token hasn't expired

2. **Social login failures**
   - Ensure OAuth provider is configured in Supabase dashboard
   - Check redirect URL is correct and allowed

3. **Session not persisting**
   - Verify Supabase client is initialized correctly
   - Check for CORS issues

### Debugging Tools

Use the utility functions in `src/utils/authUtils.ts`:

- `isSessionValid()`: Check if session is valid
- `debugAuthState()`: Log current auth state
- `getUserMetadata()`: Get formatted user data

For backend debugging, enable debug logging in FastAPI:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```
