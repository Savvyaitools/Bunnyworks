import { useSupabaseRead } from "./useSupabaseCRUD";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatterShift {
  id: string;
  chatter_id: string;
  creator_id: string;
  shift_start: string;
  shift_end: string;
  shift_type: string;
  notes: string | null;
  created_at: string;
  chatter?: {
    id: string;
    name: string;
    skill_grade: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

export type CreateShiftInput = Omit<ChatterShift, "id" | "created_at" | "chatter" | "creator">;

const SELECT_WITH_RELATIONS = `*, chatter:chatters(id, name, skill_grade), creator:creators(id, name)`;

export function useChatterShifts() {
  const queryClient = useQueryClient();

  const { items: shifts, loading, refetch } = useSupabaseRead<ChatterShift>({
    table: "chatter_shifts",
    queryKey: "chatter-shifts",
    select: SELECT_WITH_RELATIONS,
    orderBy: { column: "shift_start", ascending: true },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const { data, error } = await supabase
        .from("chatter_shifts")
        .insert(input)
        .select(SELECT_WITH_RELATIONS)
        .single();

      if (error) throw error;
      return data as ChatterShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatter-shifts"] });
      toast.success("Shift created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create shift: " + error.message);
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateShiftInput> }) => {
      const { data, error } = await supabase
        .from("chatter_shifts")
        .update(input)
        .eq("id", id)
        .select(SELECT_WITH_RELATIONS)
        .single();

      if (error) throw error;
      return data as ChatterShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatter-shifts"] });
      toast.success("Shift updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update shift: " + error.message);
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatter_shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatter-shifts"] });
      toast.success("Shift deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete shift: " + error.message);
    },
  });

  return {
    shifts,
    loading,
    createShift: createShiftMutation.mutateAsync,
    updateShift: (id: string, input: Partial<CreateShiftInput>) => updateShiftMutation.mutateAsync({ id, input }),
    deleteShift: deleteShiftMutation.mutateAsync,
    refetch,
  };
}
