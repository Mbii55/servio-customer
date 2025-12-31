// src/hooks/useSearch.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryClient';
import api from '../services/api';

export type SearchMode = 'services' | 'shops';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  mode: SearchMode;
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  services: {
    items: any[];
    total: number;
  };
  providers: {
    items: any[];
    total: number;
  };
}

/**
 * Hook: Unified search for services and providers with caching
 * @param filters - Search filters (query, categoryId, mode, limit, offset)
 * @param enabled - Whether to run the query
 */
export function useSearch(filters: SearchFilters, enabled: boolean = true) {
  const key = {
    q: (filters.query || '').trim(),
    categoryId: filters.categoryId || null,
    mode: filters.mode,
    limit: filters.limit ?? 20,
    offset: filters.offset ?? 0,
  };

  return useQuery({
    queryKey: ['search', key],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (key.q) params.append('query', key.q);
      if (key.categoryId && key.mode === 'services') params.append('categoryId', key.categoryId);

      params.append('limit', String(key.limit));
      params.append('offset', String(key.offset));

      const res = await api.get(`/search?${params.toString()}`);
      const data = res.data;

      return {
        services: {
          items: data.services?.items || [],
          total: data.services?.total || 0,
        },
        providers: {
          items: data.providers?.items || [],
          total: data.providers?.total || 0,
        },
      } as SearchResults;
    },
    enabled,

    // ✅ Search should be fairly fresh, but not aggressive
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    refetchOnReconnect: true,
  });
}


/**
 * Hook: Fetch all categories with caching
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: async () => {
      const res = await api.get('/categories');
      const cats = (res.data?.data ?? res.data ?? []) as any[];
      return Array.isArray(cats) ? cats.filter((c) => c?.id && c?.name) : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change rarely)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook: Featured/Popular results (for non-search view)
 * Uses cached search results with no filters
 */
export function useFeaturedResults(mode: SearchMode) {
  return useSearch(
    {
      mode,
      limit: 10,
      offset: 0,
    },
    true
  );
}