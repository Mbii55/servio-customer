// src/hooks/useBookings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import {
  getMyBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  BookingStatus,
} from '../services/bookings';
import { Booking } from '../types';
import { CreateBookingInput } from '../types/booking';

/**
 * Hook: Fetch all user bookings with automatic caching
 * ✅ Auto-refetches when app comes to foreground
 * ✅ Caches for 5 minutes
 * ✅ Pull-to-refresh built-in
 */
export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.lists(),
    queryFn: getMyBookings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
}

/**
 * Hook: Fetch single booking by ID with caching
 * @param bookingId - Booking ID to fetch
 * @param enabled - Whether to run the query (default: true if bookingId exists)
 */
export function useBooking(bookingId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId || ''),
    queryFn: () => {
      if (!bookingId) throw new Error('Booking ID required');
      return getBookingById(bookingId);
    },
    enabled: !!bookingId && enabled,

    // ✅ Always get the latest when user opens details
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true, // works mainly on web, harmless on RN
  });
}


/**
 * Hook: Create new booking with optimistic updates
 * ✅ Instantly updates UI before server responds
 * ✅ Auto-invalidates bookings list
 * ✅ Rolls back on error
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingInput) => createBooking(data),
    
    // Optimistic update (instant UI)
    onMutate: async (newBooking) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.lists() });

      // Snapshot previous value
      const previousBookings = queryClient.getQueryData<Booking[]>(queryKeys.bookings.lists());

      // Optimistically update (with temporary ID)
      if (previousBookings) {
        const optimisticBooking: Booking = {
          id: 'temp-' + Date.now(),
          booking_number: 'PENDING...',
          status: 'pending',
          scheduled_date: newBooking.scheduled_date,
          scheduled_time: newBooking.scheduled_time,
          subtotal: '0', // Will be calculated by server
          created_at: new Date().toISOString(),
          // Add other required fields with temporary values
        } as Booking;

        queryClient.setQueryData<Booking[]>(
          queryKeys.bookings.lists(),
          [...previousBookings, optimisticBooking]
        );
      }

      return { previousBookings };
    },

    // On success: replace optimistic with real data
    onSuccess: (newBooking) => {
      queryClient.setQueryData<Booking[]>(
        queryKeys.bookings.lists(),
        (old) => {
          if (!old) return [newBooking];
          // Remove temp booking, add real one
          return [...old.filter(b => !b.id.startsWith('temp-')), newBooking];
        }
      );
    },

    // On error: rollback
    onError: (_error, _variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(queryKeys.bookings.lists(), context.previousBookings);
      }
    },

    // Always refetch to ensure consistency
    onSettled: () => {
      invalidateQueries.bookings();
    },
  });
}

/**
 * Hook: Update booking status (accept, reject, complete, etc.)
 * ✅ Optimistic UI update
 * ✅ Auto-invalidates affected queries
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      status,
      cancellation_reason,
      provider_notes,
    }: {
      bookingId: string;
      status: BookingStatus;
      cancellation_reason?: string;
      provider_notes?: string;
    }) => updateBookingStatus(bookingId, { status, cancellation_reason, provider_notes }),

    // Optimistic update
    onMutate: async ({ bookingId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.lists() });

      const previousBookings = queryClient.getQueryData<Booking[]>(queryKeys.bookings.lists());

      // Update status optimistically
      if (previousBookings) {
        queryClient.setQueryData<Booking[]>(
          queryKeys.bookings.lists(),
          previousBookings.map((booking) =>
            booking.id === bookingId ? { ...booking, status } : booking
          )
        );
      }

      return { previousBookings };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(queryKeys.bookings.lists(), context.previousBookings);
      }
    },

    onSettled: () => {
      invalidateQueries.bookings();
    },
  });
}

/**
 * Hook: Cancel booking (customer action)
 * ✅ Optimistic update
 * ✅ Auto-invalidates bookings
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      cancelBooking(bookingId, reason),

    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookings.lists() });

      const previousBookings = queryClient.getQueryData<Booking[]>(queryKeys.bookings.lists());

      if (previousBookings) {
        queryClient.setQueryData<Booking[]>(
          queryKeys.bookings.lists(),
          previousBookings.map((booking) =>
            booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
          )
        );
      }

      return { previousBookings };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(queryKeys.bookings.lists(), context.previousBookings);
      }
    },

    onSettled: () => {
      invalidateQueries.bookings();
    },
  });
}

/**
 * Hook: Check if user can review a booking
 * @param bookingId - Booking ID to check
 * @param enabled - Whether to run the query
 */
export function useCanReviewBooking(bookingId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.reviews.eligibility(bookingId || ''),
    queryFn: async () => {
      if (!bookingId) throw new Error('Booking ID required');
      const api = await import('../services/api');
      const response = await api.default.get(`/reviews/can-review/${bookingId}`);
      return response.data as { canReview: boolean };
    },
    enabled: !!bookingId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Only retry once for eligibility checks
  });
}

/**
 * Hook: Get review eligibility for multiple bookings (batch)
 * Useful for BookingsScreen to check all completed bookings at once
 */
export function useBookingsReviewEligibility(bookingIds: string[], enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.reviews.all, 'batch', bookingIds],
    queryFn: async () => {
      const api = await import('../services/api');
      const results: Record<string, boolean> = {};
      
      await Promise.all(
        bookingIds.map(async (id) => {
          try {
            const response = await api.default.get(`/reviews/can-review/${id}`);
            results[id] = response.data?.canReview || false;
          } catch {
            results[id] = false;
          }
        })
      );
      
      return results;
    },
    enabled: enabled && bookingIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Helper: Prefetch booking details before navigation
 * Call this before navigating to BookingDetailsScreen for instant load
 */
export function usePrefetchBooking() {
  const queryClient = useQueryClient();

  return (bookingId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bookings.detail(bookingId),
      queryFn: () => getBookingById(bookingId),
      staleTime: 3 * 60 * 1000,
    });
  };
}