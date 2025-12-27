// src/services/search.ts

import api from './api';

export interface SearchParams {
  query?: string;
  categoryId?: string;
  providerId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  services: any[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function searchServices(params: SearchParams): Promise<SearchResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append('search', params.query);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.providerId) queryParams.append('providerId', params.providerId);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const res = await api.get(`/services?${queryParams.toString()}`);
  return res.data;
}