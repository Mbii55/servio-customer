# Servio Customer Mobile App

A React Native mobile application built with **Expo**, connecting customers with local service providers

## Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)

---

## Overview

The **Servio Customer App** allows users to:
- Browse services by category
- Search for services and providers
- Book services with scheduling
- Manage addresses for service delivery
- Track bookings in real-time
- Leave reviews after service completion
- Save favorite services and providers
- Receive push notifications

**Companion Apps:**
- Service Provider Portal
- Admin Panel
- Backend API

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | ~54.0 | Development and build tooling |
| **TypeScript** | ~5.9 | Type-safe development |
| **React Query** | ^5.90 | Server state management & caching |
| **React Navigation** | ^7.1 | Navigation library |
| **Axios** | ^1.13 | HTTP client |
| **Expo Notifications** | ~0.32 | Push notifications |

---

## Key Features

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

### 4. **Favorites**
- Save favorite services and providers
- Quick access from favorites screen
- Optimistic UI updates

### 5. **Notifications**
- Push notifications for booking updates
- In-app notification history
- Unread count badge
- Mark as read functionality

### 6. **Reviews**
- Rate services (1-5 stars)
- Leave comments
- Only for completed bookings
- One review per booking

### 7. **React Query Caching**
- Instant screen loads with prefetching
- Optimistic updates for mutations
- Automatic background sync
- Smart cache invalidation

---

## Getting Started

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

# Install WebView for payments
npx expo install react-native-webview

# Start development server
npx expo start
```

### Running the App

```bash
# Start Expo development server
npm start

# Run with Expo Go (scan QR code)
npx expo start
