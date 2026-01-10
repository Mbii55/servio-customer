// src/services/payments.ts

import api from './api';

export interface PaymentTransaction {
  id: string;
  booking_id?: string; // ✅ NOW OPTIONAL (no booking before payment)
  transaction_reference: string;
  provider: 'cash' | 'noqoody';
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  payment_url?: string;
  session_id?: string;
  uuid?: string;
  created_at: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  transactionId: string;
  transactionReference: string;
  paymentUrl?: string;
  sessionId?: string;
  uuid?: string;
  message?: string;
}

export interface ValidatePaymentResponse {
  success: boolean;
  status: 'completed' | 'pending' | 'failed';
  message: string;
  bookingId?: string; // ✅ NEW: Booking ID returned after payment
}

/**
 * ✅ UPDATED: Initiate payment with booking data (NO booking created yet)
 */
export async function initiatePayment(bookingData: {
  service_id: string;
  scheduled_date: string;
  scheduled_time: string;
  address_id?: string;
  addons?: { addon_id: string; quantity?: number }[];
  customer_notes?: string;
}): Promise<InitiatePaymentResponse> {
  const response = await api.post<InitiatePaymentResponse>('/payments/initiate', bookingData);
  return response.data;
}

/**
 * Validate payment status after user returns from Noqoody
 * ✅ This creates the booking if payment successful
 */
export async function validatePayment(transactionReference: string): Promise<ValidatePaymentResponse> {
  const response = await api.get<ValidatePaymentResponse>(
    `/payments/validate/${transactionReference}`
  );
  return response.data;
}

/**
 * Get payment status for a booking
 */
export async function getPaymentStatus(bookingId: string): Promise<{
  hasPayment: boolean;
  transaction?: PaymentTransaction;
  paymentMethod?: string;
  paymentStatus?: string;
}> {
  const response = await api.get(`/payments/booking/${bookingId}/status`);
  return response.data;
}