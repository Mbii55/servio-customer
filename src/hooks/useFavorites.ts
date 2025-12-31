// src/hooks/useFavorites.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import {
  getMyFavorites,
  toggleFavorite,
  removeFavorite,
  toggleProviderFavorite,
  removeProviderFavorite,
  FavoriteType,
} from '../services/favorites';

type AnyFav = any;

/**
 * Helper: snapshot + rollback all favorites list queries (because you use options in the key)
 */
function snapshotFavoritesLists(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueriesData<AnyFav[]>({
    queryKey: queryKeys.favorites.lists(),
  });
}

function rollbackSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots?: Array<[unknown, AnyFav[] | undefined]>
) {
  if (!snapshots) return;
  snapshots.forEach(([key, data]) => {
    queryClient.setQueryData(key as any, data);
  });
}

/**
 * Hook: Fetch user's favorites with caching
 * @param type - Filter by type ('service' or 'provider'), undefined for all
 * @param enabled - Whether to run the query (default: true)
 */
export function useFavorites(type?: FavoriteType, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.favorites.lists(), { type }],
    queryFn: () => getMyFavorites(type),
    enabled,

    // ✅ Favorites should feel instant / always current
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,

    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Toggle service favorite (add or remove)
 * ✅ Optimistic update across ALL favorites list caches (any type filter)
 * ✅ Rolls back on error
 * ✅ Invalidates on settle to ensure consistency with server
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => toggleFavorite(serviceId),

    onMutate: async (serviceId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.lists() });

      const previous = snapshotFavoritesLists(queryClient);

      // We don't know if toggle is add/remove without server response,
      // so we optimistically remove if it exists; otherwise we leave it
      // (invalidateQueries onSettled will sync it).
      queryClient.setQueriesData<AnyFav[]>(
        { queryKey: queryKeys.favorites.lists() },
        (old) => {
          if (!old) return old;
          // many APIs store service favorites as fav.service_id, or sometimes fav.id === serviceId
          const has = old.some((f) => f?.service_id === serviceId || f?.id === serviceId);
          if (!has) return old; // likely adding, let server sync
          return old.filter((f) => !(f?.service_id === serviceId || f?.id === serviceId));
        }
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      rollbackSnapshots(queryClient, context?.previous);
    },

    onSettled: () => {
      invalidateQueries.favorites();
    },
  });
}

/**
 * Hook: Remove service from favorites
 * ✅ Optimistic update across ALL favorites list caches
 * ✅ Rolls back on error
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => removeFavorite(serviceId),

    onMutate: async (serviceId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.lists() });

      const previous = snapshotFavoritesLists(queryClient);

      queryClient.setQueriesData<AnyFav[]>(
        { queryKey: queryKeys.favorites.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((fav) => !(fav?.service_id === serviceId || fav?.id === serviceId));
        }
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      rollbackSnapshots(queryClient, context?.previous);
    },

    onSettled: () => {
      invalidateQueries.favorites();
    },
  });
}

/**
 * Hook: Toggle provider favorite (add or remove)
 * ✅ Optimistic update across ALL favorites list caches
 * ✅ Rolls back on error
 */
export function useToggleProviderFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => toggleProviderFavorite(providerId),

    onMutate: async (providerId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.lists() });

      const previous = snapshotFavoritesLists(queryClient);

      // Optimistically remove if it exists, otherwise leave and let invalidate sync
      queryClient.setQueriesData<AnyFav[]>(
        { queryKey: queryKeys.favorites.lists() },
        (old) => {
          if (!old) return old;
          const has = old.some((f) => f?.provider_id === providerId || f?.id === providerId);
          if (!has) return old;
          return old.filter((f) => !(f?.provider_id === providerId || f?.id === providerId));
        }
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      rollbackSnapshots(queryClient, context?.previous);
    },

    onSettled: () => {
      invalidateQueries.favorites();
    },
  });
}

/**
 * Hook: Remove provider from favorites
 * ✅ Optimistic update across ALL favorites list caches
 * ✅ Rolls back on error
 */
export function useRemoveProviderFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerFavoriteId: string) => removeProviderFavorite(providerFavoriteId),

    onMutate: async (providerFavoriteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.lists() });

      const previous = snapshotFavoritesLists(queryClient);

      queryClient.setQueriesData<AnyFav[]>(
        { queryKey: queryKeys.favorites.lists() },
        (old) => {
          if (!old) return old;
          // your UI seems to store provider favorites with provider_favorite_id
          return old.filter((fav) => fav?.provider_favorite_id !== providerFavoriteId && fav?.id !== providerFavoriteId);
        }
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      rollbackSnapshots(queryClient, context?.previous);
    },

    onSettled: () => {
      invalidateQueries.favorites();
    },
  });
}
