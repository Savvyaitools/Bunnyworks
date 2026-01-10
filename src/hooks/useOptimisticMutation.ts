import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

interface OptimisticMutationConfig<TData, TVariables, TResult = TData> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TResult>;
  // How to update the cache optimistically
  updateCache: (oldData: TData[] | undefined, variables: TVariables) => TData[];
  // How to get the ID from variables (for update/delete operations)
  getId?: (variables: TVariables) => string;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Generic hook for optimistic mutations
 * Updates the cache immediately before the server responds
 */
export function useOptimisticMutation<TData extends { id: string }, TVariables, TResult = TData>(
  config: OptimisticMutationConfig<TData, TVariables, TResult>
) {
  const queryClient = useQueryClient();
  const {
    queryKey,
    mutationFn,
    updateCache,
    successMessage = "Updated successfully",
    errorMessage = "Update failed",
  } = config;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<TData[]>(queryKey, (old) => updateCache(old, variables));

      // Return context with the previous data
      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
    onSuccess: () => {
      toast.success(successMessage);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Hook for optimistic create operations
 */
export function useOptimisticCreate<TData extends { id: string }>(
  queryKey: QueryKey,
  mutationFn: (input: Partial<TData>) => Promise<TData>,
  successMessage = "Created successfully"
) {
  return useOptimisticMutation<TData, Partial<TData>, TData>({
    queryKey,
    mutationFn,
    updateCache: (oldData, newItem) => {
      // Add a temporary item with a placeholder ID
      const tempItem = {
        ...newItem,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      } as unknown as TData;
      return [...(oldData || []), tempItem];
    },
    successMessage,
    errorMessage: "Failed to create",
  });
}

/**
 * Hook for optimistic update operations
 */
export function useOptimisticUpdate<TData extends { id: string }>(
  queryKey: QueryKey,
  mutationFn: (params: { id: string; input: Partial<TData> }) => Promise<TData>,
  successMessage = "Updated successfully"
) {
  return useOptimisticMutation<TData, { id: string; input: Partial<TData> }, TData>({
    queryKey,
    mutationFn,
    updateCache: (oldData, { id, input }) => {
      return (oldData || []).map(item =>
        item.id === id ? { ...item, ...input } : item
      );
    },
    getId: ({ id }) => id,
    successMessage,
    errorMessage: "Failed to update",
  });
}

/**
 * Hook for optimistic delete operations
 */
export function useOptimisticDelete<TData extends { id: string }>(
  queryKey: QueryKey,
  mutationFn: (id: string) => Promise<void>,
  successMessage = "Deleted successfully"
) {
  return useOptimisticMutation<TData, string, void>({
    queryKey,
    mutationFn,
    updateCache: (oldData, id) => {
      return (oldData || []).filter(item => item.id !== id);
    },
    getId: (id) => id,
    successMessage,
    errorMessage: "Failed to delete",
  });
}