// src/services/addresses.ts
import api from './api';
import { Address } from '../types';

export interface CreateAddressInput {
  label: string;
  street_address: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {}

export async function getMyAddresses(): Promise<Address[]> {
  const response = await api.get<Address[]>('/addresses/me');
  return response.data;
}

export async function createAddress(data: CreateAddressInput): Promise<Address> {
  const response = await api.post<Address>('/addresses', data);
  return response.data;
}

export async function updateAddress(
  addressId: string,
  data: UpdateAddressInput
): Promise<Address> {
  const response = await api.patch<Address>(`/addresses/${addressId}`, data);
  return response.data;
}

export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/addresses/${addressId}`);
}

/**
 * ✅ IMPORTANT:
 * Backend does NOT have POST /addresses/:id/default
 * Backend DOES support PATCH /addresses/:id with { is_default: true }
 */
export async function setDefaultAddress(addressId: string): Promise<Address> {
  const response = await api.patch<Address>(`/addresses/${addressId}`, {
    is_default: true,
  });
  return response.data;
}
