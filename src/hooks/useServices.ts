// src/hooks/useServices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import { listServices, getServiceById } from '../services/services';
import { Service } from '../types';

/**
 * Hook: Fetch all services with filters and caching
 * @param filters - Optional filters (category, search, limit, offset)
 */
export function useServices(filters?: {
  category_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.services.list(filters),
    queryFn: () => listServices(filters || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Fetch single service by ID
 * @param serviceId - Service ID to fetch
 * @param enabled - Whether to run the query
 */
export function useService(serviceId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.services.detail(serviceId || ''),
    queryFn: () => {
      if (!serviceId) throw new Error('Service ID required');
      return getServiceById(serviceId);
    },
    enabled: !!serviceId && enabled,

    // ✅ Details should be fresh when user opens it
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  });
}


/**
 * Helper: Prefetch service details before navigation
 */
export function usePrefetchService() {
  const queryClient = useQueryClient();

  return (serviceId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.services.detail(serviceId),
      queryFn: () => getServiceById(serviceId),
      staleTime: 5 * 60 * 1000,
    });
  };
}