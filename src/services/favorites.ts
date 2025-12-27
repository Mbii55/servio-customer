// src/services/favorites.ts

import api from './api';

export type FavoriteType = 'service' | 'provider';

export type FavoriteStatusResponse = {
  serviceId?: string;
  providerId?: string;
  is_favorite: boolean;
  type: FavoriteType;
};

export type ToggleFavoriteResponse = {
  serviceId?: string;
  providerId?: string;
  is_favorite: boolean;
  type: FavoriteType;
};

// List favorites with optional type filter
export async function getMyFavorites(type?: FavoriteType) {
  const params = type ? { type } : {};
  const res = await api.get('/favorites', { params });
  return res.data as any[];
}

// Service favorites
export async function getFavoriteStatus(serviceId: string) {
  const res = await api.get(`/favorites/status/${serviceId}`);
  return res.data as FavoriteStatusResponse;
}

export async function toggleFavorite(serviceId: string) {
  const res = await api.post(`/favorites/${serviceId}/toggle`);
  return res.data as ToggleFavoriteResponse;
}

export async function removeFavorite(serviceId: string) {
  const res = await api.delete(`/favorites/${serviceId}`);
  return res.data as { removed: boolean; type: FavoriteType };
}

// Provider favorites
export async function getProviderFavoriteStatus(providerId: string) {
  const res = await api.get(`/favorites/provider/status/${providerId}`);
  return res.data as FavoriteStatusResponse;
}

export async function toggleProviderFavorite(providerId: string) {
  const res = await api.post(`/favorites/provider/${providerId}/toggle`);
  return res.data as ToggleFavoriteResponse;
}

export async function removeProviderFavorite(providerId: string) {
  const res = await api.delete(`/favorites/provider/${providerId}`);
  return res.data as { removed: boolean; type: FavoriteType };
}