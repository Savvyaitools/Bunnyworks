import { useSupabaseRead } from "./useSupabaseCRUD";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SessionLinkAssignment {
  id: string;
  session_link_id: string;
  chatter_id: string;
  shift_id: string | null;
  assigned_at: string;
  accessed_at: string | null;
  access_count: number;
  last_access_ip: string | null;
  session_link?: {
    id: string;
    platform: string;
    session_status: string | null;
    creator?: {
      id: string;
      name: string;
    };
  };
  chatter?: {
    id: string;
    name: string;
    skill_grade: string;
  };
  shift?: {
    id: string;
    shift_start: string;
    shift_end: string;
  };
}

export type CreateAssignmentInput = {
  session_link_id: string;
  chatter_id: string;
  shift_id?: string | null;
};

const SELECT_WITH_RELATIONS = `
  *,
  session_link:creator_session_links(
    id,
    platform,
    session_status,
    creator:creators(id, name)
  ),
  chatter:chatters(id, name, skill_grade),
  shift:chatter_shifts(id, shift_start, shift_end)
`;

export function useSessionLinkAssignments(sessionLinkId?: string) {
  const queryClient = useQueryClient();

  const { items: assignments, loading, refetch } = useSupabaseRead<SessionLinkAssignment>({
    table: "session_link_assignments",
    queryKey: sessionLinkId ? `session_assignments_${sessionLinkId}` : "session_assignments",
    select: SELECT_WITH_RELATIONS,
    orderBy: { column: "assigned_at", ascending: false },
    filter: sessionLinkId ? { column: "session_link_id", value: sessionLinkId } : undefined,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      const { data, error } = await supabase
        .from("session_link_assignments")
        .insert(input)
        .select(SELECT_WITH_RELATIONS)
        .single();

      if (error) throw error;
      return data as SessionLinkAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session_assignments"] });
      if (sessionLinkId) {
        queryClient.invalidateQueries({ queryKey: [`session_assignments_${sessionLinkId}`] });
      }
      toast.success("Session assigned to chatter");
    },
    onError: (error) => {
      toast.error("Failed to assign session: " + error.message);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("session_link_assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session_assignments"] });
      if (sessionLinkId) {
        queryClient.invalidateQueries({ queryKey: [`session_assignments_${sessionLinkId}`] });
      }
      toast.success("Assignment removed");
    },
    onError: (error) => {
      toast.error("Failed to remove assignment: " + error.message);
    },
  });

  return {
    assignments,
    loading,
    createAssignment: createAssignmentMutation.mutateAsync,
    deleteAssignment: deleteAssignmentMutation.mutateAsync,
    refetch,
  };
}
