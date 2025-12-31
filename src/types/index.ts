// src/types/index.ts
export interface User {
  id: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  profile_image?: string;
  created_at: string;
  updated_at?: string;
}

export type Service = {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string;
  base_price: string;
  duration_minutes: number | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  provider?: ProviderSummary;
};


export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceAddon {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  address_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  service_price: string;
  addons_price: string;
  subtotal: string;
  commission_amount: string;
  provider_earnings: string;
  payment_method: 'cash' | 'card' | 'wallet';
  payment_status: 'pending' | 'paid' | 'refunded';
  customer_notes: string | null;
  provider_notes: string | null;
  cancellation_reason: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional nested objects from API response
  address?: Address | null;
  service?: Service;
  provider?: ProviderSummary;
  // Optional flattened properties from API response
  service_title?: string;
  provider_business_name?: string;
  provider_business_logo?: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type ProviderSummary = {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  profile_image?: string | null;

  business_profile: {
    business_name?: string | null;
    business_logo?: string | null;
    business_description?: string | null;
    business_email?: string | null;
    business_phone?: string | null;

    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;

    latitude?: string | null;
    longitude?: string | null;
  } | null;
};


export interface AuthResponse {
  token: string;
  user: User;
}