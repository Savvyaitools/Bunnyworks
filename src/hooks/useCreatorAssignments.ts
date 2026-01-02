import { useSupabaseRead } from "./useSupabaseCRUD";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreatorAssignment {
  id: string;
  creator_id: string;
  chatter_id: string;
  role: string;
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

export function useCreatorAssignments() {
  const queryClient = useQueryClient();

  const { items: assignments, loading, refetch } = useSupabaseRead<CreatorAssignment>({
    table: "creator_assignments",
    queryKey: "creator-assignments",
    select: `*, chatter:chatters(id, name, skill_grade), creator:creators(id, name)`,
    orderBy: { column: "created_at", ascending: false },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async ({ creator_id, chatter_id, role = "chatter" }: { creator_id: string; chatter_id: string; role?: string }) => {
      const { data, error } = await supabase
        .from("creator_assignments")
        .insert({ creator_id, chatter_id, role })
        .select(`*, chatter:chatters(id, name, skill_grade), creator:creators(id, name)`)
        .single();

      if (error) throw error;
      return data as CreatorAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-assignments"] });
      toast.success("Assignment created");
    },
    onError: (error) => {
      toast.error("Failed to create assignment: " + error.message);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("creator_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-assignments"] });
      toast.success("Assignment removed");
    },
    onError: (error) => {
      toast.error("Failed to remove assignment: " + error.message);
    },
  });

  return {
    assignments,
    loading,
    createAssignment: (creator_id: string, chatter_id: string, role: string = "chatter") =>
      createAssignmentMutation.mutateAsync({ creator_id, chatter_id, role }),
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
    refetch,
  };
}
