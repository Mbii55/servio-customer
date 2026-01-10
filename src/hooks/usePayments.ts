// src/hooks/usePayments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import {
  initiatePayment,
  validatePayment,
  getPaymentStatus,
} from '../services/payments';

/**
 * Hook: Get payment status for a booking
 */
export function usePaymentStatus(bookingId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.bookings.detail(bookingId || ''), 'payment-status'],
    queryFn: () => {
      if (!bookingId) throw new Error('Booking ID required');
      return getPaymentStatus(bookingId);
    },
    enabled: !!bookingId && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * ✅ UPDATED: Initiate payment with booking data (not booking ID)
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: (bookingData: {
      service_id: string;
      scheduled_date: string;
      scheduled_time: string;
      address_id?: string;
      addons?: { addon_id: string; quantity?: number }[];
      customer_notes?: string;
    }) => initiatePayment(bookingData),
    // No invalidation needed - booking doesn't exist yet
  });
}

/**
 * Hook: Validate payment after user returns from Noqoody
 * ✅ This triggers booking creation on backend
 */
export function useValidatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionReference: string) => validatePayment(transactionReference),
    
    onSuccess: () => {
      // Invalidate all bookings data after booking is created
      invalidateQueries.bookings();
    },
  });
}