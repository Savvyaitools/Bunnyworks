import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizeError, getUserMessage } from "@/core/errors";

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

/**
 * Build a Supabase query with filters, ordering, and pagination.
 * Shared between useSupabaseCRUD and useSupabaseRead to eliminate duplication.
 */
function buildQuery(
  table: string,
  select: string,
  options: {
    filter?: { column: string; value: unknown };
    filters?: { column: string; value: unknown }[];
    orderBy?: { column: string; ascending?: boolean };
    pageSize: number;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from(table as any).select(select);

  if (options.filter) {
    query = query.eq(options.filter.column, options.filter.value);
  }

  if (options.filters) {
    for (const f of options.filters) {
      query = query.eq(f.column, f.value);
    }
  }

  if (options.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? false });
  }

  if (options.pageSize > 0) {
    query = query.range(0, options.pageSize - 1);
  }

  return query;
}

/**
 * Handle mutation errors with normalized error messages.
 */
function handleMutationError(err: unknown, prefix: string) {
  const appError = normalizeError(err);
  toast.error(`${prefix}: ${getUserMessage(appError)}`);
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

  const queryKeyArray = [queryKey, filter?.value];

  // Fetch all items with pagination safety
  const { data: items = [], isLoading: loading, refetch } = useQuery({
    queryKey: queryKeyArray,
    enabled,
    queryFn: async () => {
      const query = buildQuery(table, select, { filter, filters, orderBy, pageSize });
      const { data, error } = await query;
      if (error) throw normalizeError(error);
      return (data ?? []) as unknown as T[];
    },
  });

  // Create mutation with optimistic update
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

      if (error) throw normalizeError(error);
      return data as unknown as T;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] });
      const previous = queryClient.getQueryData(queryKeyArray);
      const optimistic = { id: `temp-${Date.now()}`, ...input } as unknown as T;
      queryClient.setQueryData(queryKeyArray, (old: T[] | undefined) => [...(old || []), optimistic]);
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(defaultMessages.createSuccess);
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeyArray, context.previous);
      }
      handleMutationError(error, defaultMessages.createError);
    },
  });

  // Update mutation with optimistic update
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

      if (error) throw normalizeError(error);
      return data as unknown as T;
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] });
      const previous = queryClient.getQueryData(queryKeyArray);
      queryClient.setQueryData(queryKeyArray, (old: T[] | undefined) =>
        (old || []).map(item => item.id === id ? { ...item, ...input } : item)
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(defaultMessages.updateSuccess);
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeyArray, context.previous);
      }
      handleMutationError(error, defaultMessages.updateError);
    },
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw normalizeError(error);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] });
      const previous = queryClient.getQueryData(queryKeyArray);
      queryClient.setQueryData(queryKeyArray, (old: T[] | undefined) =>
        (old || []).filter(item => item.id !== id)
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(defaultMessages.deleteSuccess);
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeyArray, context.previous);
      }
      handleMutationError(error, defaultMessages.deleteError);
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

/**
 * Simplified hook for read-only data.
 * Reuses buildQuery to eliminate duplicated filter/sort/pagination logic.
 */
export function useSupabaseRead<T>(config: Omit<CRUDConfig, "messages">) {
  const { table, queryKey, select = "*", orderBy, filter, filters, enabled = true, pageSize = 500 } = config;

  const { data: items = [], isLoading: loading, refetch } = useQuery({
    queryKey: [queryKey, filter?.value],
    enabled,
    queryFn: async () => {
      const query = buildQuery(table, select, { filter, filters, orderBy, pageSize });
      const { data, error } = await query;
      if (error) throw normalizeError(error);
      return (data ?? []) as unknown as T[];
    },
  });

  return { items, loading, refetch };
}
