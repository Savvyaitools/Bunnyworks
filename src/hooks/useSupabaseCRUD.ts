import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CRUDConfig {
  table: string;
  queryKey: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  filter?: { column: string; value: unknown };
  /** Additional filters applied via .eq() */
  filters?: { column: string; value: unknown }[];
  /** When false, the initial SELECT query will not run. */
  enabled?: boolean;
  /** Max rows per page (default 500). Set to 0 for no limit. */
  pageSize?: number;
  messages?: {
    createSuccess?: string;
    createError?: string;
    updateSuccess?: string;
    updateError?: string;
    deleteSuccess?: string;
    deleteError?: string;
  };
}

export function useSupabaseCRUD<T extends { id: string }>(config: CRUDConfig) {
  const queryClient = useQueryClient();
  const {
    table,
    queryKey,
    select = "*",
    orderBy,
    filter,
    filters,
    enabled = true,
    pageSize = 500,
    messages = {},
  } = config;

  const defaultMessages = {
    createSuccess: "Created successfully",
    createError: "Failed to create",
    updateSuccess: "Updated successfully",
    updateError: "Failed to update",
    deleteSuccess: "Deleted successfully",
    deleteError: "Failed to delete",
    ...messages,
  };

  // Fetch all items with pagination safety
  const { data: items = [], isLoading: loading, refetch } = useQuery({
    queryKey: [queryKey, filter?.value],
    enabled,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from(table as any).select(select);

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      if (filters) {
        for (const f of filters) {
          query = query.eq(f.column, f.value);
        }
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      // Apply range to prevent hitting the 1000-row default limit
      if (pageSize > 0) {
        query = query.range(0, pageSize - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (input: Record<string, any>) => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(input as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(defaultMessages.createSuccess);
    },
    onError: (error: Error) => {
      toast.error(`${defaultMessages.createError}: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<T> }) => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(input as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(defaultMessages.updateSuccess);
    },
    onError: (error: Error) => {
      toast.error(`${defaultMessages.updateError}: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(defaultMessages.deleteSuccess);
    },
    onError: (error: Error) => {
      toast.error(`${defaultMessages.deleteError}: ${error.message}`);
    },
  });

  return {
    items,
    loading,
    refetch,
    create: createMutation.mutateAsync,
    update: (id: string, input: Partial<T>) => updateMutation.mutateAsync({ id, input }),
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Simplified hook for read-only data
export function useSupabaseRead<T>(config: Omit<CRUDConfig, "messages">) {
  const { table, queryKey, select = "*", orderBy, filter, filters, enabled = true, pageSize = 500 } = config;

  const { data: items = [], isLoading: loading, refetch } = useQuery({
    queryKey: [queryKey, filter?.value],
    enabled,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = supabase.from(table as any).select(select);

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      if (filters) {
        for (const f of filters) {
          query = query.eq(f.column, f.value);
        }
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      if (pageSize > 0) {
        query = query.range(0, pageSize - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  return { items, loading, refetch };
}
