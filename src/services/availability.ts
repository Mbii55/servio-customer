// src/services/availability.ts
import api from './api';

export type ProviderSlotsResponse = {
  provider_id: string;
  date: string; // YYYY-MM-DD
  service_duration_minutes: number;
  buffer_time_minutes: number;
  slots: string[]; // ["09:00", "10:30", ...]
  message?: string;
};

export async function getProviderSlotsForDate(params: {
  providerId: string;
  date: string; // YYYY-MM-DD
  serviceDuration: number; // minutes
}): Promise<ProviderSlotsResponse> {
  const res = await api.get<ProviderSlotsResponse>(
    `/availability/provider/${params.providerId}/slots`,
    {
      params: {
        date: params.date,
        serviceDuration: String(params.serviceDuration),
      },
    }
  );
  return res.data;
}
