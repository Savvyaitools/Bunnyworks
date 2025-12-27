import { useState, useEffect, useCallback } from "react";
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
  // Joined data
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
  const [shifts, setShifts] = useState<ChatterShift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("chatter_shifts")
        .select(`
          *,
          chatter:chatters(id, name, skill_grade),
          creator:creators(id, name)
        `)
        .order("shift_start", { ascending: true });

      if (error) throw error;
      setShifts(data as ChatterShift[]);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, []);

  const createShift = async (input: CreateShiftInput) => {
    try {
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
      setShifts((prev) => [...prev, data as ChatterShift].sort((a, b) => 
        new Date(a.shift_start).getTime() - new Date(b.shift_start).getTime()
      ));
      toast.success("Shift created successfully");
      return data as ChatterShift;
    } catch (error) {
      console.error("Error creating shift:", error);
      toast.error("Failed to create shift");
      return null;
    }
  };

  const updateShift = async (id: string, input: Partial<CreateShiftInput>) => {
    try {
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
      setShifts((prev) => prev.map((s) => (s.id === id ? (data as ChatterShift) : s)));
      toast.success("Shift updated successfully");
      return data as ChatterShift;
    } catch (error) {
      console.error("Error updating shift:", error);
      toast.error("Failed to update shift");
      return null;
    }
  };

  const deleteShift = async (id: string) => {
    try {
      const { error } = await supabase.from("chatter_shifts").delete().eq("id", id);

      if (error) throw error;
      setShifts((prev) => prev.filter((s) => s.id !== id));
      toast.success("Shift deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast.error("Failed to delete shift");
      return false;
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return {
    shifts,
    loading,
    createShift,
    updateShift,
    deleteShift,
    refetch: fetchShifts,
  };
}
