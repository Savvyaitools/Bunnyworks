import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

export type SkillGrade = "A" | "B" | "C";

export interface Chatter {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  skill_grade: SkillGrade;
  timezone: string | null;
  is_active: boolean;
  avatar_seed: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateChatterInput = Omit<Chatter, "id" | "created_at" | "updated_at">;
export type UpdateChatterInput = Partial<CreateChatterInput>;

export function useChatters() {
  const queryClient = useQueryClient();

  const { data: chatters = [], isLoading: loading } = useQuery({
    queryKey: ["chatters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Chatter[];
    },
  });

  const createChatter = useMutation({
    mutationFn: async (input: CreateChatterInput) => {
      const { data, error } = await supabase
        .from("chatters")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Chatter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatters"] });
      toast.success("Chatter added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add chatter: " + error.message);
    },
  });

  const updateChatterMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateChatterInput }) => {
      const { data, error } = await supabase
        .from("chatters")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Chatter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatters"] });
      toast.success("Chatter updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update chatter: " + error.message);
    },
  });

  const updateChatter = async (id: string, input: UpdateChatterInput) => {
    return updateChatterMutation.mutateAsync({ id, input });
  };

  const deleteChatter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatters"] });
      toast.success("Chatter removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove chatter: " + error.message);
    },
  });

  const stats = useMemo(() => ({
    total: chatters.length,
    active: chatters.filter((c) => c.is_active).length,
    gradeA: chatters.filter((c) => c.skill_grade === "A").length,
    gradeB: chatters.filter((c) => c.skill_grade === "B").length,
    gradeC: chatters.filter((c) => c.skill_grade === "C").length,
  }), [chatters]);

  return {
    chatters,
    loading,
    stats,
    createChatter: createChatter.mutateAsync,
    updateChatter,
    deleteChatter: deleteChatter.mutateAsync,
  };
}
