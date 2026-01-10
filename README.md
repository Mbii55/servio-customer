# Servio Customer Mobile App Documentation

> A React Native mobile application built with **Expo**, connecting customers with local service providers

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Screens Documentation](#-screens-documentation)
- [State Management](#-state-management)
- [Services & API](#-services--api)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Build & Deploy](#-build--deploy)

---

## 🎯 Overview

The **Servio Customer App** allows users to:
- Browse services by category
- Search for services and providers
- Book services with scheduling
- **Pay online via Noqoody gateway** (Qatar)
- Manage addresses for service delivery
- Track bookings in real-time
- Leave reviews after service completion
- Save favorite services and providers
- Receive push notifications

**Companion Apps:**
- Service Provider Portal (Next.js)
- Admin Panel (Next.js)
- Backend API (Node.js + Express + PostgreSQL)

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | ~54.0 | Development and build tooling |
| **TypeScript** | ~5.9 | Type-safe development |
| **React Query** | ^5.90 | Server state management & caching |
| **React Navigation** | ^7.1 | Navigation library |
| **Axios** | ^1.13 | HTTP client |
| **React Native WebView** | Latest | Payment gateway integration |
| **Expo Notifications** | ~0.32 | Push notifications |
| **React Native Maps** | 1.20 | Map integration for addresses |

---

## 📁 Project Structure
```
servio-customer-main/
├── assets/                      # App icons, images, splash screens
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── auth/               # Authentication modals
│   │   ├── booking/            # Booking-related components
│   │   ├── common/             # Shared components (Button, Input, etc.)
│   │   ├── favorites/          # Favorite cards
│   │   └── services/           # Service cards
│   ├── constants/              # App constants (colors, config)
│   ├── context/                # React Context providers
│   ├── hooks/                  # Custom React Query hooks
│   ├── navigation/             # Navigation setup and types
│   ├── screens/                # All app screens (organized by feature)
│   │   ├── payments/           # ✅ NEW: Payment processing screens
│   │   └── ...
│   ├── services/               # API service functions
│   │   ├── payments.ts         # ✅ NEW: Payment API calls
│   │   └── ...
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions (React Query config)
├── App.tsx                     # Root component
├── app.json                    # Expo configuration
└── package.json                # Dependencies
```

---

## 🎯 Key Features

### 1. **Authentication**
- Customer registration and login
- JWT token-based authentication
- Password reset flow (disabled in current version)
- Profile management with image upload

### 2. **Service Discovery**
- Browse services by category
- Search services and providers
- View service details with images, pricing, and reviews
- Filter and sort results

### 3. **Booking System**
- 4-step booking process (Date/Time → Address → Add-ons → Review)
- Real-time availability checking
- Calendar picker with blocked dates
- Time slot selection
- Address management with GPS coordinates
- Add-on selection (optional extras)
- **Payment method selection (Cash / Online)**

### 4. **Payment Integration (NEW)**
- **Payment Gateway**: Noqoody (Qatar-based)
- **Payment Methods**: Cash on service or Pay online
- **Payment Flow**:
  - Customer selects payment method during booking
  - Online payment opens Noqoody gateway in WebView
  - Real-time payment validation
  - Automatic booking creation after successful payment
  - Payment failure handling with retry option
- **Security**: HTTPS, HMAC signature verification, no card storage
- **User Experience**: 
  - Seamless payment within app
  - Loading states and progress indicators
  - Clear error messages
  - Retry mechanism for failed payments

### 5. **Favorites**
- Save favorite services and providers
- Quick access from favorites screen
- Optimistic UI updates

### 6. **Notifications**
- Push notifications for booking updates
- **Payment confirmation notifications**
- In-app notification history
- Unread count badge
- Mark as read functionality

### 7. **Reviews**
- Rate services (1-5 stars)
- Leave comments
- Only for completed bookings
- One review per booking

### 8. **React Query Caching**
- Instant screen loads with prefetching
- Optimistic updates for mutations
- Automatic background sync
- Smart cache invalidation

---

## 📱 Screens Documentation

### Authentication Screens
**Location**: `src/screens/auth/`

#### `WelcomeScreen.tsx`
- **Purpose**: First screen users see
- **Features**: App introduction, login/register buttons
- **Navigation**: Entry point to authentication flow

#### `AuthModal` Component
**Location**: `src/components/auth/AuthModal.tsx`
- **Purpose**: Modal for login and registration
- **Features**: 
  - Toggle between login/register
  - Email validation
  - Password strength indicators
  - Phone number formatting
- **Used In**: Multiple screens when authentication required

#### `ForgotPasswordScreen.tsx` *(Disabled)*
- **Purpose**: Password reset via email
- **Status**: Currently disabled in frontend
- **Note**: Backend supports password reset, but UI is hidden

#### `ResetPasswordScreen.tsx` *(Disabled)*
- **Purpose**: Set new password with token
- **Status**: Currently disabled in frontend

---

### Home Tab Screens
**Location**: `src/screens/home/`

#### `HomeScreen.tsx`
- **Purpose**: Main landing screen after login
- **Features**:
  - Category pills (top 6 + "All" + "More")
  - Featured providers carousel
  - Popular services grid
  - Unread notifications badge
  - Pull-to-refresh
- **React Query**: Uses `useServices`, `useProviders`, `useHomeCategoryPills`, `useUnreadNotificationsCount`
- **Performance**: Instant load with 5min cache, prefetches before navigation

#### `ServiceDetailsScreen.tsx`
- **Purpose**: Detailed view of a service
- **Features**:
  - Image gallery with dots indicator
  - Service title, price, duration
  - Provider information
  - Service description
  - Add-ons list
  - Reviews with ratings
  - Favorite toggle
  - Share functionality
  - "Book Now" button
- **React Query**: Uses `useService`, `useToggleFavorite`, separate queries for addons and reviews
- **Performance**: Critical screen - loads in 0-100ms with prefetch (was 4.5s before)

#### `ProviderDetailsScreen.tsx`
- **Purpose**: Provider/shop profile page
- **Features**:
  - Business logo and name
  - Business description
  - Contact buttons (call, email)
  - Services grid
  - Location information
  - Favorite toggle
- **React Query**: Uses `useProvider`, `useToggleProviderFavorite`, `usePrefetchService`
- **Performance**: Instant load with prefetch (was 2.5s before)

---

### Search/Explore Tab
**Location**: `src/screens/search/`

#### `ExploreScreen.tsx`
- **Purpose**: Search and browse all services/providers
- **Features**:
  - Search bar with 300ms debouncing
  - Mode toggle (Services / Shops)
  - Category filters (horizontal scroll)
  - Featured/Popular results when not searching
  - Results list with pagination
  - Active filter chips
  - Pull-to-refresh
- **React Query**: Uses `useSearch`, `useCategories`, `useFeaturedResults`, `usePrefetchService`, `usePrefetchProvider`
- **Performance**: Debounced search reduces API calls by 90%

---

### Bookings Tab
**Location**: `src/screens/bookings/`

#### `BookingsScreen.tsx`
- **Purpose**: List all user bookings
- **Features**:
  - Tab filters (All / Upcoming / Completed / Cancelled)
  - Status badges with colors
  - **Payment status badges** (Pending / Paid / Refunded)
  - Booking cards with service info
  - Pull-to-refresh
  - Review eligibility indicator for completed bookings
- **React Query**: Uses `useBookings`, `useBookingsReviewEligibility`, `usePrefetchBooking`
- **Performance**: Auto-refetches every 30s, instant navigation to details

#### `BookingDetailsScreen.tsx`
- **Purpose**: Detailed view of a single booking
- **Features**:
  - Status banner with color coding
  - Service details card
  - Provider information
  - Service location
  - **Payment summary with status**
  - **"Pay Now" button for pending payments** (online payment only)
  - Notes section
  - Cancel button (for pending/accepted)
  - Write review button (for completed, if eligible)
  - "Reviewed" badge (if already reviewed)
- **React Query**: Uses `useBooking`, `useCancelBooking`, `useCanReviewBooking`, `usePaymentStatus`
- **Performance**: Instant load when coming from BookingsScreen (cached)
- **Payment Features**:
  - Shows payment method (Cash / Noqoody)
  - Shows payment status badge
  - "Pay Now" button appears for unpaid online bookings
  - Payment status auto-refreshes

#### `BookServiceScreen.tsx`
- **Purpose**: Multi-step booking creation wizard
- **Steps**:
  1. **Date & Time**: Calendar picker + time slot selection
  2. **Address**: Select or add service location
  3. **Add-ons**: Optional extras
  4. **Review**: Summary + **payment method selection**
- **Features**:
  - Step indicator pills
  - Validation per step
  - Real-time slot availability
  - Add new address inline
  - **Payment method selector** (Cash / Pay Online)
  - Customer notes field
- **Payment Method Selection**:
  - Radio buttons for Cash vs Online payment
  - Visual indicators (icons, badges)
  - "Secure" badge for online payment
  - Clear payment flow information
- **React Query**: Uses `useService`, `useAddresses` for data (form state stays manual)
- **Performance**: Service/address load instantly from cache
- **Payment Handling**:
  - Cash: Creates booking immediately → Success screen
  - Online: Navigates to PaymentProcessing screen → No booking created yet

#### `BookingSuccessScreen.tsx`
- **Purpose**: Confirmation screen after booking
- **Features**:
  - Success animation
  - Booking number
  - Date/Time summary
  - **Payment details** (method and status)
  - What's next instructions
  - Actions (View Details, Back to Home)
- **Payment Info**: Shows whether payment is pending (cash) or paid (online)

#### `ReviewScreen.tsx`
- **Purpose**: Leave a review after service completion
- **Features**:
  - Star rating (1-5)
  - Comment text area
  - Booking information display
  - Review eligibility check
- **Navigation**: Modal presentation (slides up from bottom)
- **Validation**: Only for completed bookings, one review per booking

---

### Payment Screens (NEW)
**Location**: `src/screens/payments/`

#### `PaymentProcessingScreen.tsx`
- **Purpose**: Handle online payment flow with Noqoody gateway
- **Payment States**:
  1. **Initiating**: Generating payment link with backend
  2. **Payment**: WebView showing Noqoody payment page
  3. **Validating**: Confirming payment with backend (creates booking)
  4. **Success**: Payment confirmed, booking created
  5. **Failed**: Payment failed, no booking created

- **Features**:
  - Full-screen WebView for Noqoody payment
  - Secure payment indicator (shield icon)
  - Amount display at bottom
  - Loading states with spinners
  - Success animation
  - Error handling with retry
  - Cancel payment option
  - Manual status check button
  - Navigation handling (detect return from Noqoody)

- **WebView Integration**:
  - Opens Noqoody payment URL
  - Monitors URL changes to detect completion
  - Handles success/cancel/error URLs
  - Secure HTTPS connection
  - Loading indicators

- **Payment Flow**:
```
  1. Screen receives booking data (not booking ID)
  2. Call initiatePayment API → Get payment URL
  3. Open WebView with Noqoody payment page
  4. Customer enters card details on Noqoody
  5. Detect return URL (success/cancel)
  6. Call validatePayment API
  7. Backend verifies payment → Creates booking
  8. Navigate to BookingSuccess with new booking ID
```

- **Error Handling**:
  - Network failures: Show retry button
  - Payment failures: Clear message + retry
  - Payment cancellation: Option to retry or go back
  - WebView errors: Fallback to error state

- **User Experience**:
  - Clear progress indicators
  - Amount visible at all times
  - Secure payment badges
  - Helpful error messages
  - Easy retry mechanism
  - No orphaned bookings if payment fails

- **React Query**: Uses `useInitiatePayment`, `useValidatePayment`
- **Navigation**: 
  - Entry: From BookServiceScreen (online payment selected)
  - Exit Success: To BookingSuccess screen
  - Exit Failed: Back to BookServiceScreen or error state

---

### Favorites Tab
**Location**: `src/screens/favorites/`

#### `FavoritesScreen.tsx`
- **Purpose**: View saved favorites
- **Features**:
  - Filter tabs (All / Services / Providers)
  - Favorite cards with details
  - Remove favorite button
  - Pull-to-refresh
  - Empty state
- **React Query**: Uses `useFavorites`, `useRemoveFavorite`, `useRemoveProviderFavorite`
- **Performance**: Optimistic removal (instant UI update before API)

---

### Profile Tab
**Location**: `src/screens/profile/`

#### `ProfileScreen.tsx`
- **Purpose**: User profile and settings
- **Features**:
  - Profile avatar and name
  - Quick stats (bookings, favorites, reviews)
  - Menu items:
    - My Addresses
    - Edit Profile
    - Notifications
    - Favorites
  - Support section
  - Sign out button
  - App version
- **Guest State**: Shows login prompt if not authenticated

#### `EditProfileScreen.tsx`
- **Purpose**: Update user information
- **Features**:
  - Profile image upload
  - First name / Last name
  - Email (read-only)
  - Phone number
  - Image picker from gallery/camera
  - Cloudinary integration for uploads
- **Validation**: Email is read-only, phone formatting

---

### Address Screens
**Location**: `src/screens/addresses/`

#### `AddressesListScreen.tsx`
- **Purpose**: Manage saved addresses
- **Features**:
  - Address cards with label
  - Default address indicator (star)
  - Set default button
  - Edit/Delete actions
  - Pull-to-refresh
  - Empty state with add prompt
- **React Query**: Uses `useAddresses`, `useSetDefaultAddress`, `useDeleteAddress`
- **Performance**: Optimistic set default (instant star switch)

#### `AddAddressScreen.tsx`
- **Purpose**: Create new address
- **Features**:
  - Interactive map (React Native Maps)
  - GPS location button
  - Label (Home, Work, Other)
  - Street address
  - City, State, Postal Code, Country
  - Set as default toggle
  - Latitude/Longitude capture
- **Validation**: Required fields check

#### `EditAddressScreen.tsx`
- **Purpose**: Update existing address
- **Features**: Same as Add Address screen
- **Data Loading**: Fetches address by ID on mount

---

### Notifications Screen
**Location**: `src/screens/notifications/`

#### `NotificationsScreen.tsx`
- **Purpose**: View notification history
- **Features**:
  - Notification list with icons
  - Unread indicator (blue dot)
  - Mark as read on tap
  - Mark all as read button
  - **Payment confirmation notifications**
  - Time ago formatting ("5 min ago")
  - Navigation to booking details (if applicable)
  - Pull-to-refresh
  - Auto-refresh every 15s
- **React Query**: Uses `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`
- **Performance**: Optimistic mark as read, badge updates every 30s
- **Notification Types**:
  - Booking updates (created, accepted, completed, etc.)
  - **Payment received** (successful online payment)
  - Verification status updates

---

## 🧩 Components

### Common Components
**Location**: `src/components/common/`

#### `Button.tsx`
- Reusable button with variants (primary, secondary, outline)
- Loading state with spinner
- Disabled state

#### `Input.tsx`
- Text input with label
- Error message display
- Icon support
- Secure text entry toggle (for passwords)

#### `LoadingScreen.tsx`
- Full-screen loading spinner
- Used during initial auth check

### Booking Components
**Location**: `src/components/booking/`

#### `CalendarPicker.tsx`
- Custom calendar component
- Month navigation
- Date selection
- Disabled dates support
- Min/Max date constraints
- Today indicator

#### `TimeSlotPicker.tsx`
- Time slot grid display
- Available/unavailable states
- Selected state highlighting
- Formatted time display (12-hour format)

#### `DateTimePicker.tsx`
- Native date/time picker wrapper
- iOS/Android compatibility
- Modal presentation

### Service Components
**Location**: `src/components/services/`

#### `ServiceCard.tsx`
- **Main Card**: Full-width service card for lists
  - Service image with fallback
  - Price badge
  - Category badge
  - Duration badge
  - Rating badge
  - Provider info
  - Favorite button
- **Compact Card**: Horizontal scrolling card
  - Smaller size for carousels
  - Essential info only

### Favorite Components
**Location**: `src/components/favorites/`

#### `FavoriteCard.tsx`
- Displays favorited service or provider
- Image with gradient overlay
- Price badge
- Favorite button (heart)
- Category badge
- Provider information
- Meta info (duration, rating)

---

## 🔄 State Management

### Context Providers
**Location**: `src/context/`

#### `AuthContext.tsx`
- **Purpose**: Global authentication state
- **Provides**:
  - `user`: Current user object or null
  - `loading`: Auth check in progress
  - `isAuthenticated`: Boolean flag
  - `signIn(email, password)`: Login function
  - `signUp(data)`: Registration function
  - `signOut()`: Logout function
  - `updateProfile(data)`: Update user info
  - `refreshMe()`: Refresh user data
- **Features**:
  - Token storage with AsyncStorage
  - Auto-login on app start
  - User status polling (every 30s)
  - Suspension check
  - App state monitoring (foreground/background)
  - Push token registration

#### `BookingContext.tsx`
- **Purpose**: Temporary booking form state
- **Provides**:
  - `bookingData`: Current booking form data
  - `updateBookingData(data)`: Update form
  - `resetBookingData()`: Clear form
- **Usage**: Holds ephemeral data during booking flow
- **Note**: Does NOT store payment data (passed via navigation)

### React Query Hooks
**Location**: `src/hooks/`

All custom hooks follow React Query patterns for:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

#### `useBookings.ts`
- `useBookings()`: Fetch all bookings (5min cache)
- `useBooking(id)`: Fetch single booking (3min cache)
- `useCreateBooking()`: Create with optimistic update
- `useUpdateBookingStatus()`: Update with optimistic update
- `useCancelBooking()`: Cancel with optimistic update
- `useCanReviewBooking(id)`: Check review eligibility (2min cache)
- `useBookingsReviewEligibility(ids[])`: Batch check
- `usePrefetchBooking()`: Prefetch before navigation

#### `usePayments.ts` (NEW)
- `usePaymentStatus(bookingId, enabled)`: Get payment info for booking (1min cache)
- `useInitiatePayment()`: Start payment flow (no booking created yet)
  - Input: Booking data (service, date, time, addons, etc.)
  - Output: Payment URL, transaction reference
  - No cache (mutation)
- `useValidatePayment()`: Validate payment after return from Noqoody
  - Input: Transaction reference
  - Output: Booking ID (if payment successful)
  - Invalidates bookings cache on success
  - No cache (mutation)

#### `useServices.ts`
- `useServices(filters)`: List services (5min cache)
- `useService(id)`: Single service (5min cache)
- `usePrefetchService()`: Prefetch before navigation

#### `useCategories.ts`
- `useHomeCategoryPills(limit)`: Home pills (10min cache)

#### `useProviders.ts`
- `useProviders(limit)`: List providers (5min cache)
- `useProvider(id)`: Single provider (5min cache)
- `usePrefetchProvider()`: Prefetch before navigation

#### `useNotifications.ts`
- `useNotifications(options)`: List notifications (2min cache, auto-refetch 15s)
- `useUnreadNotificationsCount()`: Badge count (1min cache, auto-refetch 30s)
- `useMarkNotificationRead()`: Optimistic update
- `useMarkAllNotificationsRead()`: Optimistic update
- `useDeleteNotification()`: Optimistic removal

#### `useSearch.ts`
- `useSearch(filters)`: Unified search (30s cache)
- `useCategories()`: All categories (10min cache)
- `useFeaturedResults(mode)`: Popular content

#### `useFavorites.ts`
- `useFavorites(type?)`: List favorites (2min cache)
- `useToggleFavorite()`: Service favorite (optimistic)
- `useRemoveFavorite()`: Service removal (optimistic)
- `useToggleProviderFavorite()`: Provider favorite (optimistic)
- `useRemoveProviderFavorite()`: Provider removal (optimistic)

#### `useAddresses.ts`
- `useAddresses()`: List addresses (5min cache)
- `useAddress(id)`: Single address from cache
- `useCreateAddress()`: Create new
- `useUpdateAddress()`: Update with optimistic update
- `useSetDefaultAddress()`: Set default (optimistic, instant star)
- `useDeleteAddress()`: Delete with optimistic removal

---

## 🌐 Services & API

**Location**: `src/services/`

All API calls go through `api.ts` which uses Axios with:
- Base URL from `src/constants/config.ts`
- JWT token interceptor (auto-adds from AsyncStorage)
- 60s timeout (for cold starts on cloud hosting)
- Error response interceptor

### Core Services

#### `api.ts`
- Axios instance configuration
- Request interceptor: Adds JWT token
- Response interceptor: Handles 401 (token expired)

#### `auth.ts` (via AuthContext)
- Login: `POST /auth/login`
- Register: `POST /auth/register`
- Get Me: `GET /auth/me`

#### `services.ts`
- List services: `GET /services`
- Get service: `GET /services/:id`
- Get by provider: `GET /services/provider/:id`

#### `bookings.ts`
- Create booking: `POST /bookings` (cash payment only)
- My bookings: `GET /bookings/me`
- Get booking: `GET /bookings/:id`
- Update status: `PATCH /bookings/:id/status`
- Cancel: `cancelBooking()` helper

#### `payments.ts` (NEW)
**Payment API Service**
```typescript
// Initiate payment (before booking creation)
POST /api/v1/payments/initiate
Body: {
  service_id, scheduled_date, scheduled_time,
  address_id?, addons?, customer_notes?
}
Response: {
  success, transactionId, transactionReference,
  paymentUrl, sessionId, uuid
}

// Validate payment (creates booking if successful)
GET /api/v1/payments/validate/:transactionReference
Response: {
  success, status: 'completed' | 'pending' | 'failed',
  message, bookingId?
}

// Get payment status for booking
GET /api/v1/payments/booking/:bookingId/status
Response: {
  hasPayment, paymentMethod, paymentStatus,
  transaction?: PaymentTransaction
}
```

**Key Interfaces**:
```typescript
interface PaymentTransaction {
  id: string;
  booking_id?: string;  // NULL until payment completes
  transaction_reference: string;  // PAY-2026-00000001
  provider: 'cash' | 'noqoody';
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_url?: string;
  created_at: string;
}

interface InitiatePaymentResponse {
  success: boolean;
  transactionId: string;
  transactionReference: string;
  paymentUrl?: string;
  message?: string;
}

interface ValidatePaymentResponse {
  success: boolean;
  status: 'completed' | 'pending' | 'failed';
  message: string;
  bookingId?: string;  // Only present if payment successful
}
```

**Payment Flow in App**:
1. User completes booking form → Selects "Pay Online"
2. Call `initiatePayment(bookingData)` → Get payment URL
3. Navigate to PaymentProcessingScreen with payment URL
4. User pays on Noqoody
5. WebView detects return
6. Call `validatePayment(transactionReference)`
7. Backend creates booking → Returns booking ID
8. Navigate to BookingSuccess with booking ID

#### `categories.ts`
- Get categories: `GET /categories`
- Home pills: Returns "All" + top 6 + "More"

#### `favorites.ts`
- List favorites: `GET /favorites`
- Toggle service: `POST /favorites/:serviceId/toggle`
- Remove service: `DELETE /favorites/:serviceId`
- Toggle provider: `POST /favorites/provider/:providerId/toggle`
- Remove provider: `DELETE /favorites/provider/:providerId`
- Get status: `GET /favorites/status/:serviceId` or `GET /favorites/provider/status/:providerId`

#### `notifications.ts`
- List: `GET /notifications`
- Mark read: `PATCH /notifications/:id/read`
- Mark all read: `PATCH /notifications/read-all`
- **Types**: Includes `payment_received` for successful payments

#### `addresses.ts`
- List: `GET /addresses`
- Create: `POST /addresses`
- Update: `PATCH /addresses/:id`
- Delete: `DELETE /addresses/:id`
- Set default: `PATCH /addresses/:id` with `{ is_default: true }`

#### `availability.ts`
- Get slots: `GET /availability/provider/:id/slots?date=YYYY-MM-DD&serviceDuration=60`

#### `profile.ts`
- Update profile: `PATCH /auth/me` (or `/profile/me` depending on backend)

#### `upload.ts`
- Upload image: `POST /upload/image` (multipart/form-data)
- Returns: `{ url: string, public_id: string }`

#### `search.ts`
- Search: `GET /search?query=...&categoryId=...&limit=...&offset=...`

#### `pushNotifications.ts`
- Register for push: Expo Notifications API
- Save token: `PATCH /auth/push-token` (or similar)

#### `location.ts`
- Get current GPS coordinates using Expo Location

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (installed via `npx`)
- Expo Go app (for testing on physical device)
- iOS Simulator or Android Emulator (optional)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd servio-customer-main

# Install dependencies
npm install

# Install React Native WebView (for payments)
npx expo install react-native-webview

# Start development server
npx expo start
```

### Running the App
```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web (limited functionality)
npm run web

# Run with Expo Go (scan QR code)
npx expo start
```

---

## ⚙️ Environment Configuration

### Backend URL Configuration
**File**: `src/constants/config.ts`
```typescript
// Production backend (deployed)
export const API_URL = 'https://your-backend.com/api/v1';

// Local development options:
// iOS Simulator
// export const API_URL = 'http://localhost:5000/api/v1';

// Android Emulator
// export const API_URL = 'http://10.0.2.2:5000/api/v1';

// Physical Device (use your computer's local IP)
// export const API_URL = 'http://192.168.1.100:5000/api/v1';
```

**Important**: 
- Update `API_URL` to match your backend deployment
- For local development, use your machine's IP address (not localhost)
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Payment Configuration (NEW)

The mobile app requires proper backend configuration for payments to work:

**Backend Environment Variables** (set on your server):
```bash
# For Expo Go Development
MOBILE_APP_URL=http://localhost:8081
# Or your local IP
MOBILE_APP_URL=http://192.168.1.100:8081

# For Production (Standalone Build)
MOBILE_APP_URL=servio://payment
```

**Deep Linking Setup** (for production builds):

**File**: `app.json`
```json
{
  "expo": {
    "scheme": "servio",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "servio",
              "host": "payment"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "associatedDomains": ["applinks:yourdomain.com"]
    }
  }
}
```

**Important Payment Notes**:
- **Expo Go**: Cannot use custom deep links (`servio://`), use `http://` URLs
- **Development**: Use `http://localhost:8081` or `http://YOUR_IP:8081`
- **Production**: Use custom scheme `servio://payment` (requires standalone build)

### Push Notifications Setup

**File**: `app.json`
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6366f1"
        }
      ]
    ]
  }
}
```

**Backend Setup Required**:
- Backend must save `fcm_token` from mobile app
- Backend must use Expo Push API to send notifications
- See `src/services/pushNotifications.ts` for client implementation

---

## 📦 Build & Deploy

### Development Build (with Expo Go)
```bash
# No build needed - just run
npx expo start
# Scan QR code with Expo Go app

# ⚠️ Payment Limitation: 
# Expo Go doesn't support custom deep links
# Payment return URL must be http:// based
```

### Production Build (EAS Build)

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Configure EAS
```bash
eas login
eas build:configure
```

#### 3. Update app.json for Production
```json
{
  "expo": {
    "scheme": "servio",  // ✅ Required for payment deep links
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.servio",
      "versionCode": 1,
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{"scheme": "servio", "host": "payment"}],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.servio",
      "buildNumber": "1.0.0"
    }
  }
}
```

#### 4. Build for Android
```bash
# Development build
eas build --profile development --platform android

# Production APK
eas build --profile production --platform android

# Production AAB (for Play Store)
eas build --profile production --platform android --auto-submit
```

#### 5. Build for iOS
```bash
# Development build
eas build --profile development --platform ios

# Production build (requires Apple Developer account)
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

### EAS Configuration
**File**: `eas.json`
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### App Configuration
**File**: `app.json`

**Important Settings**:
- `name`: App display name
- `slug`: URL-safe identifier
- `version`: Semantic version (1.0.0)
- `scheme`: Custom URL scheme for deep linking (`servio`)
- `bundleIdentifier` (iOS): Unique identifier (com.yourcompany.app)
- `package` (Android): Unique identifier (com.yourcompany.app)
- `icon`: App icon (1024x1024)
- `splash`: Splash screen

**Permissions**:
- `ACCESS_FINE_LOCATION`: For address GPS coordinates
- `ACCESS_COARSE_LOCATION`: For address GPS coordinates
- `NOTIFICATIONS`: For push notifications
- `INTERNET`: For API calls and payment WebView

---

## 🔑 Key Technical Decisions

### 1. React Query for State Management
**Why**: 
- Eliminates ~500 lines of manual state code
- Automatic caching (5min for most data)
- Optimistic updates (instant UI)
- Background sync when app foregrounded
- 90% fewer API calls

**Result**: 
- ServiceDetailsScreen: 4.5s → 0.1s load time
- ProviderDetailsScreen: 2.5s → 0.1s load time
- All screens: Instant on second visit (cached)

### 2. Debounced Search
**Implementation**: 300ms delay after user stops typing
**Result**: Search API calls reduced by 90%

### 3. Prefetching
**Strategy**: Prefetch data before navigation
**Example**:
```typescript
// User taps service card
prefetchService(serviceId);  // Start loading in background
navigation.navigate('ServiceDetails', { serviceId });
// Screen opens with data already loaded!
```

### 4. Manual Form State for Booking
**Why**: Booking flow is ephemeral (temporary)
**Result**: Form state stays in component, data queries use React Query

### 5. Optimistic Updates
**Used For**: Favorites, Notifications, Addresses, Bookings
**How**: Update UI immediately, rollback if API fails
**Result**: Instant perceived performance

### 6. Payment-First Booking Design (NEW)
**Why**: Prevent orphaned bookings from failed payments
**How**: 
- Online payment: Create payment → Pay → Create booking
- Cash payment: Create booking immediately
**Result**: 
- Clean database (no failed payment bookings)
- Better UX (no cleanup needed)
- Simpler refund process

### 7. WebView for Payment Gateway (NEW)
**Why**: Seamless in-app payment without leaving app
**Security**: HTTPS-only, no card data storage
**Result**: Native-like payment experience

---

## 📊 Performance Metrics

| Screen | Before React Query | After React Query |
|--------|-------------------|-------------------|
| ServiceDetailsScreen | 4.5s | 0.1s (with prefetch) |
| ProviderDetailsScreen | 2.5s | 0.1s (with prefetch) |
| BookingsScreen | 2s | 0ms (cached) |
| HomeScreen | 3s | 0.5s (first load), 0ms (cached) |
| ExploreScreen | Variable | Debounced (90% fewer calls) |
| PaymentProcessingScreen | N/A | <1s initiation, <2s validation |
| Any cached screen | Fresh load | 0ms (instant) |

**Cache Strategy**:
- Bookings: 5min stale, 10min garbage collection
- Services: 5min stale, 10min garbage collection
- Categories: 10min stale, 30min garbage collection
- Notifications: 2min stale, auto-refetch every 30s
- Favorites: 2min stale
- Addresses: 5min stale
- **Payments**: 1min stale (payment status), mutations not cached

---

## 🐛 Common Issues

### Issue: Cannot connect to backend
**Solution**: 
1. Check `API_URL` in `src/constants/config.ts`
2. Use device IP (not localhost) for physical devices
3. Ensure backend is running and accessible

### Issue: Payment WebView not loading
**Solution**:
1. Verify `react-native-webview` is installed: `npx expo install react-native-webview`
2. Check payment URL is valid HTTPS
3. Ensure backend Noqoody credentials are correct
4. Test on physical device (WebView works better than emulator)
5. Check network connectivity

### Issue: Payment return URL not working (Expo Go)
**Solution**:
1. **Expo Go doesn't support custom deep links**
2. Backend must use `http://` URLs for development:
```bash
   MOBILE_APP_URL=http://localhost:8081
   # Or
   MOBILE_APP_URL=http://192.168.1.100:8081
```
3. For production, create standalone build with custom scheme

### Issue: Payment succeeds but booking not created
**Solution**:
1. Check `payment_transactions` table in database
2. Verify `payment_logs` for error details
3. Ensure customer has valid email/phone in database
4. Check backend logs for validation errors
5. Verify booking data in `gateway_request_payload`

### Issue: Push notifications not working
**Solution**:
1. Check `fcm_token` is saved in backend
2. Test with Expo Push Notification Tool
3. Verify app has notification permissions

### Issue: Maps not loading
**Solution**:
1. Ensure location permissions granted
2. Check Google Maps API key (if required)
3. Test on physical device (not all emulators support maps)

### Issue: Images not uploading
**Solution**:
1. Check Cloudinary credentials in backend
2. Verify image picker permissions
3. Check file size limits

---

## 🔐 Security Best Practices

### Payment Security
- ✅ No credit card data stored in app
- ✅ HTTPS-only WebView for payments
- ✅ Payment URLs expire after 30 minutes
- ✅ Transaction validation on backend
- ✅ HMAC signature verification (backend)
- ✅ JWT authentication for payment APIs

### Data Protection
- ✅ JWT tokens stored securely (AsyncStorage)
- ✅ Auto logout on token expiry
- ✅ Input validation on forms
- ✅ Secure API communication (HTTPS)
- ✅ No sensitive data in logs

---

## 📈 Payment Flow Diagram
```
Customer App                Backend API              Noqoody Gateway
     │                           │                         │
     │  1. Select "Pay Online"   │                         │
     ├──────────────────────────>│                         │
     │                           │                         │
     │  2. POST /payments/       │                         │
     │     initiate (booking     │  3. Generate payment    │
     │     data)                 ├────────────────────────>│
     │                           │                         │
     │                           │  4. Payment URL         │
     │  5. Payment URL           │<────────────────────────│
     │<──────────────────────────│                         │
     │                           │                         │
     │  6. Open WebView          │                         │
     │     (Noqoody page)        │                         │
     ├───────────────────────────────────────────────────>│
     │                           │                         │
     │  7. Customer pays         │                         │
     │───────────────────────────────────────────────────>│
     │                           │                         │
     │  8. Return to app         │                         │
     │<───────────────────────────────────────────────────│
     │                           │                         │
     │  9. GET /payments/        │                         │
     │     validate/:ref         │ 10. Verify payment      │
     ├──────────────────────────>├────────────────────────>│
     │                           │                         │
     │                           │ 11. Payment confirmed   │
     │                           │<────────────────────────│
     │                           │                         │
     │                           │ 12. Create booking      │
     │                           │     (in database)       │
     │                           │                         │
     │ 13. Booking ID            │                         │
     │<──────────────────────────│                         │
     │                           │                         │
     │ 14. Show success          │                         │
     │                           │                         │
```

---

## Support

**Key Files for Reference**:
- Backend API docs: See backend README
- Navigation types: `src/navigation/types.ts`
- API services: `src/services/`
- React Query config: `src/utils/queryClient.ts`
- Payment services: `src/services/payments.ts`
- Payment hooks: `src/hooks/usePayments.ts`
- Payment screen: `src/screens/payments/PaymentProcessingScreen.tsx`

