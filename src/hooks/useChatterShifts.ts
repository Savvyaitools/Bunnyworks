import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

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

export function useChatterShifts() {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["chatter-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatter_shifts")
        .select(`
          *,
          chatter:chatters(id, name, skill_grade),
          creator:creators(id, name)
        `)
        .order("shift_start", { ascending: true });

      if (error) throw error;
      return data as ChatterShift[];
    },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (input: CreateShiftInput) => {
      const { data, error } = await supabase
        .from("chatter_shifts")
        .insert(input)
        .select(`
          *,
          chatter:chatters(id, name, skill_grade),
          creator:creators(id, name)
        `)
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
        .select(`
          *,
          chatter:chatters(id, name, skill_grade),
          creator:creators(id, name)
        `)
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

  const updateShift = async (id: string, input: Partial<CreateShiftInput>) => {
    return updateShiftMutation.mutateAsync({ id, input });
  };

  return {
    shifts,
    loading,
    createShift: createShiftMutation.mutateAsync,
    updateShift,
    deleteShift: deleteShiftMutation.mutateAsync,
    refetch,
  };
}
