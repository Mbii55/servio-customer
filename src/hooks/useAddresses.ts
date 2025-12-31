// src/hooks/useAddresses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  CreateAddressInput,
  UpdateAddressInput,
} from '../services/addresses';
import { Address } from '../types';

/**
 * Hook: Fetch user's addresses
 * ✅ Always fresh on screen open
 * ✅ Still cached, but refetches on mount
 */
export function useAddresses(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.addresses.lists(),
    queryFn: getMyAddresses,
    enabled,

    // ✅ Addresses are user data — should feel current
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,

    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Create new address
 * ✅ Auto-invalidates addresses list
 */
export function useCreateAddress() {
  return useMutation({
    mutationFn: (data: CreateAddressInput) => createAddress(data),
    onSuccess: () => {
      invalidateQueries.addresses();
    },
  });
}

/**
 * Hook: Update address
 * ✅ Optimistic update for is_default changes
 * ✅ Auto-invalidates addresses list
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: UpdateAddressInput }) =>
      updateAddress(addressId, data),

    onMutate: async ({ addressId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.addresses.lists() });

      const previousAddresses = queryClient.getQueryData<Address[]>(queryKeys.addresses.lists());

      // Optimistic: if setting default
      if (previousAddresses && data.is_default !== undefined) {
        queryClient.setQueryData<Address[]>(
          queryKeys.addresses.lists(),
          previousAddresses.map((addr) => ({
            ...addr,
            is_default: addr.id === addressId,
          }))
        );
      }

      return { previousAddresses };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAddresses) {
        queryClient.setQueryData(queryKeys.addresses.lists(), context.previousAddresses);
      }
    },

    onSettled: () => {
      invalidateQueries.addresses();
    },
  });
}

/**
 * Hook: Set default address
 * ✅ Optimistic update (instant UI)
 * ✅ Auto-invalidates addresses list
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => setDefaultAddress(addressId),

    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.addresses.lists() });

      const previousAddresses = queryClient.getQueryData<Address[]>(queryKeys.addresses.lists());

      if (previousAddresses) {
        queryClient.setQueryData<Address[]>(
          queryKeys.addresses.lists(),
          previousAddresses.map((addr) => ({
            ...addr,
            is_default: addr.id === addressId,
          }))
        );
      }

      return { previousAddresses };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAddresses) {
        queryClient.setQueryData(queryKeys.addresses.lists(), context.previousAddresses);
      }
    },

    onSettled: () => {
      invalidateQueries.addresses();
    },
  });
}

/**
 * Hook: Delete address
 * ✅ Optimistic removal (instant UI update)
 * ✅ Auto-invalidates addresses list
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),

    onMutate: async (addressId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.addresses.lists() });

      const previousAddresses = queryClient.getQueryData<Address[]>(queryKeys.addresses.lists());

      if (previousAddresses) {
        queryClient.setQueryData<Address[]>(
          queryKeys.addresses.lists(),
          previousAddresses.filter((addr) => addr.id !== addressId)
        );
      }

      return { previousAddresses };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAddresses) {
        queryClient.setQueryData(queryKeys.addresses.lists(), context.previousAddresses);
      }
    },

    onSettled: () => {
      invalidateQueries.addresses();
    },
  });
}

/**
 * Hook: Get single address by ID (for edit screen)
 * ✅ Uses the same query state from useAddresses
 */
export function useAddress(addressId: string | undefined, enabled: boolean = true) {
  const query = useAddresses(enabled && !!addressId);

  return {
    data: query.data?.find((addr) => addr.id === addressId),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
