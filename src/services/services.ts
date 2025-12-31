// src/services/services.ts
import api from './api';
import { Service } from '../types';

export type ListServicesParams = {
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
};

export async function listServices(params: ListServicesParams = {}) {
  const res = await api.get<{ services: Service[] } | Service[]>('/services', {
    params,
  });

  // Support either { services: [] } or direct []
  const data: any = res.data;
  const services: Service[] = Array.isArray(data) ? data : data.services ?? [];
  return services;
}

export async function getServiceById(serviceId: string) {
  const res = await api.get<{ service: Service } | Service>(`/services/${serviceId}`);
  const data: any = res.data;
  const service: Service = data.service ?? data;
  return service;
}

export async function getServicesByProviderPublic(providerId: string): Promise<Service[]> {
  const res = await api.get<Service[]>('/services', {
    params: { providerId, limit: 50, offset: 0 },
  });
  return res.data;
}
