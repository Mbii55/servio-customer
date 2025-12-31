// src/utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

/**
 * Focus Manager for React Native
 * Automatically refetches queries when app comes to foreground
 */
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    if (status === 'active') {
      queryClient.refetchQueries({ type: 'active' });
    }
  }
}

/**
 * React Query Client Configuration
 * Optimized for React Native with Expo
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Cache Management
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (was cacheTime in v4)
      
      // ✅ Automatic Refetching
      refetchOnMount: true, // Refetch when component mounts if data is stale
      refetchOnWindowFocus: true, // Refetch when app comes to foreground
      refetchOnReconnect: true, // Refetch when internet reconnects
      
      // ✅ Background Updates
      refetchInterval: false, // Disable automatic polling (we'll use manual refresh)
      // If you want auto-polling: refetchInterval: 30000 (30 seconds)
      
      // ✅ Retry Logic
      retry: 2, // Retry failed requests 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // ✅ Network Mode
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      // ✅ Mutation Settings
      retry: 1, // Retry failed mutations once
      networkMode: 'online',
    },
  },
});

/**
 * Setup focus manager for React Native
 * Call this in your App.tsx after QueryClientProvider
 */
export function setupQueryClientFocusManager() {
  const subscription = AppState.addEventListener('change', onAppStateChange);
  
  return () => {
    subscription.remove();
  };
}

/**
 * Query Keys Factory
 * Centralized query key management for consistency
 */
export const queryKeys = {
  // Bookings
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters?: { status?: string }) => 
      [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
  },
  
  // Services
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters?: { category?: string; search?: string }) =>
      [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
  },
  
  // Favorites
  favorites: {
    all: ['favorites'] as const,
    lists: () => [...queryKeys.favorites.all, 'list'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  
  // Addresses
  addresses: {
    all: ['addresses'] as const,
    lists: () => [...queryKeys.addresses.all, 'list'] as const,
  },
  
  // Reviews
  reviews: {
    all: ['reviews'] as const,
    eligibility: (bookingId: string) => [...queryKeys.reviews.all, 'eligibility', bookingId] as const,
  },
  
  // Provider
  providers: {
    all: ['providers'] as const,
    details: () => [...queryKeys.providers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.providers.details(), id] as const,
  },
};

/**
 * Helper: Invalidate related queries after mutations
 */
export const invalidateQueries = {
  // Invalidate bookings after create/update/cancel
  bookings: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  
  // Invalidate favorites after add/remove
  favorites: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all }),
  
  // Invalidate notifications after read/delete
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  
  // Invalidate addresses after add/edit/delete
  addresses: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all }),
};

/**
 * Helper: Prefetch data before navigation
 * Example: await prefetchBookingDetails(bookingId) before navigating to details screen
 */
export const prefetchQueries = {
  bookingDetails: (bookingId: string) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.bookings.detail(bookingId),
      queryFn: async () => {
        const { getBookingById } = await import('../services/bookings');
        return getBookingById(bookingId);
      },
    }),
};