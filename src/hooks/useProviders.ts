// src/hooks/useProviders.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryClient';
import api from '../services/api';

/**
 * Hook: Fetch providers list with caching
 * @param limit - Number of providers to fetch
 */
export function useProviders(limit: number = 6) {
  return useQuery({
    queryKey: [...queryKeys.providers.all, 'list', { limit }],
    queryFn: async () => {
      const res = await api.get('/search', { params: { limit } });
      return res.data.providers?.items || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Fetch single provider details
 * @param providerId - Provider ID to fetch
 * @param enabled - Whether to run the query
 */
export function useProvider(providerId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.providers.detail(providerId || ''),
    queryFn: async () => {
      if (!providerId) throw new Error('Provider ID required');
      const res = await api.get(`/providers/${providerId}`);
      return res.data;
    },
    enabled: !!providerId && enabled,

    staleTime: 60 * 1000,          // 1 min (instead of 5)
    refetchOnMount: 'always',      // ✅ ensures latest when entering details
    refetchOnReconnect: true,
  });
}


/**
 * Helper: Prefetch provider details before navigation
 */
export function usePrefetchProvider() {
  const queryClient = useQueryClient();

  return (providerId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.providers.detail(providerId),
      queryFn: async () => {
        const res = await api.get(`/providers/${providerId}`);
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}