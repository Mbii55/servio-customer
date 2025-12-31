// src/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryClient';
import { getHomeCategoryPills, HomeCategoryPill, ALL_CATEGORY_ID } from '../services/categories';

/**
 * Hook: Fetch home category pills with caching
 * @param limit - Number of categories to fetch (default: 6)
 */
export function useHomeCategoryPills(limit: number = 6) {
  return useQuery({
    queryKey: [...queryKeys.categories.lists(), { limit }],
    queryFn: async () => {
      try {
        return await getHomeCategoryPills(limit);
      } catch {
        // Fallback to default pills if fetch fails
        return [
          { kind: 'all', id: ALL_CATEGORY_ID, name: 'All', icon: null },
          { kind: 'more', id: 'more', name: 'More', icon: null },
        ] as HomeCategoryPill[];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}