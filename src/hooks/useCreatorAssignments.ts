import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreatorAssignment {
  id: string;
  creator_id: string;
  chatter_id: string;
  role: string;
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

export function useCreatorAssignments() {
  const [assignments, setAssignments] = useState<CreatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("creator_assignments")
        .select(`
          *,
          chatter:chatters(id, name, skill_grade),
          creator:creators(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data as CreatorAssignment[]);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssignment = async (creator_id: string, chatter_id: string, role: string = "chatter") => {
    try {
      const { data, error } = await supabase
        .from("creator_assignments")
        .insert({ creator_id, chatter_id, role })
        .select(`
          *,
          chatter:chatters(id, name, skill_grade),
          creator:creators(id, name)
        `)
        .single();

      if (error) throw error;
      setAssignments((prev) => [data as CreatorAssignment, ...prev]);
      toast.success("Assignment created");
      return data as CreatorAssignment;
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
      return null;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from("creator_assignments").delete().eq("id", id);

      if (error) throw error;
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assignment removed");
      return true;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to remove assignment");
      return false;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    createAssignment,
    deleteAssignment,
    refetch: fetchAssignments,
  };
}
