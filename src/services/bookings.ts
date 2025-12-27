// src/services/bookings.ts
import api from './api';
import { Booking } from '../types';
import { CreateBookingInput } from '../types/booking';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export async function createBooking(data: CreateBookingInput): Promise<Booking> {
  const response = await api.post<Booking>('/bookings', data);
  return response.data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await api.get<Booking[]>('/bookings/me');
  return response.data;
}

export async function getBookingById(bookingId: string): Promise<Booking> {
  const response = await api.get<Booking>(`/bookings/${bookingId}`);
  return response.data;
}

/**
 * Generic status update (provider/admin can do more; customer can only cancel)
 * Backend route: PATCH /bookings/:id/status
 */
export async function updateBookingStatus(
  bookingId: string,
  payload: { status: BookingStatus; cancellation_reason?: string; provider_notes?: string }
): Promise<Booking> {
  const response = await api.patch<Booking>(`/bookings/${bookingId}/status`, payload);
  return response.data;
}

/**
 * Customer cancel (matches backend rule)
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
  return updateBookingStatus(bookingId, {
    status: 'cancelled',
    cancellation_reason: reason || 'Cancelled by customer',
  });
}
