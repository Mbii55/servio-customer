// src/types/booking.ts
export interface BookingFormData {
  serviceId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  addressId: string | null;
  selectedAddons: string[]; // addon IDs
  customerNotes?: string;
}

export interface BookingPreview {
  service: {
    id: string;
    title: string;
    base_price: string;
    duration_minutes: number | null;
  };
  provider: {
    name: string;
    logo?: string | null;
  };
  date: string;
  time: string;
  address: {
    id: string;
    label: string;
    street_address: string;
    city: string;
  } | null;
  addons: Array<{
    id: string;
    name: string;
    price: string;
  }>;
  pricing: {
    servicePrice: number;
    addonsPrice: number;
    subtotal: number;
  };
}

export interface CreateBookingInput {
  service_id: string;
  address_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  addons?: { addon_id: string; quantity?: number }[];
  payment_method?: 'cash' | 'card' | 'wallet';
  customer_notes?: string;
}