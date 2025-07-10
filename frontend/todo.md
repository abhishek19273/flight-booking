# Sky-Bound Journeys Frontend TODO

## Authentication
- [x] Integrate Supabase Auth
  - [x] Set up Supabase client
    - [x] Create `supabaseClient.ts` to initialize Supabase
    - [x] Configure environment variables for Supabase URL and anon key
  - [x] Create AuthContext for global auth state management
    - [x] Implement user session persistence
    - [x] Add auth state change listeners
    - [x] Create auth hooks (useAuth)
  - [x] Update auth service methods
    - [x] signUp: Register new users with Supabase
    - [x] signIn: Authenticate users with email/password
    - [x] signOut: Log out users and clear session
    - [x] resetPassword: Handle password recovery flow
  - [x] Implement social login with Google
    - [x] Add Google OAuth provider configuration
    - [x] Create social login UI components
  - [x] Add JWT token handling
    - [x] Store JWT securely after login
    - [x] Attach JWT to API requests via Authorization header
    - [x] Handle token refresh for expired JWTs
  - [x] Create protected route components
    - [x] Implement route guards for authenticated-only pages
    - [x] Add redirect logic for unauthenticated users

## User Management
- [ ] Create user profile page
  - [ ] Personal information management
  - [ ] Payment information storage
  - [ ] Booking history display
- [ ] Implement user settings page

## Flight Search
- [ ] Enhance search functionality
  - [ ] Add support for round-trip bookings
  - [ ] Implement cabin class selection (Economy, Premium Economy, Business, First)
  - [ ] Add passenger count selection (adults, children, infants)
- [ ] Improve flight results display
  - [ ] Show flight number, airline, times, duration, price, available seats
  - [ ] Add sorting and filtering options
  - [ ] Implement responsive design for mobile and desktop

## Booking Management
- [ ] Create booking flow
  - [ ] Passenger information collection form
  - [ ] Seat selection interface
  - [ ] Payment processing integration
  - [ ] Booking confirmation with e-ticket generation
- [ ] Implement booking modification and cancellation
- [ ] Add real-time flight status updates using SSE

## Offline Functionality
- [ ] Implement IndexedDB for offline data persistence
  - [ ] Cache flight search results
  - [ ] Store user preferences
  - [ ] Enable offline booking creation (sync when online)
- [ ] Add service worker for offline app functionality

## Performance Optimization
- [ ] Implement Web Workers for:
  - [ ] Filtering and sorting large flight datasets
  - [ ] Background data processing
  - [ ] Complex calculations for pricing

## State Management
- [ ] Implement Redux or Context API for global state management
  - [ ] User authentication state
  - [ ] Flight search parameters
  - [ ] Booking information

## UI/UX Improvements
- [ ] Create reusable UI components with proper documentation
  - [ ] Flight cards
  - [ ] Search forms
  - [ ] Booking components
- [ ] Implement loading states and error handling
- [ ] Add animations and transitions for better user experience
- [ ] Optimize for mobile devices (responsive design)

## Real-time Updates
- [ ] Implement SSE client for real-time flight status updates
- [ ] Add notifications for booking changes and updates

## Testing
- [ ] Write unit tests for components
- [ ] Add integration tests for key user flows
- [ ] Implement end-to-end testing

## Documentation
- [ ] Document component API
- [ ] Create usage examples
- [ ] Add inline code comments

## Progressive Web App Features
- [ ] Configure manifest.json
- [ ] Add service worker for offline capabilities
- [ ] Implement push notifications
- [ ] Enable "Add to Home Screen" functionality

## Data Visualization
- [ ] Create interactive data visualizations for:
  - [ ] Flight price trends
  - [ ] Seat maps
  - [ ] Admin dashboard statistics

## Email Notifications
- [ ] Integrate with backend for email notifications
  - [ ] Booking confirmations
  - [ ] Flight status updates
  - [ ] Check-in reminders

## Deployment
- [ ] Configure build process for production
- [ ] Set up CI/CD pipeline
- [ ] Deploy to cloud platform (Vercel/Netlify)
